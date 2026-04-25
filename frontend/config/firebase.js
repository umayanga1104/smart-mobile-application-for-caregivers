import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAJJgQ7k9ki8_hj4zJFXmGPSG4yNrnga_w",
  authDomain: "caregiver-mobile-application.firebaseapp.com",
  projectId: "caregiver-mobile-application",
  storageBucket: "caregiver-mobile-application.firebasestorage.app",
  messagingSenderId: "1701481794",
  appId: "1:1701481794:web:3c96a2d0f1aa09bfbe4cdb",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export default app;