// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2aoxE8gjAM_C5IeRGALaO41jKQIPTaMs",
  authDomain: "gefron-lte-bdb90.firebaseapp.com",
  projectId: "gefron-lte-bdb90",
  storageBucket: "gefron-lte-bdb90.firebasestorage.app",
  messagingSenderId: "353096083467",
  appId: "1:353096083467:web:32500a68a550874ab63f0e",
  measurementId: "G-0QGDK8MSL2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Realtime Database
const db = getDatabase(app);

// Analytics (may require browser environment)
const analytics = getAnalytics(app);

// Export the DB reference used by services
export { db };