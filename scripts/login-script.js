import {
  auth,
  db,
  studentRef,
  getDoc,
  doc,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  collection,
  getDocs
} from "./firebase-config.js";

const loginForm = document.getElementById("student-login-form");
const forgotPasswordLink = document.querySelector(".forgot-password");
const errorMessage = document.getElementById("error-message");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const studentDocRef = doc(studentRef, username);
  const studentDoc = await getDoc(studentDocRef);

  if (studentDoc.exists()) {
    // Student login
    const studentData = studentDoc.data();
    const studentEmail = studentData["student-email"];

    try {
      await signInWithEmailAndPassword(auth, studentEmail, password);
      sessionStorage.setItem("userRole", "student");
      sessionStorage.setItem("userEmail", studentEmail);
      window.location.href = "student-dashboard.html";
    } catch (error) {
      handleAuthError(error);
    }
  } else {
    // Check Tutor collection
    const tutorSnapshot = await getDocs(collection(db, "Tutor"));
    const tutor = tutorSnapshot.docs.find(
      (doc) => doc.data().email === username
    );

    if (tutor) {
      // Tutor login
      try {
        await signInWithEmailAndPassword(auth, username, password);
        sessionStorage.setItem("userRole", "tutor");
        sessionStorage.setItem("userEmail", username);
        window.location.href = "tutor-dashboard.html";
      } catch (error) {
        handleAuthError(error);
      }
    } else {
      // Check Admin collection
      const adminSnapshot = await getDocs(collection(db, "Admin"));
      const admin = adminSnapshot.docs.find(
        (doc) => doc.data()["admin-email"] === username
      );

      if (admin) {
        // Admin login
        try {
          await signInWithEmailAndPassword(auth, username, password);
          sessionStorage.setItem("userRole", "admin");
          sessionStorage.setItem("userEmail", username);
          window.location.href = "admin-dashboard.html";
        } catch (error) {
          handleAuthError(error);
        }
      } else {
        errorMessage.textContent = "Username not found";
      }
    }
  }
});

forgotPasswordLink.addEventListener("click", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;

  const studentDocRef = doc(studentRef, username);
  const studentDoc = await getDoc(studentDocRef);

  if (studentDoc.exists()) {
    const studentEmail = studentDoc.data()["student-email"];
    try {
      await sendPasswordResetEmail(auth, studentEmail);
      errorMessage.textContent = "Password reset email sent. Check your inbox.";
      errorMessage.classList.add("success-message");
    } catch (error) {
      console.error(error.message);
      errorMessage.textContent = "Failed to send password reset email.";
    }
  } else {
    errorMessage.textContent = "Username not found";
  }
});

function handleAuthError(error) {
  console.error(error.message);
  if (error.code === "auth/wrong-password") {
    errorMessage.textContent = "Incorrect password";
  } else if (error.code === "auth/user-not-found") {
    errorMessage.textContent = "Account not found";
  } else if (error.code === "auth/too-many-requests") {
    errorMessage.textContent = "Too many attempts. Try again later.";
  } else {
    errorMessage.textContent = "Login failed. Please try again.";
  }
}
