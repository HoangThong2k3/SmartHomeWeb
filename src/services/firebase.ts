// Firebase Realtime Database Service
import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database, ref, onValue, off, Unsubscribe } from "firebase/database";

// Firebase configuration
// Sử dụng environment variables để bảo mật
// Lấy từ config.json hoặc environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Initialize Firebase (chỉ initialize một lần)
let app: FirebaseApp | null = null;
let database: Database | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    // Validate config before initializing
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

/**
 * Interface cho dữ liệu telemetry từ Firebase
 * Phù hợp với cấu trúc: devices/{NodeId}/telemetry
 */
export interface FirebaseTelemetryData {
  temp?: number;
  hum?: number;
  gas_mq2?: number;
  gas_mq135?: number;
  motion?: number;
  timestamp?: number;
  [key: string]: any; // Cho phép các field khác
}

/**
 * Subscribe vào Firebase Realtime Database để lắng nghe dữ liệu telemetry
 * @param nodeId - NodeId (HardwareId) của thiết bị, ví dụ: "NODE_01"
 * @param callback - Callback function được gọi khi có dữ liệu mới
 * @returns Unsubscribe function để dừng lắng nghe
 */
export function subscribeToTelemetry(
  nodeId: string,
  callback: (data: FirebaseTelemetryData | null) => void
): Unsubscribe {
  try {
    const db = getFirebaseDatabase();
    const deviceRef = ref(db, `devices/${nodeId}/telemetry`);

    // Lắng nghe thay đổi dữ liệu
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

/**
 * Unsubscribe từ Firebase Realtime Database
 * @param unsubscribe - Function trả về từ subscribeToTelemetry
 */
export function unsubscribeFromTelemetry(unsubscribe: Unsubscribe): void {
  try {
    unsubscribe();
  } catch (error: any) {
    console.error("[Firebase] Error unsubscribing:", error);
  }
}

/**
 * Kiểm tra xem Firebase đã được cấu hình chưa
 */
export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.databaseURL;
}

