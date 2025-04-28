// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// 🔥 너 Firebase 콘솔 > 설정 > 웹 앱 등록해서 받아야 해
const firebaseConfig = {
  apiKey: "AIzaSyCqV6hHh7ZrY3z5A80pbF0AQYgA8DpQoF0",
  authDomain: "muksafoodchain.firebaseapp.com",
  databaseURL: "https://muksafoodchain-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "muksafoodchain",
  storageBucket: "muksafoodchain.firebasestorage.app",
  messagingSenderId: "878874359727",
  appId: "1:878874359727:web:ae8a78d8cc7cc505f1215a"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Realtime Database 객체 가져오기
export const database = getDatabase(app);
