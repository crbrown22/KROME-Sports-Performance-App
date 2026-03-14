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
        from: '"KROME Fitness" <kromefitness@gmail.com>',
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
              db.prepare('INSERT INTO purchases (user_id, item_name, price, square_order_id, program_id) VALUES (?, ?, ?, ?, ?)').run(userId, itemName, price, orderId, programId);
              
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
    try {
      db.prepare('INSERT INTO push_subscriptions (user_id, subscription) VALUES (?, ?)').run(userId, JSON.stringify(subscription));
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
        from: '"KROME Fitness" <kromefitness@gmail.com>',
        to: email,
        subject: 'Confirmation: We received your message',
        text: `Hello ${name},\n\nThank you for contacting KROME Fitness. We have received your message and will get back to you soon.\n\nHere is a copy of your message:\n\n"${message}"\n\nBest regards,\nThe KROME Team`,
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
  app.get("/api/users", (req, res) => {
    try {
      const users = db.prepare('SELECT id, username, email, role FROM users').all();
      res.json(users);
    } catch (err) {
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

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (user) {
        if (await bcrypt.compare(password, user.password)) {
          const { password: _, ...safeUser } = user;
          res.json(safeUser);
        } else if (password === user.password) {
          // Plain text password match, hash it and update
          const hashedPassword = await bcrypt.hash(password, 10);
          db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);
          const { password: _, ...safeUser } = user;
          res.json(safeUser);
        } else {
          res.status(401).json({ error: "Invalid email or password" });
        }
      } else {
        res.status(401).json({ error: "Invalid email or password" });
      }
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    const { username, email, password, first_name, last_name, firstName, lastName, role, status, uid } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const insert = db.prepare('INSERT INTO users (username, email, password, first_name, last_name, role, status, uid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      
      // Map 'user' to 'athlete' if coming from old client
      let finalRole = role || 'athlete';
      if (finalRole === 'user') finalRole = 'athlete';
      
      const result = insert.run(username, email, hashedPassword, first_name || firstName || "", last_name || lastName || "", finalRole, status || 'active', uid || null);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any;
      
      if (!user) {
        throw new Error("Failed to retrieve user after registration");
      }

      // Add to leads
      try {
        db.prepare('INSERT INTO leads (name, email, status, user_id) VALUES (?, ?, ?, ?)').run(`${user.first_name} ${user.last_name}`, user.email, 'New Lead', user.id);
      } catch (leadErr) {
        console.error("Failed to add lead:", leadErr);
      }

      // Send email notifications
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

        // Email to Admin
        await transporter.sendMail({
          from: '"KROME Fitness" <kromefitness@gmail.com>',
          to: 'kromefitness@gmail.com',
          subject: 'New Athlete Registered',
          text: `A new athlete has registered:\n\nName: ${user.first_name} ${user.last_name}\nEmail: ${user.email}`,
        });

        // Email to Athlete
        const appUrl = process.env.APP_URL || 'https://www.kromesport.com';
        await transporter.sendMail({
          from: '"KROME Fitness" <kromefitness@gmail.com>',
          to: user.email,
          subject: 'Welcome to KROME Fitness',
          text: `Hello ${user.first_name},\n\nWelcome to KROME Fitness! We are excited to have you on board.\n\nTo get the best experience, we invite you to download our app directly to your phone:\n\n1. Visit ${appUrl} on your mobile browser.\n2. Tap the "Share" button (iOS) or the menu icon (Android).\n3. Select "Add to Home Screen".\n\nThis will give you instant access to your training programs and performance tracking right from your home screen.\n\nBest regards,\nThe KROME Team`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #000;">Welcome to KROME Fitness!</h2>
              <p>Hello ${user.first_name},</p>
              <p>We are excited to have you on board. KROME is your premium platform for elite athletic training and performance tracking.</p>
              <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📲 Download the App</h3>
                <p>For the best experience, install KROME directly on your phone:</p>
                <ol>
                  <li>Open <strong>${appUrl}</strong> in your mobile browser.</li>
                  <li>Tap the <strong>Share</strong> button (iOS) or <strong>Menu</strong> icon (Android).</li>
                  <li>Select <strong>"Add to Home Screen"</strong>.</li>
                </ol>
                <a href="${appUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Open KROME App</a>
              </div>
              <p>Best regards,<br>The KROME Team</p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error("Failed to send registration emails:", emailErr);
        // Don't fail the registration if email fails
      }

      console.log("Registered user:", user);
      res.json(user);
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: "Username or email already exists" });
      } else {
        res.status(500).json({ error: "Database error: " + err.message });
      }
    }
  });

  // User: Delete profile
  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Get first admin
  app.get("/api/admin/primary", (req, res) => {
    try {
      const admin = db.prepare('SELECT id, username, email FROM users WHERE role = ? LIMIT 1').get('admin');
      res.json(admin);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Get all users
  app.get("/api/admin/users", (req, res) => {
    console.log("Fetching users...");
    try {
      const users = db.prepare('SELECT id, username, email, first_name, last_name, avatar_url, role, status, created_at FROM users').all();
      console.log("Users fetched:", users);
      res.json(users);
    } catch (err) {
      console.error("Database error in /api/admin/users:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Update user role
  app.patch("/api/admin/users/:id/role", (req, res) => {
    const { id } = req.params;
    const { role, adminId } = req.body;
    
    // Basic authorization check
    if (adminId) {
      const admin = db.prepare('SELECT role FROM users WHERE id = ?').get(adminId) as any;
      if (admin?.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Only admins can change roles" });
      }
    }

    try {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Delete user
  app.delete("/api/admin/users/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Assign program to user
  app.post("/api/admin/assign-program", (req, res) => {
    const { userId, programId, itemName, price } = req.body;
    try {
      db.prepare('INSERT INTO purchases (user_id, item_name, price, program_id) VALUES (?, ?, ?, ?)').run(userId, itemName, price || 0, programId);
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

  // User: Update profile
  app.patch("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, avatar_url, firstName, lastName, avatarUrl, role, status } = req.body;
    try {
      // Build dynamic update query
      const fields = [];
      const params = [];
      
      const finalFirstName = first_name !== undefined ? first_name : firstName;
      const finalLastName = last_name !== undefined ? last_name : lastName;
      const finalAvatarUrl = avatar_url !== undefined ? avatar_url : avatarUrl;

      if (finalFirstName !== undefined) { fields.push('first_name = ?'); params.push(finalFirstName); }
      if (finalLastName !== undefined) { fields.push('last_name = ?'); params.push(finalLastName); }
      if (email !== undefined) { fields.push('email = ?'); params.push(email); }
      if (finalAvatarUrl !== undefined) { fields.push('avatar_url = ?'); params.push(finalAvatarUrl); }
      if (role !== undefined) { fields.push('role = ?'); params.push(role); }
      if (status !== undefined) { fields.push('status = ?'); params.push(status); }
      
      if (fields.length === 0) return res.json({ success: true });
      
      params.push(id);
      db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params);
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
  app.get("/api/progress/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const progress = db.prepare('SELECT * FROM progress WHERE user_id = ? ORDER BY recorded_at ASC').all(userId);
      res.json(progress);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Progress: Add progress entry
  app.post("/api/progress", (req, res) => {
    const { user_id, metric_name, metric_value, unit } = req.body;
    try {
      const insert = db.prepare('INSERT INTO progress (user_id, metric_name, metric_value, unit) VALUES (?, ?, ?, ?)');
      const result = insert.run(user_id, metric_name, metric_value, unit);
      res.json({ id: result.lastInsertRowid, user_id, metric_name, metric_value, unit });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Progress: Delete entry
  app.delete("/api/progress/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM progress WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Nutrition: Get user logs
  app.get("/api/nutrition/:userId", (req, res) => {
    const { userId } = req.params;
    console.log(`Fetching nutrition for user: ${userId}`);
    try {
      const logs = db.prepare('SELECT * FROM nutrition_logs WHERE user_id = ? ORDER BY created_at DESC').all(userId);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Metrics: Get user metrics
  app.get("/api/metrics/:userId", (req, res) => {
    const { userId } = req.params;
    console.log(`Fetching metrics for user: ${userId}`);
    try {
      const metrics = db.prepare('SELECT data FROM user_metrics WHERE user_id = ?').get(userId) as { data: string } | undefined;
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
    const data = req.body;
    try {
      db.prepare(`
        INSERT INTO user_metrics (user_id, data, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET 
          data=excluded.data, 
          updated_at=CURRENT_TIMESTAMP
      `).run(userId, JSON.stringify(data));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Body Comp History: Get user history
  app.get("/api/body-comp/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const history = db.prepare('SELECT * FROM body_comp_history WHERE user_id = ? ORDER BY week ASC').all(userId);
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
        deleteStmt.run(userId);
        for (const entry of history) {
          insert.run(
            entry.id, 
            userId, 
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
    console.log(`GET /api/parq/${req.params.userId}`);
    const { userId } = req.params;
    try {
      const parq = db.prepare('SELECT data FROM user_parq WHERE user_id = ?').get(userId) as { data: string } | undefined;
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
    const data = req.body;
    try {
      db.prepare(`
        INSERT INTO user_parq (user_id, data, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET 
          data=excluded.data, 
          updated_at=CURRENT_TIMESTAMP
      `).run(userId, JSON.stringify(data));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Nutrition: Save logs (bulk insert/update)
  app.post("/api/nutrition/:userId", (req, res) => {
    const { userId } = req.params;
    const { logs } = req.body; // Array of LoggedFood items
    
    try {
      const insert = db.prepare(`
        INSERT INTO nutrition_logs (user_id, log_id, food_id, name, category, meal, date, servings, serving_size, calories, protein, carbs, fat) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(log_id) DO UPDATE SET 
          servings=excluded.servings, 
          meal=excluded.meal, 
          date=excluded.date
      `);
      
      const deleteLog = db.prepare('DELETE FROM nutrition_logs WHERE user_id = ? AND log_id = ?');

      db.transaction(() => {
        // First, get existing log_ids for this user
        const existingLogs = db.prepare('SELECT log_id FROM nutrition_logs WHERE user_id = ?').all(userId) as { log_id: string }[];
        const existingLogIds = new Set(existingLogs.map(l => l.log_id));
        
        const incomingLogIds = new Set(logs.map((l: any) => l.logId));

        // Delete logs that are no longer in the incoming array
        for (const logId of existingLogIds) {
          if (!incomingLogIds.has(logId)) {
            deleteLog.run(userId, logId);
          }
        }

        // Insert or update incoming logs
        for (const log of logs) {
          insert.run(
            userId,
            log.logId,
            log.id,
            log.name,
            log.category,
            log.meal,
            log.date,
            log.servings,
            log.serving.size,
            log.serving.calories,
            log.serving.protein,
            log.serving.carbs,
            log.serving.fat
          );
        }
      })();
      
      res.json({ success: true });
    } catch (err) {
      console.error("Nutrition save error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Workout Logs: Get user workout logs
  app.get("/api/workout-logs/:userId", (req, res) => {
    const { userId } = req.params;
    console.log(`Fetching workout logs for user: ${userId}`);
    try {
      const logs = db.prepare('SELECT * FROM workout_logs WHERE user_id = ?').all(userId);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Workout Logs: Save user workout logs
  app.post("/api/workout-logs/:userId", (req, res) => {
    const { userId } = req.params;
    const { logs } = req.body;
    try {
      const insert = db.prepare(`
        INSERT INTO workout_logs (user_id, workout_id, exercise_id, completed, date, edited_data, workout_start_time, workout_end_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, workout_id, exercise_id, date) DO UPDATE SET 
          completed=excluded.completed, 
          edited_data=excluded.edited_data,
          workout_start_time=COALESCE(workout_logs.workout_start_time, excluded.workout_start_time),
          workout_end_time=COALESCE(workout_logs.workout_end_time, excluded.workout_end_time)
      `);
      
      db.transaction(() => {
        for (const log of logs) {
          insert.run(
            userId, 
            log.workoutId, 
            log.exerciseId, 
            log.completed ? 1 : 0, 
            log.date, 
            JSON.stringify(log.editedData || {}),
            log.workoutStartTime || null,
            log.workoutEndTime || null
          );
        }
      })();
      res.json({ success: true });
    } catch (err) {
      console.error("Workout log save error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Workout Logs: Finish workout
  app.post("/api/workout-logs/:userId/finish", (req, res) => {
    const { userId } = req.params;
    const { workout_id, date, end_time } = req.body;
    try {
      db.prepare(`
        UPDATE workout_logs 
        SET workout_end_time = ? 
        WHERE user_id = ? AND workout_id = ? AND date = ?
      `).run(end_time, userId, workout_id, date);
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to finish workout:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Workout Logs: Delete user workout log
  app.delete("/api/workout-logs/:userId", (req, res) => {
    const { userId } = req.params;
    const { workout_id, exercise_id, date } = req.body;
    try {
      db.prepare('DELETE FROM workout_logs WHERE user_id = ? AND workout_id = ? AND exercise_id = ? AND date = ?').run(userId, workout_id, exercise_id, date);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Program Progress: Get user program progress
  app.get("/api/program-progress/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const progress = db.prepare('SELECT * FROM program_progress WHERE user_id = ?').all(userId);
      res.json(progress);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Program Progress: Save user program progress
  app.post("/api/program-progress/:userId", (req, res) => {
    const { userId } = req.params;
    const { progress } = req.body;
    try {
      const insert = db.prepare(`
        INSERT INTO program_progress (user_id, program_id, phase, week, day, completed, date) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, program_id, phase, week, day) DO UPDATE SET 
          completed=excluded.completed, 
          date=excluded.date
      `);
      
      db.transaction(() => {
        for (const p of progress) {
          insert.run(userId, p.programId, p.phase, p.week, p.day, p.completed ? 1 : 0, p.date);
        }
      })();
      res.json({ success: true });
    } catch (err) {
      console.error("Program progress save error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Activity: Log user activity
  app.post("/api/activity", (req, res) => {
    const { user_id, action, details } = req.body;
    try {
      if (user_id) {
        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
        if (!user) {
          return res.status(400).json({ error: "Invalid user_id" });
        }
      }
      const insert = db.prepare('INSERT INTO user_activity_logs (user_id, action, details) VALUES (?, ?, ?)');
      insert.run(user_id, action, JSON.stringify(details));
      res.json({ success: true });
    } catch (err) {
      console.error("Activity log error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Activity: Get user activity logs
  app.get("/api/activity/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const logs = db.prepare('SELECT * FROM user_activity_logs WHERE user_id = ? ORDER BY created_at DESC').all(userId);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Body Composition: Get user logs
  app.get("/api/body-composition/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const logs = db.prepare('SELECT * FROM body_composition_logs WHERE user_id = ? ORDER BY created_at DESC').all(userId);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Body Composition: Add log entry
  app.post("/api/body-composition/:userId", (req, res) => {
    const { userId } = req.params;
    const { image_url, analysis, feedback } = req.body;
    try {
      const insert = db.prepare('INSERT INTO body_composition_logs (user_id, image_url, analysis, feedback) VALUES (?, ?, ?, ?)');
      const result = insert.run(userId, image_url, analysis, feedback);
      
      // Send notification to user
      sendNotification(Number(userId), 'Body Composition Feedback', 'Your coach has provided feedback on your latest body composition analysis.', '/profile');

      res.json({ id: result.lastInsertRowid, userId, image_url, analysis, feedback });
    } catch (err) {
      console.error("Body composition save error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Body Composition: Delete log entry
  app.delete("/api/body-composition/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM body_composition_logs WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Get user purchases
  app.get("/api/purchases/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const purchases = db.prepare('SELECT * FROM purchases WHERE user_id = ?').all(userId);
      res.json(purchases);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Stripe Checkout
  app.post("/api/purchases/intent", (req, res) => {
    const { userId, itemName, price, status } = req.body;
    try {
      const insert = db.prepare('INSERT INTO purchases (user_id, item_name, price, stripe_session_id) VALUES (?, ?, ?, ?)');
      insert.run(userId, itemName, price, status);
      res.json({ success: true });
    } catch (err) {
      console.error("Purchase intent error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Fitness Overview: Get user logs
  app.get("/api/fitness-overview/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const logs = db.prepare('SELECT * FROM fitness_overviews WHERE user_id = ? ORDER BY created_at DESC').all(userId);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Fitness Overview: Add log entry
  app.post("/api/fitness-overview/:userId", (req, res) => {
    const { userId } = req.params;
    const { overview } = req.body;
    try {
      const insert = db.prepare('INSERT INTO fitness_overviews (user_id, overview) VALUES (?, ?)');
      const result = insert.run(userId, overview);
      
      // Send notification to user
      sendNotification(Number(userId), 'Fitness Overview Updated', 'Your coach has updated your fitness overview. Check it out in your profile.', '/profile');

      res.json({ id: result.lastInsertRowid, userId, overview });
    } catch (err) {
      console.error("Fitness overview save error:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Users: Update notification settings
  app.patch("/api/users/:id/notifications", (req, res) => {
    const { id } = req.params;
    const { email_notifications, push_notifications, emailNotifications, pushNotifications } = req.body;
    try {
      const finalEmailNotifications = email_notifications !== undefined ? email_notifications : emailNotifications;
      const finalPushNotifications = push_notifications !== undefined ? push_notifications : pushNotifications;
      
      const update = db.prepare('UPDATE users SET email_notifications = ?, push_notifications = ? WHERE id = ?');
      update.run(finalEmailNotifications ? 1 : 0, finalPushNotifications ? 1 : 0, id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Custom Programs: Get user's custom programs
  app.get("/api/custom-programs/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const programs = db.prepare('SELECT * FROM custom_programs WHERE user_id = ? ORDER BY created_at DESC').all(userId);
      res.json(programs.map((p: any) => ({ ...p, data: JSON.parse(p.data) })));
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Custom Programs: Save a custom program
  app.post("/api/custom-programs/:userId", (req, res) => {
    const { userId } = req.params;
    const { name, description, data } = req.body;
    try {
      const insert = db.prepare('INSERT INTO custom_programs (user_id, name, description, data) VALUES (?, ?, ?, ?)');
      const result = insert.run(userId, name, description, JSON.stringify(data));
      
      // Send notification to user
      sendNotification(Number(userId), 'New Program Assigned', `A new custom program "${name}" has been assigned to you.`, '/profile');

      res.json({ id: result.lastInsertRowid, success: true });
    } catch (err) {
      console.error("Database error saving custom program:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Custom Programs: Update a custom program
  app.patch("/api/custom-programs/:userId/:id", (req, res) => {
    const { userId, id } = req.params;
    const { name, description, data } = req.body;
    try {
      db.prepare("UPDATE custom_programs SET name = ?, description = ?, data = ? WHERE id = ? AND user_id = ?")
        .run(name, description, JSON.stringify(data), id, userId);
      res.json({ success: true });
    } catch (err) {
      console.error("Database error updating custom program:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Custom Programs: Delete a custom program
  app.delete("/api/custom-programs/:userId/:id", (req, res) => {
    const { userId, id } = req.params;
    try {
      db.prepare('DELETE FROM custom_programs WHERE id = ? AND user_id = ?').run(id, userId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Get unread messages
  app.get("/api/messages/unread", (req, res) => {
    const { userId } = req.query;
    try {
      let query = `
        SELECT m.*, u.username as sender_username 
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.is_read = 0
      `;
      const params: any[] = [];
      
      if (userId) {
        query += ` AND m.receiver_id = ?`;
        params.push(userId);
      }
      
      query += ` ORDER BY m.created_at DESC`;
      
      const messages = db.prepare(query).all(...params);
      res.json(messages);
    } catch (err) {
      console.error("Error fetching unread messages:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Get conversation
  app.get("/api/messages/:userId", (req, res) => {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    try {
      const messages = db.prepare(`
        SELECT * FROM messages 
        WHERE (sender_id = ? OR receiver_id = ?) AND is_deleted = 0
        ORDER BY created_at ASC
        LIMIT ? OFFSET ?
      `).all(userId, userId, Number(limit), Number(offset));
      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Send message
  app.post("/api/messages", (req, res) => {
    const { sender_id, receiver_id, message } = req.body;
    try {
      const insert = db.prepare('INSERT INTO messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, 0)');
      const result = insert.run(sender_id, receiver_id, message);
      
      // Send notification to receiver
      const sender = db.prepare('SELECT username FROM users WHERE id = ?').get(sender_id) as any;
      sendNotification(receiver_id, 'New Message', `You have a new message from ${sender?.username || 'Admin'}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`, '/profile');

      res.json({ id: result.lastInsertRowid, success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Mark message as read
  app.patch("/api/messages/:id/read", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Delete message
  app.delete("/api/messages/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('UPDATE messages SET is_deleted = 1 WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Messages: Edit message
  app.put("/api/messages/:id", (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    try {
      db.prepare('UPDATE messages SET message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(message, id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Workout Feedback: Submit feedback
  app.post("/api/workout-feedback", (req, res) => {
    const { user_id, workout_id, program_id, rating, comment } = req.body;
    try {
      const insert = db.prepare('INSERT INTO workout_feedback (user_id, workout_id, program_id, rating, comment) VALUES (?, ?, ?, ?, ?)');
      insert.run(user_id, workout_id, program_id, rating, comment);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Workout Feedback: Get feedback for a user
  app.get("/api/workout-feedback/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const feedback = db.prepare('SELECT * FROM workout_feedback WHERE user_id = ? ORDER BY created_at DESC').all(userId);
      res.json(feedback);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin: Get all feedback
  app.get("/api/admin/feedback", (req, res) => {
    try {
      const feedback = db.prepare(`
        SELECT f.*, u.username 
        FROM workout_feedback f 
        JOIN users u ON f.user_id = u.id 
        ORDER BY f.created_at DESC
      `).all();
      res.json(feedback);
    } catch (err) {
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
