// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your web app's Firebase configuration
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

async function checkStudentExistace(event) {
  event.preventDefault(); // Prevent form submission

  const studentNumber = document.getElementById("student-number").value;
  const docRef = doc(db, "Student", studentNumber);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    alert("Student exists");
  } else {
    alert("Student does not exist");
  }
}

document.getElementById("student-login-form").addEventListener("submit", checkStudentExistace);
