import { auth } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.querySelector(".logout-btn");

  if (logoutButton) {
    logoutButton.addEventListener("click", async (e) => {
      e.preventDefault(); // Prevent navigation

      try {
        // Firebase sign out
        await auth.signOut();

        // Clear sessionStorage
        sessionStorage.clear();

        // Redirect to login/home page
        window.location.href = "index.html";
      } catch (error) {
        console.error("Logout failed:", error.message);
        alert("Logout failed. Please try again.");
      }
    });
  }
});
