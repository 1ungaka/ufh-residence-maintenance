/**
 * Central configuration.
 * All secrets and environment-specific values come from environment variables
 * (loaded from backend/.env). Nothing sensitive is hard-coded in the source.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

const isTest = process.env.NODE_ENV === 'test';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,

  // JWT settings
  jwtSecret: process.env.JWT_SECRET || (isTest ? 'test-only-secret' : 'dev-only-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',

  // Database
  databaseFile: isTest
    ? ':memory:'
    : path.resolve(backendRoot, process.env.DATABASE_FILE || 'database/maintenance.db'),

  // Uploads
  uploadDir: path.resolve(backendRoot, process.env.UPLOAD_DIR || 'uploads'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES) || 2 * 1024 * 1024, // 2 MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],

  // CORS: the Vite dev server origin
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // University email domain used to validate student registrations
  studentEmailDomain: process.env.STUDENT_EMAIL_DOMAIN || 'ufh.ac.za',

  backendRoot
};

if (config.env === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.');
}
