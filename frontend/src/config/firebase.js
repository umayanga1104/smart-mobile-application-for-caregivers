import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "caregiver-mobile-application.firebaseapp.com",
  projectId: "caregiver-mobile-application",
  storageBucket: "caregiver-mobile-application.firebasestorage.app",
  messagingSenderId: "1701481794",
  appId: "1:1701481794:web:3c96a2d0f1aa09bfbe4cdb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// // Import the functions you need from the SDKs you need
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { initializeApp } from "firebase/app";
// import { getReactNativePersistence, initializeAuth } from "firebase/auth";

// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyAJJgQ7k9ki8_hj4zJFXmGPSG4yNrnga_w",
//   authDomain: "caregiver-mobile-application.firebaseapp.com",
//   projectId: "caregiver-mobile-application",
//   storageBucket: "caregiver-mobile-application.firebasestorage.app",
//   messagingSenderId: "1701481794",
//   appId: "1:1701481794:web:3c96a2d0f1aa09bfbe4cdb"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// export const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage)
// });