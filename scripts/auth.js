import { 
  auth, 
  configureAuthPersistence,
  sendPasswordResetEmail,
  db,
  studentRef,
  getDocs,
  where,
  query
} from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('student-login-form');
  const forgotPasswordLink = document.querySelector('.forgot-password');
  const errorMessage = document.getElementById('error-message');
  const rememberMeCheckbox = document.getElementById('remember-me');

  // Login function
  async function handleLogin(event) {
    event.preventDefault();
    errorMessage.textContent = '';

    const studentNumber = document.getElementById('student-number').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = rememberMeCheckbox.checked;

    if (!studentNumber || !password) {
      showError("Please fill in all fields");
      return;
    }

    try {
      // Set persistence before authentication
      await configureAuthPersistence(rememberMe);

      // 1. Check if student exists in Firestore
      const studentQuery = query(studentRef, where("studentNumber", "==", studentNumber));
      const querySnapshot = await getDocs(studentQuery);

      if (querySnapshot.empty) {
        showError("Student record not found");
        return;
      }

      // 2. Get the registered email from Firestore
      const studentData = querySnapshot.docs[0].data();
      const studentEmail = studentData.email;

      if (!studentEmail) {
        showError("No registered email found for this student");
        return;
      }

      // 3. Authenticate with Firebase Auth
      const userCredential = await auth.signInWithEmailAndPassword(studentEmail, password);
      
      // 4. Verify the login was successful
      if (userCredential.user) {
        console.log("Login successful for:", userCredential.user.email);
      } else {
        showError("Authentication failed. Please try again.");
      }

    } catch (error) {
      console.error("Login error:", error);
      handleAuthError(error);
    }
  }

  // Forgot password function
  async function handleForgotPassword(event) {
    event.preventDefault();
    errorMessage.textContent = '';

    const studentNumber = document.getElementById('student-number').value.trim();

    if (!studentNumber) {
      showError("Please enter your student number first");
      return;
    }

    try {
      const studentQuery = query(studentRef, where("studentNumber", "==", studentNumber));
      const querySnapshot = await getDocs(studentQuery);

      if (querySnapshot.empty) {
        showError("Student record not found");
        return;
      }

      const studentData = querySnapshot.docs[0].data();
      const studentEmail = studentData.email;

      if (!studentEmail) {
        showError("No registered email found for this student");
        return;
      }

      await sendPasswordResetEmail(auth, studentEmail);
      showError("Password reset email sent. Check your inbox.", "success");

    } catch (error) {
      console.error("Password reset error:", error);
      handleAuthError(error);
    }
  }

  // Error handling
  function handleAuthError(error) {
    switch (error.code) {
      case 'auth/wrong-password':
        showError("Incorrect password");
        break;
      case 'auth/user-not-found':
        showError("Account not found");
        break;
      case 'auth/too-many-requests':
        showError("Too many attempts. Try again later.");
        break;
      case 'auth/invalid-email':
        showError("Invalid email format");
        break;
      case 'permission-denied':
        showError("Access denied. Please contact support.");
        break;
      default:
        showError("Login failed. Please try again.");
    }
  }

  function showError(message, type = "error") {
    errorMessage.textContent = message;
    errorMessage.className = `error-message ${type}`;
  }

  // Event listeners
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', handleForgotPassword);
});

if (performance.navigation.type === 2) {
  // This page was loaded via back/forward button
  window.location.replace('index.html');
}