// src/config/firebaseAdmin.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read service account JSON from file path set via env var
const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  || './admin/caregiver-mobile-application-firebase-adminsdk-fbsvc-1e64421953.json';

const serviceAccount = JSON.parse(
  readFileSync(resolve(serviceAccountPath), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;