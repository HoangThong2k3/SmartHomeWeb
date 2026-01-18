import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database, ref, onValue, off, Unsubscribe } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

let app: FirebaseApp | null = null;
let database: Database | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!firebaseConfig.databaseURL) {
      throw new Error(
        "Firebase configuration is missing. Please set NEXT_PUBLIC_FIREBASE_DATABASE_URL environment variable."
      );
    }
    app = initializeApp(firebaseConfig);
  }
  return app;
}

function getFirebaseDatabase(): Database {
  if (!database) {
    getFirebaseApp();
    database = getDatabase(app!);
  }
  return database;
}

export interface FirebaseTelemetryData {
  temp?: number;
  hum?: number;
  gas_mq2?: number;
  gas_mq135?: number;
  motion?: number;
  timestamp?: number;
  [key: string]: any;
}

export function subscribeToTelemetry(
  nodeId: string,
  callback: (data: FirebaseTelemetryData | null) => void
): Unsubscribe {
  try {
    const db = getFirebaseDatabase();
    const deviceRef = ref(db, `devices/${nodeId}/telemetry`);
    const unsubscribe = onValue(
      deviceRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          console.log(`[Firebase] Data received for ${nodeId}:`, data);
          callback(data);
        } else {
          console.log(`[Firebase] No data found for ${nodeId}`);
          callback(null);
        }
      },
      (error) => {
        console.error(`[Firebase] Error listening to ${nodeId}:`, error);
        callback(null);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error("[Firebase] Error setting up subscription:", error);
    throw new Error(`Failed to subscribe to Firebase: ${error.message}`);
  }
}

export function unsubscribeFromTelemetry(unsubscribe: Unsubscribe): void {
  try {
    unsubscribe();
  } catch (error: any) {
    console.error("[Firebase] Error unsubscribing:", error);
  }
}

export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.databaseURL;
}

