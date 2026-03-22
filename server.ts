console.log("[Server] Script starting...");
import "dotenv/config";
console.log("[Server] Dotenv loaded");
import express from "express";
console.log("[Server] Express imported");
import { createServer as createViteServer } from "vite";
console.log("[Server] Vite imported");
import db from "./src/lib/db.js";
console.log("[Server] Database imported");
import path from "path";
import { SquareClient, SquareEnvironment } from 'square';
import crypto from 'crypto';
import multer from 'multer';
import fs from 'fs';
import nodemailer from 'nodemailer';
import webpush from 'web-push';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
export const adminApp = initializeApp({
  credential: cert(serviceAccount)
});
export const adminDb = getFirestore();

// Helper to resolve string Firebase UID to numeric SQLite ID
function resolveUserId(userId: string | number): number | string {
  if (typeof userId === 'number') return userId;
  if (!isNaN(Number(userId))) return Number(userId);
  
  const user = db.prepare('SELECT id FROM users WHERE uid = ?').get(userId) as { id: number } | undefined;
  return user ? user.id : userId;
}

const upload = multer({ dest: 'uploads/' });

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

let squareClient: SquareClient | null = null;
export function getSquare(): SquareClient {
  if (!squareClient) {
    const token = process.env.SQUARE_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT;
    console.log(`Initializing Square Client: Env=${environment}, TokenLength=${token?.length}`);
    
    if (!token) {
      throw new Error('SQUARE_ACCESS_TOKEN environment variable is required');
    }
    squareClient = new SquareClient({
      environment: environment === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
      token: token,
    });
  }
  return squareClient;
}

console.log("Starting server script...");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

// Web Push Setup
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:kromefitness@gmail.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

async function sendNotification(userId: number, title: string, body: string, url: string = '/') {
  const user = db.prepare('SELECT email, first_name, email_notifications, push_notifications FROM users WHERE id = ?').get(userId) as any;
  if (!user) return;

  // 1. Send Push Notification
  if (user.push_notifications === 1) {
    try {
      const subscriptions = db.prepare('SELECT subscription FROM push_subscriptions WHERE user_id = ?').all(userId) as { subscription: string }[];
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            JSON.parse(sub.subscription),
            JSON.stringify({ title, body, url })
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired or no longer valid
            db.prepare('DELETE FROM push_subscriptions WHERE subscription = ?').run(sub.subscription);
          }
        }
      }
    } catch (err) {
      console.error('Push notification error:', err);
    }
  }

  // 2. Send Email Notification
  if (user.email_notifications === 1 && user.email) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        requireTLS: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: '"KROME Sports Performance" <kromefitness@gmail.com>',
        to: user.email,
        subject: title,
        text: `Hello ${user.first_name || 'Athlete'},\n\n${body}\n\nView here: ${process.env.APP_URL}${url}\n\nBest regards,\nThe KROME Team`,
      });
    } catch (err) {
      console.error('Email notification error:', err);
    }
  }
}

