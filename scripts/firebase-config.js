import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";

// Firestore
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  getDoc,
  Timestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Auth (correct place for signInWithEmailAndPassword)
import {
  getAuth,
  sendPasswordResetEmail,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Storage
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKxS5yJU-6KiOs_fVO03tXoPC6sLFbnJU",
  authDomain: "tutorpal-98679.firebaseapp.com",
  projectId: "tutorpal-98679",
  storageBucket: "tutorpal-98679.firebasestorage.app",
  messagingSenderId: "473172390647",
  appId: "1:473172390647:web:04d7cb1d550a91dc8059f2",
  measurementId: "G-538MQ597GM"
};

// Initialize Firebase app & services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Collection references (use exact collection names you have)
const moduleRef = collection(db, "Modules");
const meetingsRef = collection(db, "meetings");
const messagesRef = collection(db, "Messages");
const exercisesRef = collection(db, "Exercises");
const tutorsRef = collection(db, "Tutor");
const eventsRef = collection(db, "Events");
const studentRef = collection(db, "Student");
const adminRef = collection(db, "Admin");

export {
  db,
  moduleRef,
  meetingsRef,
  messagesRef,
  exercisesRef,
  tutorsRef,
  eventsRef,
  studentRef,
  adminRef,
  getDocs,
  auth,
  query,
  where,
  getCountFromServer,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  getDoc,
  collection,
  Timestamp,
  sendPasswordResetEmail,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  setDoc,
  app
};
