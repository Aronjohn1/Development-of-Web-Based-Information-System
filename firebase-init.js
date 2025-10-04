
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCkdzN9WSpfccnMI_2_9JoAOI8xp8_tpw8",
  authDomain: "web-based-8afc9.firebaseapp.com",
  projectId: "web-based-8afc9",
  storageBucket: "web-based-8afc9.firebasestorage.app",
  messagingSenderId: "674288389573",
  appId: "1:674288389573:web:c4f3e41b569088801b0fac",
  measurementId: "G-RPG4DLFG13"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
