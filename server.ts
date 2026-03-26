console.log("[Server] Script starting...");
import "dotenv/config";
console.log("[Server] Dotenv loaded");
import express from "express";
console.log("[Server] Express imported");
import { createServer as createViteServer } from "vite";
console.log("[Server] Vite imported");
import db from "./src/lib/db.ts";
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
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const serviceAccount = JSON.parse(serviceAccountKey || '{}');
const projectId = serviceAccount.project_id || process.env.PROJECT_ID || 'unknown';
console.log(`[Firebase] Initializing Admin SDK for project: ${projectId}`);

if (!serviceAccountKey) {
  console.warn("[Firebase] FIREBASE_SERVICE_ACCOUNT_KEY is not set. Admin SDK may not function correctly.");
}

export const adminApp = initializeApp({
  credential: cert(serviceAccount)
});

// Support named databases if provided in env
const firestoreDatabaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)';
console.log(`[Firebase] Using Firestore database: ${firestoreDatabaseId}`);

export const adminDb = (firestoreDatabaseId && firestoreDatabaseId !== '(default)') 
  ? getFirestore(adminApp, firestoreDatabaseId)
  : getFirestore(adminApp);

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

// Helper to format dates for SQLite (YYYY-MM-DD HH:MM:SS)
function formatDateForSQLite(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
  return d.toISOString().replace('T', ' ').replace(/\..+/, '');
}

// Rehydrate SQLite from Firestore on startup
let isRehydrated = false;