async function startServer() {
  console.log("startServer() called");
  console.log("Initializing express app...");
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Trust proxy for correct protocol/IP detection behind nginx
  app.set('trust proxy', true);

  console.log("Setting up middleware...");
  
  // Log environment info (excluding secrets)
  console.log(`[Server] PORT: ${PORT}`);
  console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Server] APP_URL: ${process.env.APP_URL}`);
  console.log(`[Server] VAPID_PUBLIC_KEY set: ${!!process.env.VAPID_PUBLIC_KEY}`);
  console.log(`[Server] SMTP_HOST set: ${!!process.env.SMTP_HOST}`);
  console.log(`[Server] SQUARE_ACCESS_TOKEN set: ${!!process.env.SQUARE_ACCESS_TOKEN}`);
  
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ limit: '5mb', extended: true }));
  
  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - Host: ${req.headers.host}`);
    next();
  });

  console.log(`APP_URL: ${process.env.APP_URL}`);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      appUrl: process.env.APP_URL
    });
  });

  // Serve uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Square Webhook
  app.post('/api/webhook', async (req, res) => {
    try {
      const event = req.body;
      
      if (event.type === 'payment.created') {
        const payment = event.data.object.payment;
        const orderId = payment.order_id;
        
        if (orderId) {
          const square = getSquare();
          const response = await square.orders.get({ orderId });
          const order = response.order;
          
          if (order && order.metadata) {
            const userId = order.metadata.userId;
            const itemName = order.metadata.itemName || 'Unknown Item';
            const price = payment.amount_money?.amount ? Number(payment.amount_money.amount) / 100 : 0;

            if (userId) {
              const programId = order.metadata.programId;
              const sqliteId = resolveUserId(userId);
              db.prepare('INSERT INTO purchases (user_id, item_name, price, square_order_id, program_id) VALUES (?, ?, ?, ?, ?)').run(sqliteId, itemName, price, orderId, programId);
              
              // Send notification
              sendNotification(Number(userId), 'Purchase Confirmed', `Thank you for purchasing ${itemName}! Your program is now available in your profile.`, '/profile');

              // Auto-update user role if they bought a program
              if (itemName.toLowerCase().includes('program') || itemName.toLowerCase().includes('plan')) {
                db.prepare('UPDATE users SET role = ? WHERE id = ? AND role = ?').run('athlete', userId, 'athlete');
              }
            }
          }
        }
      }
      res.json({ received: true });
    } catch (err: any) {
      console.error('Webhook Error:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Square Checkout Session
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const square = getSquare();
      const { itemName, price, userId, programId } = req.body;
      
      const locationId = process.env.SQUARE_LOCATION_ID;
      if (!locationId) {
        console.error('SQUARE_LOCATION_ID is not set');
        return res.status(500).json({ error: 'SQUARE_LOCATION_ID is not configured' });
      }

      const response = await square.checkout.paymentLinks.create({
        idempotencyKey: crypto.randomUUID(),
        order: {
          locationId: locationId,
          lineItems: [
            {
              name: itemName,
              quantity: '1',
              basePriceMoney: {
                amount: BigInt(Math.round(price * 100)),
                currency: 'USD',
              },
            },
          ],
          metadata: {
            userId: userId ? String(userId) : '',
            itemName: itemName,
            programId: programId ? String(programId) : '',
          }
        },
        checkoutOptions: {
          redirectUrl: `${process.env.APP_URL || req.headers.origin || 'http://localhost:3000'}/?success=true`,
        }
      });
      
      res.json({ url: response.paymentLink?.url });
    } catch (err: any) {
      console.error('Square checkout error:', err);
      if (err.errors) {
        console.error('Square error details:', JSON.stringify(err.errors, null, 2));
      }
      res.status(500).json({ error: err.message });
    }
  });

  // --- API ROUTES ---

  // Push Subscriptions
  app.post('/api/notifications/subscribe', (req, res) => {
    const { userId, subscription } = req.body;
    const sqliteId = resolveUserId(userId);
    try {
      db.prepare('INSERT INTO push_subscriptions (user_id, subscription) VALUES (?, ?)').run(sqliteId, JSON.stringify(subscription));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get('/api/notifications/vapid-public-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
  });

  app.post('/api/notifications/test', async (req, res) => {
    const { userId } = req.body;
    try {
      await sendNotification(Number(userId), 'Test Notification', 'This is a test notification from KROME Fitness!', '/profile');
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });

  // Contact Form
  app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        requireTLS: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Send email to KROME
      await transporter.sendMail({
        from: `"${name}" <${email}>`,
        to: 'kromefitness@gmail.com',
        subject: `New Contact Request from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      });

      // Send confirmation email to user
      await transporter.sendMail({
        from: '"KROME Sports Performance" <kromefitness@gmail.com>',
        to: email,
        subject: 'Confirmation: We received your message',
        text: `Hello ${name},\n\nThank you for contacting KROME Sports Performance. We have received your message and will get back to you soon.\n\nHere is a copy of your message:\n\n"${message}"\n\nBest regards,\nThe KROME Team`,
      });

      res.json({ success: true });
    } catch (err) {
      console.error('Email error:', err);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // File Upload
  app.post('/api/files/upload', upload.single('file'), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ filename: req.file.filename, originalName: req.file.originalname });
  });

  // File Download
  app.get('/api/files/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  });

  // Users: Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const snapshot = await adminDb.collection('users').get();
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.name || data.email,
          email: data.email,
          role: data.role === 'admin' ? 'admin' : 'user',
          status: 'active', // Default status
          avatarUrl: data.avatarUrl
        };
      });
      res.json(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Leads: Get all leads
  app.get("/api/leads", (req, res) => {
    try {
      const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
      res.json(leads.map((l: any) => ({
        id: l.id,
        name: l.name,
        email: l.email,
        status: l.status,
        value: l.value,
        userId: l.user_id,
        dateAdded: l.created_at,
        lastContact: l.created_at, // Default to created_at if no last_contact field
        sports: l.sports ? JSON.parse(l.sports) : [],
        sessionRequests: l.session_requests ? JSON.parse(l.session_requests) : [],
        preferredTimes: l.preferred_times ? JSON.parse(l.preferred_times) : [],
        preferredDays: l.preferred_days ? JSON.parse(l.preferred_days) : [],
        positions: l.positions ? JSON.parse(l.positions) : []
      })));
    } catch (err) {
      console.error("Database error fetching leads:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Leads: Add lead
  app.post("/api/leads", (req, res) => {
    const { name, email, status, value, sports, sessionRequests, preferredTimes, preferredDays, positions, userId } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO leads (
          name, email, status, value, sports, session_requests, 
          preferred_times, preferred_days, positions, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name, 
        email, 
        status || 'New Lead', 
        value || 0,
        sports ? JSON.stringify(sports) : null,
        sessionRequests ? JSON.stringify(sessionRequests) : null,
        preferredTimes ? JSON.stringify(preferredTimes) : null,
        preferredDays ? JSON.stringify(preferredDays) : null,
        positions ? JSON.stringify(positions) : null,
        userId || null
      );
      res.json({ 
        id: result.lastInsertRowid,
        name,
        email,
        status: status || 'New Lead',
        value: value || 0,
        userId: userId || null,
        dateAdded: new Date().toISOString(),
        lastContact: new Date().toISOString(),
        sports: sports || [],
        sessionRequests: sessionRequests || [],
        preferredTimes: preferredTimes || [],
        preferredDays: preferredDays || [],
        positions: positions || []
      });
    } catch (err) {
      console.error("Database error adding lead:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Leads: Update lead
  const updateLeadHandler = (req: any, res: any) => {
    const { id } = req.params;
    const { status, value, sports, sessionRequests, preferredTimes, preferredDays, positions } = req.body;
    try {
      const updates: string[] = [];
      const params: any[] = [];

      if (status !== undefined) { updates.push('status = ?'); params.push(status); }
      if (value !== undefined) { updates.push('value = ?'); params.push(value); }
      if (sports !== undefined) { updates.push('sports = ?'); params.push(JSON.stringify(sports)); }
      if (sessionRequests !== undefined) { updates.push('session_requests = ?'); params.push(JSON.stringify(sessionRequests)); }
      if (preferredTimes !== undefined) { updates.push('preferred_times = ?'); params.push(JSON.stringify(preferredTimes)); }
      if (preferredDays !== undefined) { updates.push('preferred_days = ?'); params.push(JSON.stringify(preferredDays)); }
      if (positions !== undefined) { updates.push('positions = ?'); params.push(JSON.stringify(positions)); }

      if (updates.length > 0) {
        params.push(id);
        db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error("Database error updating lead:", err);
      res.status(500).json({ error: "Database error" });
    }
  };

  app.patch("/api/leads/:id", updateLeadHandler);
  app.put("/api/leads/:id", updateLeadHandler);

  // Leads: Delete lead
  app.delete("/api/leads/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM leads WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    const { username, email, firstName, lastName, first_name, last_name, role, uid } = req.body;
    try {
      const finalFirstName = firstName || first_name || "";
      const finalLastName = lastName || last_name || "";
      
      // 1. Create user document in Firestore
      const userData = {
        uid: uid,
        email,
        firstName: finalFirstName,
        lastName: finalLastName,
        username: username || email.split('@')[0],
        role: email === 'swolecode@gmail.com' ? 'admin' : (role === 'user' ? 'athlete' : (role || 'athlete')),
        createdAt: new Date().toISOString()
      };
      await adminDb.collection('users').doc(uid).set(userData);

      // 2. Sync with SQLite
      const insert = db.prepare(`
        INSERT INTO users (username, email, first_name, last_name, role, uid) 
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET 
          username=excluded.username,
          first_name=excluded.first_name,
          last_name=excluded.last_name,
          uid=excluded.uid
      `);
      const result = insert.run(
        userData.username,
        email,
        userData.firstName,
        userData.lastName,
        userData.role,
        uid
      );

      // 3. Send Welcome Email to Athlete
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          requireTLS: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: '"KROME Sports Performance" <kromefitness@gmail.com>',
          to: email,
          subject: 'Welcome to KROME Sports Performance!',
          text: `Hello ${finalFirstName},\n\nWelcome to KROME Sports Performance! We're excited to have you on board. Your account has been successfully created.\n\nYou can now log in and start tracking your progress, workouts, and nutrition.\n\nBest regards,\nThe KROME Team`,
        });

        // 4. Send Notification Email to Admin
        await transporter.sendMail({
          from: '"KROME System" <kromefitness@gmail.com>',
          to: 'kromefitness@gmail.com', // Admin email
          subject: 'New Athlete Registered',
          text: `A new athlete has registered:\n\nName: ${finalFirstName} ${finalLastName}\nEmail: ${email}\nUsername: ${userData.username}\nRole: ${userData.role}\n\nCheck the admin dashboard for more details.`,
        });
      } catch (emailErr) {
        console.error("Error sending registration emails:", emailErr);
        // Don't fail registration if emails fail
      }

      res.json({ 
        id: uid, 
        sqliteId: result.lastInsertRowid, 
        ...userData,
        first_name: userData.firstName,
        last_name: userData.lastName
      });
    } catch (err) {
      console.error("Registration sync error:", err);
      res.status(500).json({ error: "Registration sync failed" });
    }
  });

  // User: Get profile by UID
  app.get("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
      // Try Firestore first
      const doc = await adminDb.collection('users').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        // Also get SQLite ID if needed
        const sqliteUser = db.prepare('SELECT id FROM users WHERE uid = ? OR email = ?').get(id, data?.email);
        return res.json({ 
          id, 
          sqliteId: sqliteUser?.id, 
          ...data,
          first_name: data?.firstName || data?.first_name,
          last_name: data?.lastName || data?.last_name,
          firstName: data?.firstName || data?.first_name,
          lastName: data?.lastName || data?.last_name
        });
      }

      // Fallback to SQLite
      const user = db.prepare('SELECT * FROM users WHERE uid = ? OR id = ?').get(id, id);
      if (user) {
        return res.json({
          ...user,
          id: user.uid || String(user.id),
          sqliteId: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          first_name: user.first_name,
          last_name: user.last_name
        });
      }

      res.status(404).json({ error: "User not found" });
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // User: Delete profile
  app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await adminDb.collection('users').doc(id).delete();
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Get first admin
  app.get("/api/admin/primary", async (req, res) => {
    try {
      const snapshot = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
      if (snapshot.empty) {
        res.json(null);
      } else {
        const admin = snapshot.docs[0].data();
        res.json({ id: snapshot.docs[0].id, ...admin });
      }
    } catch (err) {
      console.error("Error fetching primary admin:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Get all users
  app.get("/api/admin/users", async (req, res) => {
    console.log("Fetching users...");
    try {
      const snapshot = await adminDb.collection('users').get();
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.firstName ? `${data.firstName} ${data.lastName}` : data.email,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          avatar_url: data.avatarUrl,
          role: data.role,
          status: 'active',
          created_at: data.createdAt
        };
      });
      console.log("Users fetched:", users);
      res.json(users);
    } catch (err) {
      console.error("Database error in /api/admin/users:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Update user role
  app.patch("/api/admin/users/:id/role", async (req, res) => {
    const { id } = req.params;
    const { role, adminId } = req.body;
    
    // Basic authorization check
    if (adminId) {
      const adminDoc = await adminDb.collection('users').doc(adminId).get();
      const admin = adminDoc.data();
      if (admin?.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Only admins can change roles" });
      }
    }

    try {
      await adminDb.collection('users').doc(id).update({ role });
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating user role:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Delete user
  app.delete("/api/admin/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await adminDb.collection('users').doc(id).delete();
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Assign program to user
  app.post("/api/admin/assign-program", (req, res) => {
    const { userId, programId, itemName, price } = req.body;
    const sqliteId = resolveUserId(userId);
    try {
      db.prepare('INSERT INTO purchases (user_id, item_name, price, program_id) VALUES (?, ?, ?, ?)').run(sqliteId, itemName, price || 0, programId);
      res.json({ success: true });
    } catch (err) {
      console.error("Error assigning program:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Get all purchases
  app.get("/api/admin/purchases", (req, res) => {
    try {
      const purchases = db.prepare(`
        SELECT p.*, u.username, u.first_name, u.last_name, u.email 
        FROM purchases p 
        LEFT JOIN users u ON p.user_id = u.id 
        ORDER BY p.created_at DESC
      `).all();
      res.json(purchases);
    } catch (err) {
      console.error("Database error in /api/admin/purchases:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Get Real-time Growth KPIs
  app.get("/api/admin/growth-kpis", (req, res) => {
    try {
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonth = prevMonthDate.getMonth() + 1;
      const prevYear = prevMonthDate.getFullYear();
      
      // For PMTD (Previous Month-to-Date), handle cases where previous month has fewer days
      const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      const compareDay = Math.min(currentDay, lastDayOfPrevMonth);

      const formatMonth = (m: number) => m.toString().padStart(2, '0');
      const formatDay = (d: number) => d.toString().padStart(2, '0');

      // Date strings for SQLite comparison (YYYY-MM-DD HH:MM:SS)
      const currentMonthStart = `${currentYear}-${formatMonth(currentMonth)}-01 00:00:00`;
      const prevMonthStart = `${prevYear}-${formatMonth(prevMonth)}-01 00:00:00`;
      const prevMonthMTDEnd = `${prevYear}-${formatMonth(prevMonth)}-${formatDay(compareDay)} 23:59:59`;

      // 1. Revenue Metrics
      const totalRevenue = db.prepare('SELECT SUM(price) as total FROM purchases').get() as { total: number };
      
      const currentMonthRevenue = db.prepare(`
        SELECT SUM(price) as total FROM purchases 
        WHERE created_at >= ?
      `).get(currentMonthStart) as { total: number };
      
      const prevMonthMTDRevenue = db.prepare(`
        SELECT SUM(price) as total FROM purchases 
        WHERE created_at >= ? AND created_at <= ?
      `).get(prevMonthStart, prevMonthMTDEnd) as { total: number };

      // 2. User Metrics
      const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'athlete'").get() as { count: number };
      
      const currentMonthUsers = db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE role = 'athlete' AND created_at >= ?
      `).get(currentMonthStart) as { count: number };
      
      const prevMonthMTDUsers = db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE role = 'athlete' AND created_at >= ? AND created_at <= ?
      `).get(prevMonthStart, prevMonthMTDEnd) as { count: number };

      // 3. Lead Metrics
      const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number };
      
      const currentMonthLeads = db.prepare(`
        SELECT COUNT(*) as count FROM leads 
        WHERE created_at >= ?
      `).get(currentMonthStart) as { count: number };
      
      const prevMonthMTDLeads = db.prepare(`
        SELECT COUNT(*) as count FROM leads 
        WHERE created_at >= ? AND created_at <= ?
      `).get(prevMonthStart, prevMonthMTDEnd) as { count: number };

      // 4. Conversion Metrics
      const closedWonLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'Closed Won'").get() as { count: number };
      const consultations = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status IN ('Consultation Scheduled', 'Consultation Completed', 'Closed Won', 'Consultation')").get() as { count: number };

      // Calculate Percentages (MTD vs PMTD)
      const calculateGrowth = (current: number, previous: number) => {
        if (!previous || previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const revenueGrowth = calculateGrowth(currentMonthRevenue.total || 0, prevMonthMTDRevenue.total || 0);
      const userGrowth = calculateGrowth(currentMonthUsers.count || 0, prevMonthMTDUsers.count || 0);
      const leadGrowth = calculateGrowth(currentMonthLeads.count || 0, prevMonthMTDLeads.count || 0);

      const mrr = currentMonthRevenue.total || 0;
      const ltv = totalUsers.count > 0 ? (totalRevenue.total || 0) / totalUsers.count : 0;

      res.json({
        totalRevenue: totalRevenue.total || 0,
        mrr,
        ltv,
        totalUsers: totalUsers.count,
        totalLeads: totalLeads.count,
        closedWon: closedWonLeads.count,
        consultations: consultations.count,
        revenueGrowth: Number(revenueGrowth.toFixed(1)),
        userGrowth: Number(userGrowth.toFixed(1)),
        leadGrowth: Number(leadGrowth.toFixed(1)),
        conversionRate: totalLeads.count > 0 ? Number(((closedWonLeads.count / totalLeads.count) * 100).toFixed(1)) : 0,
        consultationRate: totalLeads.count > 0 ? Number(((consultations.count / totalLeads.count) * 100).toFixed(1)) : 0
      });
    } catch (err) {
      console.error("Error calculating growth KPIs:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // User: Update profile
  app.patch("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, avatar_url, firstName, lastName, avatarUrl, role, status, username } = req.body;
    try {
      const finalFirstName = first_name !== undefined ? first_name : firstName;
      const finalLastName = last_name !== undefined ? last_name : lastName;
      const finalAvatarUrl = avatar_url !== undefined ? avatar_url : avatarUrl;

      // 1. Update SQLite
      const fields = [];
      const params = [];
      
      if (finalFirstName !== undefined) { fields.push('first_name = ?'); params.push(finalFirstName); }
      if (finalLastName !== undefined) { fields.push('last_name = ?'); params.push(finalLastName); }
      if (email !== undefined) { fields.push('email = ?'); params.push(email); }
      if (username !== undefined) { fields.push('username = ?'); params.push(username); }
      if (finalAvatarUrl !== undefined) { fields.push('avatar_url = ?'); params.push(finalAvatarUrl); }
      if (role !== undefined) { fields.push('role = ?'); params.push(role); }
      if (status !== undefined) { fields.push('status = ?'); params.push(status); }
      
      if (fields.length > 0) {
        params.push(id, id); // For uid = ? OR id = ?
        db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE uid = ? OR id = ?`).run(...params);
      }

      // 2. Update Firestore if we have a UID
      // We need to find the UID if 'id' is numeric
      let uid = id;
      if (!isNaN(Number(id))) {
        const user = db.prepare('SELECT uid FROM users WHERE id = ?').get(id);
        if (user?.uid) uid = user.uid;
      }

      if (uid && typeof uid === 'string' && uid.length > 10) { // Basic check for Firebase UID
        const firestoreUpdate: any = {};
        if (finalFirstName !== undefined) firestoreUpdate.firstName = finalFirstName;
        if (finalLastName !== undefined) firestoreUpdate.lastName = finalLastName;
        if (email !== undefined) firestoreUpdate.email = email;
        if (username !== undefined) firestoreUpdate.username = username;
        if (finalAvatarUrl !== undefined) firestoreUpdate.avatarUrl = finalAvatarUrl;
        if (role !== undefined) firestoreUpdate.role = role;
        if (status !== undefined) firestoreUpdate.status = status;

        if (Object.keys(firestoreUpdate).length > 0) {
          await adminDb.collection('users').doc(uid).update(firestoreUpdate);
        }
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // User: Mark PAR-Q as completed
  app.patch("/api/users/:id/parq-complete", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('UPDATE users SET parq_completed = 1 WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Progress: Get user progress
  app.get("/api/progress/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const snapshot = await adminDb.collection('progress').where('user_id', '==', userId).orderBy('recorded_at', 'asc').get();
      const progress = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(progress);
    } catch (err) {
      console.error("Error fetching progress:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Progress: Add progress entry
  app.post("/api/progress", async (req, res) => {
    const { user_id, metric_name, metric_value, unit } = req.body;
    try {
      const docRef = await adminDb.collection('progress').add({
        user_id,
        metric_name,
        metric_value,
        unit,
        recorded_at: new Date().toISOString()
      });
      res.json({ id: docRef.id, user_id, metric_name, metric_value, unit });
    } catch (err) {
      console.error("Error adding progress entry:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Progress: Delete entry
  app.delete("/api/progress/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await adminDb.collection('progress').doc(id).delete();
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting progress entry:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Nutrition: Get user logs
  app.get("/api/nutrition/:userId", async (req, res) => {
    const { userId } = req.params;
    console.log(`Fetching nutrition for user: ${userId}`);
    try {
      const snapshot = await adminDb.collection('nutrition_logs').where('user_id', '==', userId).orderBy('created_at', 'desc').get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(logs);
    } catch (err) {
      console.error("Error fetching nutrition logs:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Metrics: Get user metrics
  app.get("/api/metrics/:userId", (req, res) => {
    const { userId } = req.params;
    const sqliteId = resolveUserId(userId);
    try {
      const metrics = db.prepare('SELECT data FROM user_metrics WHERE user_id = ?').get(sqliteId) as { data: string } | undefined;
      if (metrics) {
        res.json(JSON.parse(metrics.data));
      } else {
        res.json(null);
      }
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Metrics: Save user metrics
  app.post("/api/metrics/:userId", (req, res) => {
    const { userId } = req.params;
    const sqliteId = resolveUserId(userId);
    const data = req.body;
    try {
      db.prepare(`
        INSERT INTO user_metrics (user_id, data, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET 
          data=excluded.data, 
          updated_at=CURRENT_TIMESTAMP
      `).run(sqliteId, JSON.stringify(data));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Body Comp History: Get user history
  app.get("/api/body-comp/:userId", (req, res) => {
    const { userId } = req.params;
    const sqliteId = resolveUserId(userId);
    try {
      const history = db.prepare('SELECT * FROM body_comp_history WHERE user_id = ? ORDER BY week ASC').all(sqliteId);
      res.json(history.map((h: any) => ({
        id: h.id,
        week: h.week,
        date: h.date,
        weight: h.weight,
        height: h.height,
        bmi: h.bmi,
        bodyFat: h.body_fat,
        leanMuscle: h.lean_muscle,
        fatMass: h.fat_mass
      })));
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Body Comp History: Save user history
  app.post("/api/body-comp/:userId", (req, res) => {
    const { userId } = req.params;
    const sqliteId = resolveUserId(userId);
    const { history } = req.body;
    try {
      const insert = db.prepare(`
        INSERT INTO body_comp_history (id, user_id, week, date, weight, height, bmi, body_fat, lean_muscle, fat_mass) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET 
          week = excluded.week,
          date = excluded.date,
          weight = excluded.weight,
          height = excluded.height,
          bmi = excluded.bmi,
          body_fat = excluded.body_fat,
          lean_muscle = excluded.lean_muscle,
          fat_mass = excluded.fat_mass
      `);
      
      const deleteStmt = db.prepare('DELETE FROM body_comp_history WHERE user_id = ?');
      
      db.transaction(() => {
        deleteStmt.run(sqliteId);
        for (const entry of history) {
          insert.run(
            entry.id, 
            sqliteId, 
            entry.week, 
            entry.date, 
            entry.weight, 
            entry.height, 
            entry.bmi, 
            entry.bodyFat, 
            entry.leanMuscle, 
            entry.fatMass
          );
        }
      })();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // PARQ: Get user PARQ
  app.get("/api/parq/:userId", (req, res) => {
    const { userId } = req.params;
    const sqliteId = resolveUserId(userId);
    try {
      const parq = db.prepare('SELECT data FROM user_parq WHERE user_id = ?').get(sqliteId) as { data: string } | undefined;
      if (parq) {
        res.json(JSON.parse(parq.data));
      } else {
        res.json(null);
      }
    } catch (err) {
      console.error("Error in /api/parq/:userId:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // PARQ: Save user PARQ
  app.post("/api/parq/:userId", (req, res) => {
    const { userId } = req.params;
    const sqliteId = resolveUserId(userId);
    const data = req.body;
    try {
      db.prepare(`
        INSERT INTO user_parq (user_id, data, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET 
          data=excluded.data, 
          updated_at=CURRENT_TIMESTAMP
      `).run(sqliteId, JSON.stringify(data));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Nutrition: Save logs (bulk insert/update)
  app.post("/api/nutrition/:userId", async (req, res) => {
    const { userId } = req.params;
    const { logs } = req.body; // Array of LoggedFood items
    
    try {
      const batch = adminDb.batch();
      
      // Get existing logs for this user
      const snapshot = await adminDb.collection('nutrition_logs').where('user_id', '==', userId).get();
      const existingLogs = snapshot.docs;
      const existingLogIds = new Set(existingLogs.map(d => d.data().log_id));
      
      const incomingLogIds = new Set(logs.map((l: any) => l.logId));

      // Delete logs that are no longer in the incoming array
      for (const doc of existingLogs) {
        if (!incomingLogIds.has(doc.data().log_id)) {
          batch.delete(doc.ref);
        }
      }

      // Insert or update incoming logs
      for (const log of logs) {
        const logRef = adminDb.collection('nutrition_logs').doc(log.logId);
        batch.set(logRef, {
          user_id: userId,
          log_id: log.logId,
          food_id: log.id,
          name: log.name,
          category: log.category,
          meal: log.meal,
          date: log.date,
          servings: log.servings,
          serving_size: log.serving.size,
          calories: log.serving.calories,
          protein: log.serving.protein,
          carbs: log.serving.carbs,
          fat: log.serving.fat,
          created_at: new Date().toISOString()
        }, { merge: true });
      }
      
      await batch.commit();
      res.json({ success: true });
    } catch (err) {
      console.error("Nutrition save error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Workout Logs: Get user workout logs
  app.get("/api/workout-logs/:userId", async (req, res) => {
    const { userId } = req.params;
    console.log(`Fetching workout logs for user: ${userId}`);
    try {
      const snapshot = await adminDb.collection('workout_logs').where('user_id', '==', userId).get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(logs);
    } catch (err) {
      console.error("Error fetching workout logs:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Workout Logs: Save user workout logs
  app.post("/api/workout-logs/:userId", async (req, res) => {
    const { userId } = req.params;
    const { logs } = req.body;
    try {
      const batch = adminDb.batch();
      
      for (const log of logs) {
        // Create a unique ID for the log entry based on the conflict key
        const logId = `${userId}_${log.workoutId}_${log.exerciseId}_${log.date}`;
        const logRef = adminDb.collection('workout_logs').doc(logId);
        
        batch.set(logRef, {
          user_id: userId,
          workout_id: log.workoutId,
          exercise_id: log.exerciseId,
          completed: log.completed ? true : false,
          date: log.date,
          edited_data: log.editedData || {},
          workout_start_time: log.workoutStartTime || null,
          workout_end_time: log.workoutEndTime || null
        }, { merge: true });
      }
      
      await batch.commit();
      res.json({ success: true });
    } catch (err) {
      console.error("Workout log save error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Workout Logs: Finish workout
  app.post("/api/workout-logs/:userId/finish", async (req, res) => {
    const { userId } = req.params;
    const { workout_id, date, end_time } = req.body;
    try {
      const logId = `${userId}_${workout_id}_*_${date}`; // This is tricky because exercise_id is part of the key
      // The current key is ${userId}_${workoutId}_${exerciseId}_${date}
      // I need to update all workout logs for this workout and date
      const snapshot = await adminDb.collection('workout_logs')
        .where('user_id', '==', userId)
        .where('workout_id', '==', workout_id)
        .where('date', '==', date)
        .get();
      
      const batch = adminDb.batch();
      for (const doc of snapshot.docs) {
        batch.update(doc.ref, { workout_end_time: end_time });
      }
      await batch.commit();
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to finish workout:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Workout Logs: Delete user workout log
  app.delete("/api/workout-logs/:userId", async (req, res) => {
    const { userId } = req.params;
    const { workout_id, exercise_id, date } = req.body;
    try {
      const logId = `${userId}_${workout_id}_${exercise_id}_${date}`;
      await adminDb.collection('workout_logs').doc(logId).delete();
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting workout log:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Program Progress: Get user program progress
  app.get("/api/program-progress/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const snapshot = await adminDb.collection('program_progress').where('user_id', '==', userId).get();
      const progress = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(progress);
    } catch (err) {
      console.error("Error fetching program progress:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Program Progress: Save user program progress
  app.post("/api/program-progress/:userId", async (req, res) => {
    const { userId } = req.params;
    const { progress } = req.body;
    try {
      const batch = adminDb.batch();
      
      for (const p of progress) {
        // Create a unique ID for the progress entry based on the conflict key
        const progressId = `${userId}_${p.programId}_${p.phase}_${p.week}_${p.day}`;
        const progressRef = adminDb.collection('program_progress').doc(progressId);
        
        batch.set(progressRef, {
          user_id: userId,
          program_id: p.programId,
          phase: p.phase,
          week: p.week,
          day: p.day,
          completed: p.completed ? true : false,
          date: p.date
        }, { merge: true });
      }
      
      await batch.commit();
      res.json({ success: true });
    } catch (err) {
      console.error("Program progress save error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Activity: Log user activity
  app.post("/api/activity", async (req, res) => {
    const { user_id, action, details } = req.body;
    try {
      const logData: any = {
        user_id,
        action,
        details: JSON.stringify(details || {}),
        created_at: new Date().toISOString()
      };

      if (user_id) {
        const userDoc = await adminDb.collection('users').doc(user_id).get();
        if (userDoc.exists) {
          logData.username = userDoc.data()?.username;
        }
      }

      await adminDb.collection('user_activity_logs').add(logData);
      res.json({ success: true });
    } catch (err) {
      console.error("Activity log error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Activity: Get user activity logs
  app.get("/api/activity/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const snapshot = await adminDb.collection('user_activity_logs').where('user_id', '==', userId).orderBy('created_at', 'desc').get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(logs);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Body Composition: Get user logs
  app.get("/api/body-composition/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const snapshot = await adminDb.collection('body_composition_logs').where('user_id', '==', userId).orderBy('created_at', 'desc').get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(logs);
    } catch (err) {
      console.error("Error fetching body composition logs:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Body Composition: Add log entry
  app.post("/api/body-composition/:userId", async (req, res) => {
    const { userId } = req.params;
    const { image_url, analysis, feedback } = req.body;
    try {
      const docRef = await adminDb.collection('body_composition_logs').add({
        user_id: userId,
        image_url,
        analysis,
        feedback,
        created_at: new Date().toISOString()
      });
      
      // Send notification to user
      sendNotification(Number(userId), 'Body Composition Feedback', 'Your coach has provided feedback on your latest body composition analysis.', '/profile');

      res.json({ id: docRef.id, userId, image_url, analysis, feedback });
    } catch (err) {
      console.error("Body composition save error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Body Composition: Delete log entry
  app.delete("/api/body-composition/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await adminDb.collection('body_composition_logs').doc(id).delete();
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting body composition log:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Get user purchases
  app.get("/api/purchases/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const snapshot = await adminDb.collection('purchases').where('user_id', '==', userId).get();
      const purchases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(purchases);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Stripe Checkout
  app.post("/api/purchases/intent", async (req, res) => {
    const { userId, itemName, price, status } = req.body;
    try {
      const docRef = await adminDb.collection('purchases').add({
        user_id: userId,
        item_name: itemName,
        price,
        stripe_session_id: status,
        created_at: new Date().toISOString()
      });
      res.json({ id: docRef.id, success: true });
    } catch (err) {
      console.error("Purchase intent error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Fitness Overview: Get user logs
  app.get("/api/fitness-overview/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const snapshot = await adminDb.collection('fitness_overviews').where('user_id', '==', userId).orderBy('created_at', 'desc').get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(logs);
    } catch (err) {
      console.error("Error fetching fitness overviews:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Fitness Overview: Add log entry
  app.post("/api/fitness-overview/:userId", async (req, res) => {
    const { userId } = req.params;
    const { overview } = req.body;
    try {
      const docRef = await adminDb.collection('fitness_overviews').add({
        user_id: userId,
        overview,
        created_at: new Date().toISOString()
      });
      
      // Send notification to user
      sendNotification(Number(userId), 'Fitness Overview Updated', 'Your coach has updated your fitness overview. Check it out in your profile.', '/profile');

      res.json({ id: docRef.id, userId, overview });
    } catch (err) {
      console.error("Fitness overview save error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Users: Update notification settings
  app.patch("/api/users/:id/notifications", async (req, res) => {
    const { id } = req.params;
    const { email_notifications, push_notifications, emailNotifications, pushNotifications } = req.body;
    try {
      const finalEmailNotifications = email_notifications !== undefined ? email_notifications : emailNotifications;
      const finalPushNotifications = push_notifications !== undefined ? push_notifications : pushNotifications;
      
      await adminDb.collection('users').doc(id).update({
        email_notifications: finalEmailNotifications ? true : false,
        push_notifications: finalPushNotifications ? true : false
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating notification settings:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Custom Programs: Get user's custom programs
  app.get("/api/custom-programs/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const snapshot = await adminDb.collection('custom_programs').where('user_id', '==', userId).orderBy('created_at', 'desc').get();
      const programs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(programs);
    } catch (err) {
      console.error("Error fetching custom programs:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Custom Programs: Save a custom program
  app.post("/api/custom-programs/:userId", async (req, res) => {
    const { userId } = req.params;
    const { name, description, data } = req.body;
    try {
      const docRef = await adminDb.collection('custom_programs').add({
        user_id: userId,
        name,
        description,
        data: JSON.stringify(data),
        created_at: new Date().toISOString()
      });
      
      // Send notification to user
      sendNotification(Number(userId), 'New Program Assigned', `A new custom program "${name}" has been assigned to you.`, '/profile');

      res.json({ id: docRef.id, success: true });
    } catch (err) {
      console.error("Database error saving custom program:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Custom Programs: Update a custom program
  app.patch("/api/custom-programs/:userId/:id", async (req, res) => {
    const { userId, id } = req.params;
    const { name, description, data } = req.body;
    try {
      await adminDb.collection('custom_programs').doc(id).update({
        name,
        description,
        data: JSON.stringify(data)
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Database error updating custom program:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Custom Programs: Delete a custom program
  app.delete("/api/custom-programs/:userId/:id", async (req, res) => {
    const { userId, id } = req.params;
    try {
      await adminDb.collection('custom_programs').doc(id).delete();
      res.json({ success: true });
    } catch (err) {
      console.error("Database error deleting custom program:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Get unread messages
  app.get("/api/messages/unread", async (req, res) => {
    const { userId } = req.query;
    try {
      let query = adminDb.collection('messages').where('is_read', '==', false);
      if (userId) {
        query = query.where('receiver_id', '==', userId);
      }
      
      const snapshot = await query.orderBy('created_at', 'desc').get();
      const messages: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      // Fetch sender usernames
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const usersSnapshot = await adminDb.collection('users').where('id', 'in', senderIds).get();
      const usersMap = new Map(usersSnapshot.docs.map(doc => [doc.data().id, doc.data().username]));
      
      const result = messages.map(m => ({ ...m, sender_username: usersMap.get(m.sender_id) }));
      res.json(result);
    } catch (err) {
      console.error("Error fetching unread messages:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Get conversation
  app.get("/api/messages/:userId", async (req, res) => {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    try {
      // Firestore doesn't support OR queries easily for sender/receiver.
      // We might need to fetch both and merge or re-think the schema.
      // For now, let's fetch messages where sender_id is userId OR receiver_id is userId
      const senderSnapshot = await adminDb.collection('messages').where('sender_id', '==', userId).where('is_deleted', '==', false).get();
      const receiverSnapshot = await adminDb.collection('messages').where('receiver_id', '==', userId).where('is_deleted', '==', false).get();
      
      const messages: any[] = [...senderSnapshot.docs, ...receiverSnapshot.docs]
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(Number(offset), Number(offset) + Number(limit));
        
      res.json(messages);
    } catch (err) {
      console.error("Error fetching conversation:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Send message
  app.post("/api/messages", async (req, res) => {
    const { sender_id, receiver_id, message } = req.body;
    try {
      const docRef = await adminDb.collection('messages').add({
        sender_id,
        receiver_id,
        message,
        is_read: false,
        is_deleted: false,
        created_at: new Date().toISOString()
      });
      
      // Send notification to receiver
      const senderDoc = await adminDb.collection('users').doc(sender_id.toString()).get();
      const senderUsername = senderDoc.data()?.username || 'Admin';
      sendNotification(Number(receiver_id), 'New Message', `You have a new message from ${senderUsername}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`, '/profile');

      res.json({ id: docRef.id, success: true });
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Mark message as read
  app.patch("/api/messages/:id/read", async (req, res) => {
    const { id } = req.params;
    try {
      await adminDb.collection('messages').doc(id).update({ is_read: true });
      res.json({ success: true });
    } catch (err) {
      console.error("Error marking message as read:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Delete message
  app.delete("/api/messages/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await adminDb.collection('messages').doc(id).update({ is_deleted: true });
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting message:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Edit message
  app.put("/api/messages/:id", async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    try {
      await adminDb.collection('messages').doc(id).update({ 
        message, 
        updated_at: new Date().toISOString() 
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Error editing message:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Send message to coach (AI Tool)
  app.post("/api/messages/to-coach", async (req, res) => {
    const { sender_id, message } = req.body;
    try {
      // Find primary admin
      const adminSnapshot = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
      if (adminSnapshot.empty) {
        return res.status(404).json({ error: "No coach found" });
      }
      const adminDoc = adminSnapshot.docs[0];
      const adminId = adminDoc.id;

      const docRef = await adminDb.collection('messages').add({
        sender_id,
        receiver_id: adminId,
        message,
        is_read: false,
        is_deleted: false,
        created_at: new Date().toISOString()
      });

      // Notify admin
      const senderDoc = await adminDb.collection('users').doc(sender_id.toString()).get();
      const senderUsername = senderDoc.data()?.username || 'Athlete';
      
      // Use numeric ID for sendNotification if possible, otherwise skip push for now
      const sqliteUser = db.prepare('SELECT id FROM users WHERE role = ?').get('admin') as { id: number } | undefined;
      if (sqliteUser) {
        sendNotification(sqliteUser.id, 'New Message from Athlete', `${senderUsername}: "${message.substring(0, 50)}..."`, '/admin/chat');
      }

      res.json({ id: docRef.id, success: true });
    } catch (err) {
      console.error("Error sending message to coach:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Workout Feedback: Submit feedback
  app.post("/api/workout-feedback", async (req, res) => {
    const { user_id, workout_id, program_id, rating, comment } = req.body;
    try {
      await adminDb.collection('workout_feedback').add({
        user_id,
        workout_id,
        program_id,
        rating,
        comment,
        created_at: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Error submitting workout feedback:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Workout Feedback: Get feedback for a user
  app.get("/api/workout-feedback/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const snapshot = await adminDb.collection('workout_feedback').where('user_id', '==', userId).orderBy('created_at', 'desc').get();
      const feedback = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(feedback);
    } catch (err) {
      console.error("Error fetching workout feedback:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Get all feedback
  app.get("/api/admin/feedback", async (req, res) => {
    try {
      const snapshot = await adminDb.collection('workout_feedback').orderBy('created_at', 'desc').get();
      const feedback: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      // Fetch usernames
      const userIds = [...new Set(feedback.map(f => f.user_id))];
      const usersSnapshot = await adminDb.collection('users').where('id', 'in', userIds).get();
      const usersMap = new Map(usersSnapshot.docs.map(doc => [doc.data().id, doc.data().username]));
      
      const result = feedback.map(f => ({ ...f, username: usersMap.get(f.user_id) }));
      res.json(result);
    } catch (err) {
      console.error("Error fetching all feedback:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // --- VITE / PRODUCTION MIDDLEWARE ---
  const distPath = path.resolve(process.cwd(), "dist");
  const indexPath = path.resolve(distPath, "index.html");
  
  // Explicitly check NODE_ENV or if we are in Cloud Run (K_SERVICE is set)
  // Default to production unless explicitly set to development
  const isProduction = process.env.NODE_ENV !== 'development';

  console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Server] Cloud Run Service: ${process.env.K_SERVICE || 'none'}`);
  console.log(`[Server] Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  
  // Simple health check for Cloud Run
  app.get("/health", (req, res) => res.status(200).send("OK"));
  app.get("/api/health", (req, res) => res.json({ status: "ok", env: isProduction ? 'prod' : 'dev' }));

  if (isProduction) {
    console.log("[Server] Serving static files from dist...");
    
    // Serve static files from dist
    app.use(express.static(distPath, { 
      index: 'index.html', // Let express-static handle the root index.html if it exists
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('sw.js') || filePath.endsWith('manifest.json')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          if (filePath.endsWith('manifest.json')) {
            res.setHeader('Content-Type', 'application/manifest+json');
          }
        }
      }
    }));
    
    // SPA fallback for routes that don't match a static file
    app.get("*", (req, res) => {
      // Don't serve index.html for API routes
      if (req.url.startsWith('/api/')) {
        console.log(`[Server] 404 on API route: ${req.url}`);
        return res.status(404).json({ error: "API route not found" });
      }
      
      console.log(`[Server] SPA Fallback for: ${req.url}`);
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`[Server] Error sending index.html: ${err}`);
          res.status(500).send("Server Error: index.html not found. Please ensure the app is built.");
        }
      });
    });
  } else {
    // Development mode: Use Vite
    console.log("Starting in DEVELOPMENT mode with Vite...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      
      app.get("*", async (req, res, next) => {
        if (req.url.startsWith('/api/') || req.url.includes('.')) {
          return next();
        }
        try {
          const template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
          const html = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    } catch (viteErr) {
      console.error("Vite failed, falling back to static:", viteErr);
      app.use(express.static(distPath));
      app.get("*", (req, res) => res.sendFile(indexPath));
    }
  }

  console.log(`Attempting to listen on port ${PORT}...`);
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);
  });
  
  server.on('error', (err) => {
    console.error('Server listen error:', err);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log("Calling startServer()...");
startServer().catch(err => {
  console.error("Failed to start server:", err);
});
