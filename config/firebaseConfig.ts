import type { ServiceAccount } from "firebase-admin";

interface CustomServiceAccount extends ServiceAccount {
  clientEmail?: string;
}

const firebaseAdminConfig: CustomServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID ?? "",
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
};

export default firebaseAdminConfig;
