// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAI, GoogleAIBackend } from "firebase/ai";
import { getStorage } from "firebase/storage";
import { getGenerativeModel } from "firebase/ai";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase AI Logic SDK initialization (per docs)
export const ai = getAI(app, { backend: new GoogleAIBackend() });
export const storage = getStorage(app);

// Direct Gemini model - no Genkit wrappers
export const geminiModel = getGenerativeModel(ai, { 
  model: "gemini-1.5-flash" 
});
