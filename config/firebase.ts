import admin from "firebase-admin";
import firebaseAdminConfig from "./firebaseConfig";

// Check if the default app is already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseAdminConfig),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  });
} else {
  admin.app(); // Reuse the default app
}

export default admin; // Export the initialized app
