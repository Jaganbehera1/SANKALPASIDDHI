import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD3HusdH4q05Mj-U5eO9Rl4CK4-C7yqd-k",
  authDomain: "sankalpasiddhi-69f43.firebaseapp.com",
  databaseURL: "https://sankalpasiddhi-69f43-default-rtdb.firebaseio.com",
  projectId: "sankalpasiddhi-69f43",
  storageBucket: "sankalpasiddhi-69f43.firebasestorage.app",
  messagingSenderId: "1034798117637",
  appId: "1:1034798117637:web:7d6424e0a7a990fc1efd6c",
  measurementId: "G-1CKBT68846"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
