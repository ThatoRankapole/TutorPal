import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
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
import {
  getAuth,
  sendPasswordResetEmail,
  EmailAuthProvider,
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Collection references
const moduleRef = collection(db, "Modules");
const meetingsRef = collection(db, "meetings");
const messagesRef = collection(db, "Messages");
const exercisesRef = collection(db, "Exercises");
const tutorsRef = collection(db, "Tutors");
const eventsRef = collection(db, "Events");
const studentRef = collection(db, "Student");

export {
  db,
  moduleRef,
  meetingsRef,
  messagesRef,
  exercisesRef,
  tutorsRef,
  eventsRef,
  studentRef,
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
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  setDoc
};