async function rehydrateDatabase() {
  if (isRehydrated) return;
  console.log("[Rehydrate] Starting database re-hydration from Firestore...");
  
  const collections = [
    { name: 'users', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} users in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        db.prepare(`
          INSERT INTO users (username, email, first_name, last_name, role, uid, status, fitness_goal, avatar_url, parq_completed, email_notifications, push_notifications, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET 
            username=excluded.username,
            first_name=excluded.first_name,
            last_name=excluded.last_name,
            role=excluded.role,
            uid=excluded.uid,
            status=excluded.status,
            fitness_goal=excluded.fitness_goal,
            avatar_url=excluded.avatar_url,
            parq_completed=excluded.parq_completed,
            email_notifications=excluded.email_notifications,
            push_notifications=excluded.push_notifications,
            created_at=excluded.created_at
        `).run(
          data.username || data.name || data.email,
          data.email,
          data.firstName || data.first_name || "",
          data.lastName || data.last_name || "",
          data.role || 'athlete',
          doc.id,
          data.status || 'active',
          data.fitnessGoal || null,
          data.avatarUrl || null,
          data.parq_completed ? 1 : 0,
          data.email_notifications === false ? 0 : 1,
          data.push_notifications === false ? 0 : 1,
          formatDateForSQLite(data.createdAt || data.created_at || new Date())
        );
      }
    }},
    { name: 'leads', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} leads in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        db.prepare(`
          INSERT INTO leads (name, email, status, value, sports, session_requests, preferred_times, preferred_days, positions, user_id, firestore_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(firestore_id) DO UPDATE SET
            name=excluded.name,
            email=excluded.email,
            status=excluded.status,
            value=excluded.value,
            sports=excluded.sports,
            session_requests=excluded.session_requests,
            preferred_times=excluded.preferred_times,
            preferred_days=excluded.preferred_days,
            positions=excluded.positions,
            user_id=excluded.user_id,
            created_at=excluded.created_at
        `).run(
          data.name,
          data.email,
          data.status,
          data.value,
          data.sports ? JSON.stringify(data.sports) : null,
          data.sessionRequests ? JSON.stringify(data.sessionRequests) : null,
          data.preferredTimes ? JSON.stringify(data.preferredTimes) : null,
          data.preferredDays ? JSON.stringify(data.preferredDays) : null,
          data.positions ? JSON.stringify(data.positions) : null,
          sqliteUserId || null,
          doc.id,
          formatDateForSQLite(data.created_at || data.createdAt || new Date())
        );
      }
    }},
    { name: 'user_metrics', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} user metrics in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(doc.id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO user_metrics (user_id, data, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              data=excluded.data,
              updated_at=excluded.updated_at
          `).run(sqliteUserId, JSON.stringify(data.data), data.updated_at || new Date().toISOString());
        }
      }
    }},
    { name: 'body_comp_history', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} body comp entries in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO body_comp_history (id, user_id, week, date, weight, height, bmi, body_fat, lean_muscle, fat_mass, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              week=excluded.week,
              date=excluded.date,
              weight=excluded.weight,
              height=excluded.height,
              bmi=excluded.bmi,
              body_fat=excluded.body_fat,
              lean_muscle=excluded.lean_muscle,
              fat_mass=excluded.fat_mass
          `).run(
            doc.id,
            sqliteUserId,
            data.week,
            data.date,
            data.weight,
            data.height,
            data.bmi,
            data.bodyFat,
            data.leanMuscle,
            data.fatMass,
            data.created_at || new Date().toISOString()
          );
        }
      }
    }},
    { name: 'user_parq', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} PAR-Q entries in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(doc.id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO user_parq (user_id, data, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              data=excluded.data,
              updated_at=excluded.updated_at
          `).run(sqliteUserId, JSON.stringify(data.data), data.updated_at || new Date().toISOString());
        }
      }
    }},
    { name: 'purchases', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} purchases in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO purchases (user_id, item_name, price, square_order_id, stripe_session_id, program_id, firestore_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(firestore_id) DO UPDATE SET
              user_id=excluded.user_id,
              item_name=excluded.item_name,
              price=excluded.price,
              square_order_id=excluded.square_order_id,
              stripe_session_id=excluded.stripe_session_id,
              program_id=excluded.program_id,
              created_at=excluded.created_at
          `).run(
            sqliteUserId,
            data.item_name || 'Unknown Item',
            data.price || 0,
            data.square_order_id || null,
            data.stripe_session_id || null,
            data.program_id || null,
            doc.id,
            formatDateForSQLite(data.created_at || data.createdAt || new Date())
          );
        }
      }
    }},
    { name: 'push_subscriptions', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} push subscriptions in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT OR IGNORE INTO push_subscriptions (user_id, subscription)
            VALUES (?, ?)
          `).run(sqliteUserId, data.subscription);
        }
      }
    }},
    { name: 'progress', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} progress entries in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO progress (user_id, metric_name, metric_value, unit, firestore_id, recorded_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(firestore_id) DO UPDATE SET
              metric_name=excluded.metric_name,
              metric_value=excluded.metric_value,
              unit=excluded.unit,
              recorded_at=excluded.recorded_at
          `).run(sqliteUserId, data.metric_name, data.metric_value, data.unit, doc.id, data.recorded_at || new Date().toISOString());
        }
      }
    }},
    { name: 'nutrition_logs', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} nutrition logs in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO nutrition_logs (user_id, log_id, food_id, name, category, meal, date, servings, serving_size, calories, protein, carbs, fat, firestore_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(log_id) DO UPDATE SET
              name=excluded.name,
              servings=excluded.servings,
              calories=excluded.calories,
              protein=excluded.protein,
              carbs=excluded.carbs,
              fat=excluded.fat
          `).run(
            sqliteUserId, 
            data.logId || doc.id, 
            data.foodId || null, 
            data.name, 
            data.category || null, 
            data.meal || null, 
            data.date, 
            data.servings, 
            data.servingSize || null, 
            data.calories, 
            data.protein, 
            data.carbs, 
            data.fat, 
            doc.id,
            data.created_at || new Date().toISOString()
          );
        }
      }
    }},
    { name: 'workout_logs', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} workout logs in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO workout_logs (user_id, workout_id, exercise_id, completed, date, edited_data, firestore_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(firestore_id) DO UPDATE SET
              completed=excluded.completed,
              edited_data=excluded.edited_data
          `).run(
            sqliteUserId, 
            data.workout_id, 
            data.exercise_id, 
            data.completed ? 1 : 0, 
            data.date, 
            data.edited_data ? JSON.stringify(data.edited_data) : null, 
            doc.id,
            data.created_at || new Date().toISOString()
          );
        }
      }
    }},
    { name: 'program_progress', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} program progress entries in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO program_progress (user_id, program_id, phase, week, day, completed, date, firestore_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(firestore_id) DO UPDATE SET
              completed=excluded.completed,
              date=excluded.date
          `).run(
            sqliteUserId, 
            data.program_id, 
            data.phase, 
            data.week, 
            data.day, 
            data.completed ? 1 : 0, 
            data.date, 
            doc.id,
            data.created_at || new Date().toISOString()
          );
        }
      }
    }},
    { name: 'user_activity_logs', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} activity logs in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO user_activity_logs (user_id, action, details, firestore_id, created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(firestore_id) DO UPDATE SET
              action=excluded.action,
              details=excluded.details
          `).run(
            sqliteUserId, 
            data.action, 
            data.details, 
            doc.id,
            data.created_at || new Date().toISOString()
          );
        }
      }
    }},
    { name: 'body_composition_logs', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} body composition logs in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO body_composition_logs (user_id, image_url, analysis, feedback, firestore_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(firestore_id) DO UPDATE SET
              image_url=excluded.image_url,
              analysis=excluded.analysis,
              feedback=excluded.feedback
          `).run(
            sqliteUserId, 
            data.image_url, 
            data.analysis, 
            data.feedback, 
            doc.id,
            data.created_at || new Date().toISOString()
          );
        }
      }
    }},
    { name: 'fitness_overviews', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} fitness overviews in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO fitness_overviews (user_id, overview, firestore_id, created_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(firestore_id) DO UPDATE SET
              overview=excluded.overview
          `).run(
            sqliteUserId, 
            data.overview, 
            doc.id,
            data.created_at || new Date().toISOString()
          );
        }
      }
    }},
    { name: 'custom_programs', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} custom programs in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO custom_programs (user_id, name, description, data, firestore_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(firestore_id) DO UPDATE SET
              name=excluded.name,
              description=excluded.description,
              data=excluded.data
          `).run(
            sqliteUserId, 
            data.name, 
            data.description, 
            JSON.stringify(data.data), 
            doc.id,
            data.created_at || new Date().toISOString()
          );
        }
      }
    }},
    { name: 'messages', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} messages in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteSenderId = resolveUserId(data.sender_id);
        const sqliteReceiverId = resolveUserId(data.receiver_id);
        db.prepare(`
          INSERT INTO messages (sender_id, receiver_id, message, is_read, is_deleted, firestore_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(firestore_id) DO UPDATE SET
            is_read=excluded.is_read,
            is_deleted=excluded.is_deleted,
            updated_at=excluded.updated_at
        `).run(
          sqliteSenderId, 
          sqliteReceiverId, 
          data.message, 
          data.is_read ? 1 : 0, 
          data.is_deleted ? 1 : 0, 
          doc.id,
          data.created_at || new Date().toISOString(),
          data.updated_at || new Date().toISOString()
        );
      }
    }},
    { name: 'workout_feedback', handler: async (snapshot: any) => {
      console.log(`[Rehydrate] Found ${snapshot.size} workout feedback entries in Firestore.`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sqliteUserId = resolveUserId(data.user_id);
        if (typeof sqliteUserId === 'number') {
          db.prepare(`
            INSERT INTO workout_feedback (user_id, workout_id, program_id, rating, comment, firestore_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(firestore_id) DO UPDATE SET
              rating=excluded.rating,
              comment=excluded.comment
          `).run(
            sqliteUserId, 
            data.workout_id, 
            data.program_id, 
            data.rating, 
            data.comment, 
            doc.id,
            data.created_at || new Date().toISOString()
          );
        }
      }
    }}
  ];

  for (const col of collections) {
    try {
      console.log(`[Rehydrate] Fetching collection: ${col.name} from Firestore...`);
      const snapshot = await adminDb.collection(col.name).get();
      console.log(`[Rehydrate] Successfully fetched ${snapshot.size} documents from collection: ${col.name}`);
      await col.handler(snapshot);
    } catch (err: any) {
      console.error(`[Rehydrate] Error rehydrating collection ${col.name}:`, err.message || err);
      if (err.code === 5) {
        console.error(`[Rehydrate] Collection ${col.name} was not found (NOT_FOUND). Check if the collection exists in your Firestore database.`);
      }
      // Continue with next collection
    }
  }

  console.log("[Rehydrate] Database re-hydration process finished.");
  isRehydrated = true;
}

async function startServer() {
  console.log("startServer() called");
  
  console.log("Initializing express app...");
  const app = express();
  const PORT = Number(process.env.PORT) || 8080;

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
  
  // Middleware to check if rehydration is complete (optional, but good for health checks)
  app.get('/api/rehydration-status', (req, res) => {
    res.json({ isRehydrated });
  });

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
      appUrl: process.env.APP_URL,
      isRehydrated
    });
  });

  // Serve uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Email Transporter
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

// Helper for sending welcome email
async function sendWelcomeEmail(email: string, firstName: string) {
  const appUrl = process.env.APP_URL || 'https://krome-fitness.com';
  
  try {
    await transporter.sendMail({
      from: '"KROME Sports Performance" <kromefitness@gmail.com>',
      to: email,
      subject: 'Welcome to KROME Sports Performance!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 40px; border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #D4AF37 0%, #F5E050 100%); border-radius: 15px; line-height: 60px; font-size: 30px; font-weight: 900; color: #000; font-style: italic;">K</div>
            <h1 style="text-transform: uppercase; font-style: italic; letter-spacing: -1px; margin-top: 20px;">Welcome to the Nation</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Hello ${firstName},</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Welcome to <strong>KROME Sports Performance</strong>! We're excited to help you reach your peak performance. Your account has been successfully created and you're now part of an elite community of athletes.</p>
          
          <div style="background-color: #111; border: 1px solid #333; padding: 25px; border-radius: 15px; margin: 30px 0;">
            <h3 style="color: #D4AF37; text-transform: uppercase; margin-top: 0;">Your Onboarding Checklist:</h3>
            <ul style="padding-left: 20px; color: #ccc;">
              <li style="margin-bottom: 10px;"><strong>Complete your PAR-Q:</strong> Ensure you're cleared for high-intensity training.</li>
              <li style="margin-bottom: 10px;"><strong>Set your Fitness Goals:</strong> Tell us what you want to achieve so we can tailor your experience.</li>
              <li style="margin-bottom: 10px;"><strong>Browse the Catalog:</strong> Explore our 52-week programs and specialized training.</li>
              <li style="margin-bottom: 10px;"><strong>Start Training:</strong> Log your first workout and begin tracking your progress.</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${appUrl}" style="background-color: #D4AF37; color: #000; padding: 15px 35px; text-decoration: none; border-radius: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Access Your Dashboard</a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 50px; border-top: 1px solid #222; padding-top: 20px;">
            &copy; ${new Date().getFullYear()} KROME Sports Performance. All rights reserved.<br>
            Fueling the next generation of elite athletes.
          </p>
        </div>
      `,
      text: `Hello ${firstName},\n\nWelcome to KROME Sports Performance! We're excited to have you on board. Your account has been successfully created.\n\nYour Onboarding Checklist:\n1. Complete your PAR-Q\n2. Set your Fitness Goals\n3. Browse the Catalog\n4. Start Training\n\nAccess your dashboard here: ${appUrl}\n\nBest regards,\nThe KROME Team`,
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

// Helper for sending admin notification
async function sendAdminRegistrationNotification(userData: any) {
  try {
    await transporter.sendMail({
      from: '"KROME System" <kromefitness@gmail.com>',
      to: 'kromefitness@gmail.com', // Admin email
      subject: 'New Athlete Registered',
      text: `A new athlete has registered:\n\nName: ${userData.firstName} ${userData.lastName}\nEmail: ${userData.email}\nUsername: ${userData.username}\nRole: ${userData.role}\n\nCheck the admin dashboard for more details.`,
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}
// Square Webhook
app.post('/api/webhook', async (req, res) => {
  try {
    const event = req.body;
      console.log('Square Webhook Event:', event.type, event.data?.id);
      
      if (event.type === 'payment.created' || event.type === 'payment.updated') {
        const payment = event.data.object.payment;
        
        if (payment.status === 'COMPLETED') {
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
                
                // Check if purchase already exists to avoid duplicates
                const existing = db.prepare('SELECT id FROM purchases WHERE square_order_id = ?').get(orderId);
                if (!existing) {
                  // 1. Sync to Firestore first
                  const firestoreRef = await adminDb.collection('purchases').add({
                    user_id: userId,
                    item_name: itemName,
                    price: price,
                    square_order_id: orderId,
                    program_id: programId,
                    created_at: new Date().toISOString()
                  });

                  // 2. Save to SQLite
                  db.prepare('INSERT INTO purchases (user_id, item_name, price, square_order_id, program_id, firestore_id) VALUES (?, ?, ?, ?, ?, ?)').run(sqliteId, itemName, price, orderId, programId, firestoreRef.id);
                  
                  // Send notification
                  sendNotification(Number(sqliteId), 'Purchase Confirmed', `Thank you for purchasing ${itemName}! Your program is now available in your profile.`, '/profile');

                  // Auto-update user role if they bought a program
                  if (itemName.toLowerCase().includes('program') || itemName.toLowerCase().includes('plan')) {
                    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('athlete', sqliteId);
                    // Sync role to Firestore
                    await adminDb.collection('users').doc(userId).update({ role: 'athlete' });
                  }
                }
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
  app.post('/api/notifications/subscribe', async (req, res) => {
    const { userId, subscription } = req.body;
    const sqliteId = resolveUserId(userId);
    try {
      const subStr = JSON.stringify(subscription);
      db.prepare('INSERT INTO push_subscriptions (user_id, subscription) VALUES (?, ?)').run(sqliteId, subStr);
      
      // Sync to Firestore
      const subId = Buffer.from(subStr).toString('base64').substring(0, 50); // Create a deterministic ID
      await adminDb.collection('push_subscriptions').doc(`${userId}_${subId}`).set({
        user_id: userId,
        subscription: subStr,
        created_at: new Date().toISOString()
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Error subscribing to notifications:", err);
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
  app.post("/api/leads", async (req, res) => {
    const { name, email, status, value, sports, sessionRequests, preferredTimes, preferredDays, positions, userId } = req.body;
    try {
      // 1. Save to Firestore first to get an ID
      const leadData = {
        name,
        email,
        status: status || 'New Lead',
        value: value || 0,
        sports: sports || [],
        sessionRequests: sessionRequests || [],
        preferredTimes: preferredTimes || [],
        preferredDays: preferredDays || [],
        positions: positions || [],
        user_id: userId || null,
        created_at: new Date().toISOString()
      };
      const firestoreRef = await adminDb.collection('leads').add(leadData);
      const firestoreId = firestoreRef.id;

      // 2. Save to SQLite with firestore_id
      const result = db.prepare(`
        INSERT INTO leads (
          name, email, status, value, sports, session_requests, 
          preferred_times, preferred_days, positions, user_id, firestore_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        userId || null,
        firestoreId
      );

      res.json({ 
        id: result.lastInsertRowid,
        firestoreId,
        ...leadData,
        dateAdded: leadData.created_at,
        lastContact: leadData.created_at
      });
    } catch (err) {
      console.error("Database error adding lead:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Leads: Update lead
  const updateLeadHandler = async (req: any, res: any) => {
    const { id } = req.params;
    const { status, value, sports, sessionRequests, preferredTimes, preferredDays, positions } = req.body;
    try {
      // 1. Get firestore_id from SQLite
      const lead = db.prepare('SELECT firestore_id FROM leads WHERE id = ?').get(id) as { firestore_id: string } | undefined;
      
      const updates: string[] = [];
      const params: any[] = [];
      const firestoreUpdates: any = {};

      if (status !== undefined) { 
        updates.push('status = ?'); params.push(status); 
        firestoreUpdates.status = status;
      }
      if (value !== undefined) { 
        updates.push('value = ?'); params.push(value); 
        firestoreUpdates.value = value;
      }
      if (sports !== undefined) { 
        updates.push('sports = ?'); params.push(JSON.stringify(sports)); 
        firestoreUpdates.sports = sports;
      }
      if (sessionRequests !== undefined) { 
        updates.push('session_requests = ?'); params.push(JSON.stringify(sessionRequests)); 
        firestoreUpdates.sessionRequests = sessionRequests;
      }
      if (preferredTimes !== undefined) { 
        updates.push('preferred_times = ?'); params.push(JSON.stringify(preferredTimes)); 
        firestoreUpdates.preferredTimes = preferredTimes;
      }
      if (preferredDays !== undefined) { 
        updates.push('preferred_days = ?'); params.push(JSON.stringify(preferredDays)); 
        firestoreUpdates.preferredDays = preferredDays;
      }
      if (positions !== undefined) { 
        updates.push('positions = ?'); params.push(JSON.stringify(positions)); 
        firestoreUpdates.positions = positions;
      }

      if (updates.length > 0) {
        // 2. Update SQLite
        params.push(id);
        db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params);

        // 3. Update Firestore if firestore_id exists
        if (lead?.firestore_id) {
          await adminDb.collection('leads').doc(lead.firestore_id).update(firestoreUpdates);
        }
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
  app.delete("/api/leads/:id", async (req, res) => {
    const { id } = req.params;
    try {
      // 1. Get firestore_id from SQLite
      const lead = db.prepare('SELECT firestore_id FROM leads WHERE id = ?').get(id) as { firestore_id: string } | undefined;

      // 2. Delete from SQLite
      db.prepare('DELETE FROM leads WHERE id = ?').run(id);

      // 3. Delete from Firestore if firestore_id exists
      if (lead?.firestore_id) {
        await adminDb.collection('leads').doc(lead.firestore_id).delete();
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Database error deleting lead:", err);
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
        role: (email === 'swolecode@gmail.com' || email === 'kromefitness@gmail.com') ? 'admin' : (role === 'user' ? 'athlete' : (role || 'athlete')),
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
        await sendWelcomeEmail(email, finalFirstName);
        await sendAdminRegistrationNotification(userData);
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

  // Admin: Test SMTP
  app.post("/api/admin/test-smtp", async (req, res) => {
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
        to: 'kromefitness@gmail.com',
        subject: 'SMTP Test Successful',
        text: `This is a test email from KROME Sports Performance to verify that your SMTP settings are correctly configured.\n\nTimestamp: ${new Date().toISOString()}\n\nIf you received this, your email system is working correctly!`,
      });

      res.json({ success: true, message: "Test email sent successfully to kromefitness@gmail.com" });
    } catch (err: any) {
      console.error('SMTP Test Error:', err);
      res.status(500).json({ error: err.message || "Failed to send test email" });
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
  app.post("/api/admin/assign-program", async (req, res) => {
    const { userId, programId, itemName, price } = req.body;
    const sqliteId = resolveUserId(userId);
    try {
      // 1. Save to Firestore first to get an ID
      const firestoreRef = await adminDb.collection('purchases').add({
        user_id: userId,
        item_name: itemName,
        price: price || 0,
        program_id: programId,
        created_at: new Date().toISOString()
      });

      // 2. Sync with SQLite
      db.prepare(`
        INSERT INTO purchases (user_id, item_name, price, program_id, firestore_id) 
        VALUES (?, ?, ?, ?, ?)
      `).run(sqliteId, itemName, price || 0, programId, firestoreRef.id);

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
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const formatMonth = (m: number) => m.toString().padStart(2, '0');

      // Current Month Start
      const currentMonthStart = `${currentYear}-${formatMonth(currentMonth)}-01 00:00:00`;
      
      // Previous Month Start
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonth = prevMonthDate.getMonth() + 1;
      const prevYear = prevMonthDate.getFullYear();
      const prevMonthStart = `${prevYear}-${formatMonth(prevMonth)}-01 00:00:00`;

      // Previous Month-to-Date End (Precise comparison up to the same point in the month)
      const currentMonthStartObj = new Date(currentYear, now.getMonth(), 1);
      const durationInMonth = now.getTime() - currentMonthStartObj.getTime();
      
      const prevMonthStartObj = new Date(prevYear, prevMonth - 1, 1);
      const prevMonthMTDEndObj = new Date(prevMonthStartObj.getTime() + durationInMonth);
      
      // Cap at the end of the previous month
      const lastDayOfPrevMonth = new Date(currentYear, now.getMonth(), 0, 23, 59, 59, 999);
      const cappedPrevMonthMTDEndObj = prevMonthMTDEndObj > lastDayOfPrevMonth ? lastDayOfPrevMonth : prevMonthMTDEndObj;
      const prevMonthMTDEnd = formatDateForSQLite(cappedPrevMonthMTDEndObj);

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
        const growth = ((current - previous) / previous) * 100;
        return parseFloat(growth.toFixed(1));
      };

      const revenueGrowth = calculateGrowth(currentMonthRevenue.total || 0, prevMonthMTDRevenue.total || 0);
      const userGrowth = calculateGrowth(currentMonthUsers.count || 0, prevMonthMTDUsers.count || 0);
      const leadGrowth = calculateGrowth(currentMonthLeads.count || 0, prevMonthMTDLeads.count || 0);

      const mrr = currentMonthRevenue.total || 0;
      const ltv = totalUsers.count > 0 ? (totalRevenue.total || 0) / totalUsers.count : 0;
      
      const leadConversionRate = totalLeads.count > 0 ? Number(((consultations.count / totalLeads.count) * 100).toFixed(1)) : 0;
      const consultationRate = totalLeads.count > 0 ? Number(((consultations.count / totalLeads.count) * 100).toFixed(1)) : 0; // Often same as lead conversion in this context
      const closeRate = consultations.count > 0 ? Number(((closedWonLeads.count / consultations.count) * 100).toFixed(1)) : 0;

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
        leadConversionRate,
        consultationRate,
        closeRate
      });
    } catch (err) {
      console.error("Error calculating growth KPIs:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // User: Update profile
  app.patch("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, avatar_url, firstName, lastName, avatarUrl, role, status, username, fitness_goal } = req.body;
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
      if (fitness_goal !== undefined) { fields.push('fitness_goal = ?'); params.push(fitness_goal); }
      
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
        if (fitness_goal !== undefined) firestoreUpdate.fitnessGoal = fitness_goal;

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
  app.patch("/api/users/:id/parq-complete", async (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('UPDATE users SET parq_completed = 1 WHERE id = ?').run(id);
      
      // Sync to Firestore
      const user = db.prepare('SELECT uid FROM users WHERE id = ?').get(id) as any;
      if (user?.uid) {
        await adminDb.collection('users').doc(user.uid).update({ parq_completed: true });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Error marking PAR-Q as completed:", err);
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
    const sqliteId = resolveUserId(user_id);
    try {
      const recordedAt = new Date().toISOString();
      const docRef = await adminDb.collection('progress').add({
        user_id,
        metric_name,
        metric_value,
        unit,
        recorded_at: recordedAt
      });

      // Sync with SQLite
      db.prepare(`
        INSERT INTO progress (user_id, metric_name, metric_value, unit, recorded_at, firestore_id) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(sqliteId, metric_name, metric_value, unit, recordedAt, docRef.id);

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
  app.post("/api/metrics/:userId", async (req, res) => {
    const { userId } = req.params;
    const sqliteId = resolveUserId(userId);
    const data = req.body;
    try {
      // 1. Update SQLite
      db.prepare(`
        INSERT INTO user_metrics (user_id, data, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET 
          data=excluded.data, 
          updated_at=CURRENT_TIMESTAMP
      `).run(sqliteId, JSON.stringify(data));

      // 2. Update Firestore
      await adminDb.collection('user_metrics').doc(userId).set({
        data,
        updated_at: new Date().toISOString()
      }, { merge: true });

      res.json({ success: true });
    } catch (err) {
      console.error("Error saving metrics:", err);
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
  app.post("/api/body-comp/:userId", async (req, res) => {
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

      // 2. Update Firestore
      const batch = adminDb.batch();
      
      // Delete existing history for this user in Firestore
      const snapshot = await adminDb.collection('body_comp_history').where('user_id', '==', userId).get();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Add new history entries
      for (const entry of history) {
        const docRef = adminDb.collection('body_comp_history').doc(entry.id);
        batch.set(docRef, {
          user_id: userId,
          week: entry.week,
          date: entry.date,
          weight: entry.weight,
          height: entry.height,
          bmi: entry.bmi,
          bodyFat: entry.bodyFat,
          leanMuscle: entry.leanMuscle,
          fatMass: entry.fatMass,
          created_at: new Date().toISOString()
        });
      }
      
      await batch.commit();

      res.json({ success: true });
    } catch (err) {
      console.error("Error saving body comp history:", err);
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
  app.post("/api/parq/:userId", async (req, res) => {
    const { userId } = req.params;
    const sqliteId = resolveUserId(userId);
    const data = req.body;
    try {
      // 1. Update SQLite
      db.prepare(`
        INSERT INTO user_parq (user_id, data, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET 
          data=excluded.data, 
          updated_at=CURRENT_TIMESTAMP
      `).run(sqliteId, JSON.stringify(data));

      // 2. Update Firestore
      await adminDb.collection('user_parq').doc(userId).set({
        data,
        updated_at: new Date().toISOString()
      }, { merge: true });

      res.json({ success: true });
    } catch (err) {
      console.error("Error saving PAR-Q:", err);
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
      const sqliteId = resolveUserId(userId);
      const deleteStmt = db.prepare('DELETE FROM nutrition_logs WHERE user_id = ?');
      const insertStmt = db.prepare(`
        INSERT INTO nutrition_logs (
          user_id, log_id, food_id, name, category, meal, date, 
          servings, serving_size, calories, protein, carbs, fat, firestore_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // We'll clear and re-insert in SQLite to match incoming logs exactly
      deleteStmt.run(sqliteId);

      for (const log of logs) {
        const logRef = adminDb.collection('nutrition_logs').doc(log.logId);
        const logData = {
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
        };
        batch.set(logRef, logData, { merge: true });

        // Sync with SQLite
        insertStmt.run(
          sqliteId, log.logId, log.id, log.name, log.category, log.meal, log.date,
          log.servings, log.serving.size, log.serving.calories, log.serving.protein,
          log.serving.carbs, log.serving.fat, log.logId
        );
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
      
      const sqliteId = resolveUserId(userId);
      const insertStmt = db.prepare(`
        INSERT INTO workout_logs (
          user_id, workout_id, exercise_id, completed, date, edited_data, 
          workout_start_time, workout_end_time, firestore_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, workout_id, exercise_id, date) DO UPDATE SET
          completed = excluded.completed,
          edited_data = excluded.edited_data,
          workout_start_time = excluded.workout_start_time,
          workout_end_time = excluded.workout_end_time,
          firestore_id = excluded.firestore_id
      `);

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

        // Sync with SQLite
        insertStmt.run(
          sqliteId, log.workoutId, log.exerciseId, log.completed ? 1 : 0, log.date, 
          JSON.stringify(log.editedData || {}), 
          log.workoutStartTime || null, log.workoutEndTime || null, logId
        );
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
      
      const sqliteId = resolveUserId(userId);
      const batch = adminDb.batch();
      for (const doc of snapshot.docs) {
        batch.update(doc.ref, { workout_end_time: end_time });
      }
      await batch.commit();

      // Sync with SQLite
      db.prepare(`
        UPDATE workout_logs 
        SET workout_end_time = ? 
        WHERE user_id = ? AND workout_id = ? AND date = ?
      `).run(end_time, sqliteId, workout_id, date);

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
      
      const sqliteId = resolveUserId(userId);
      const insertStmt = db.prepare(`
        INSERT INTO program_progress (
          user_id, program_id, phase, week, day, completed, date, firestore_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, program_id, phase, week, day) DO UPDATE SET
          completed = excluded.completed,
          date = excluded.date,
          firestore_id = excluded.firestore_id
      `);

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

        // Sync with SQLite
        insertStmt.run(
          sqliteId, p.programId, p.phase, p.week, p.day, p.completed ? 1 : 0, p.date, progressId
        );
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

      const docRef = await adminDb.collection('user_activity_logs').add(logData);
      
      // Sync with SQLite
      const sqliteId = user_id ? resolveUserId(user_id) : null;
      db.prepare(`
        INSERT INTO user_activity_logs (user_id, username, action, details, firestore_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(sqliteId, logData.username || null, action, logData.details, docRef.id, logData.created_at);

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
      const createdAt = new Date().toISOString();
      const docRef = await adminDb.collection('body_composition_logs').add({
        user_id: userId,
        image_url,
        analysis,
        feedback,
        created_at: createdAt
      });
      
      // Sync with SQLite
      const sqliteId = resolveUserId(userId);
      db.prepare(`
        INSERT INTO body_composition_logs (user_id, image_url, analysis, feedback, firestore_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(sqliteId, image_url, analysis, feedback, docRef.id, createdAt);

      // Send notification to user
      sendNotification(Number(sqliteId), 'Body Composition Feedback', 'Your coach has provided feedback on your latest body composition analysis.', '/profile');

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
    const sqliteId = resolveUserId(userId);
    try {
      const createdAt = new Date().toISOString();
      const docRef = await adminDb.collection('purchases').add({
        user_id: userId,
        item_name: itemName,
        price,
        stripe_session_id: status,
        created_at: createdAt
      });

      // Sync with SQLite
      db.prepare(`
        INSERT INTO purchases (user_id, item_name, price, square_order_id, firestore_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(sqliteId, itemName, price, status, docRef.id, createdAt);

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
      const createdAt = new Date().toISOString();
      const docRef = await adminDb.collection('fitness_overviews').add({
        user_id: userId,
        overview,
        created_at: createdAt
      });
      
      // Sync with SQLite
      const sqliteId = resolveUserId(userId);
      db.prepare(`
        INSERT INTO fitness_overviews (user_id, overview, firestore_id, created_at) 
        VALUES (?, ?, ?, ?)
      `).run(sqliteId, overview, docRef.id, createdAt);

      // Send notification to user
      sendNotification(Number(sqliteId), 'Fitness Overview Updated', 'Your coach has updated your fitness overview. Check it out in your profile.', '/profile');

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
      const createdAt = new Date().toISOString();
      const docRef = await adminDb.collection('custom_programs').add({
        user_id: userId,
        name,
        description,
        data: JSON.stringify(data),
        created_at: createdAt
      });
      
      // Sync with SQLite
      const sqliteId = resolveUserId(userId);
      db.prepare(`
        INSERT INTO custom_programs (user_id, name, description, data, firestore_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(sqliteId, name, description, JSON.stringify(data), docRef.id, createdAt);

      // Send notification to user
      sendNotification(Number(sqliteId), 'New Program Assigned', `A new custom program "${name}" has been assigned to you.`, '/profile');

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
      const createdAt = new Date().toISOString();
      const docRef = await adminDb.collection('messages').add({
        sender_id,
        receiver_id,
        message,
        is_read: false,
        is_deleted: false,
        created_at: createdAt
      });
      
      // Sync with SQLite
      const sqliteSenderId = resolveUserId(sender_id);
      const sqliteReceiverId = resolveUserId(receiver_id);
      db.prepare(`
        INSERT INTO messages (sender_id, receiver_id, message, is_read, is_deleted, firestore_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(sqliteSenderId, sqliteReceiverId, message, 0, 0, docRef.id, createdAt);

      // Send notification to receiver
      const senderDoc = await adminDb.collection('users').doc(sender_id.toString()).get();
      const senderUsername = senderDoc.data()?.username || 'Admin';
      sendNotification(Number(sqliteReceiverId), 'New Message', `You have a new message from ${senderUsername}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`, '/profile');

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
    const sqliteId = resolveUserId(user_id);
    try {
      const createdAt = new Date().toISOString();
      const docRef = await adminDb.collection('workout_feedback').add({
        user_id,
        workout_id,
        program_id,
        rating,
        comment,
        created_at: createdAt
      });

      // Sync with SQLite
      db.prepare(`
        INSERT INTO workout_feedback (user_id, workout_id, program_id, rating, comment, firestore_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(sqliteId, workout_id, program_id, rating, comment, docRef.id, createdAt);

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
  const isProduction = process.env.NODE_ENV === 'production';

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
    
    // Start rehydration in background after server is listening
    console.log("[Server] Starting background rehydration...");
    rehydrateDatabase().catch(err => {
      console.error("[Server] Background rehydration failed:", err);
    });
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
