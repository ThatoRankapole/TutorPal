import {
  db,
  moduleRef,
  meetingsRef,
  messagesRef,
  exercisesRef,
  getDocs,
  query,
  where,
  auth
} from './firebase-config.js';
import { formatTimestamp } from './main-script.js';

// Fetch and display recent activities
async function loadRecentActivities(user) {
  try {
    if (!user) {
      console.log("No authenticated user - skipping activity load");
      return;
    }

    // Get the student number from email (assuming email is studentNumber@domain)
    const studentNumber = user.email.split('@')[0];

    const [messagesSnapshot, meetingsSnapshot, exercisesSnapshot] = await Promise.all([
      getDocs(query(messagesRef, where('studentNumber', '==', studentNumber))),
      getDocs(query(meetingsRef, where('participants', 'array-contains', studentNumber))),
      getDocs(query(exercisesRef, where('assignedTo', 'array-contains', studentNumber)))
    ]);

    const activityContainer = document.getElementById('activity-list');
    if (!activityContainer) return;
    
    activityContainer.innerHTML = '';

    const notificationsArr = [];

    // Process messages
    messagesSnapshot.forEach(doc => {
      const data = doc.data();
      notificationsArr.push({
        message: data.message,
        timestamp: data.timestamp?.seconds || data["upload-date"]?.seconds || 0,
        formattedTime: formatTimestamp(data.timestamp || data["upload-date"]),
        type: 'message'
      });
    });

    // Process meetings
    meetingsSnapshot.forEach(doc => {
      const data = doc.data();
      notificationsArr.push({
        message: `Meeting: ${data.name || data["meeting-name"]}<br>
        Description: ${data.description || data["meeting-description"]}<br>
        Date: ${formatTimestamp(data.date || data["meeting-date"])}<br>
        Link: <a href="${data.link || data["meeting-link"]}" target="_blank">Join</a>`,
        timestamp: data.timestamp?.seconds || data["upload-date"]?.seconds || 0,
        formattedTime: formatTimestamp(data.timestamp || data["upload-date"]),
        type: 'meeting'
      });
    });

    // Process exercises
    exercisesSnapshot.forEach(doc => {
      const data = doc.data();
      notificationsArr.push({
        message: `Exercise: ${data.name || data["exercise-name"]}<br>
        Due: ${formatTimestamp(data.dueDate || data["due-date"])}`,
        timestamp: data.timestamp?.seconds || data["upload-date"]?.seconds || 0,
        formattedTime: formatTimestamp(data.timestamp || data["upload-date"]),
        type: 'exercise'
      });
    });

    // Sort by timestamp (newest first)
    notificationsArr.sort((a, b) => b.timestamp - a.timestamp);

    // Display activities (limited to 10 most recent)
    notificationsArr.slice(0, 10).forEach(item => {
      const activityItem = document.createElement('div');
      let notificationIcon = "";

      if (item.type === 'message') {
        notificationIcon = `<i class="fa-solid fa-envelope"></i>`;
      } else if (item.type === 'meeting') {
        notificationIcon = `<i class="fa-solid fa-video"></i>`;
      } else if (item.type === 'exercise') {
        notificationIcon = `<i class="fa-solid fa-pen-to-square"></i>`;
      }

      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon">
          ${notificationIcon}
        </div>
        <div class="activity-details">
          <div class="activity-message">${item.message}</div>
          <small class="activity-time">${item.formattedTime}</small>
        </div>
      `;
      activityContainer.appendChild(activityItem);
    });

  } catch (error) {
    console.error("Error loading recent activities:", error);
    const activityContainer = document.getElementById('activity-list');
    if (activityContainer) {
      activityContainer.innerHTML = `
        <div class="error-message">
          Failed to load activities. Please try again later.
        </div>
      `;
    }
  }
}

// Logout function
function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        // Clear any cached data
        window.localStorage.clear();
        window.sessionStorage.clear();
        
        // Sign out from Firebase
        await auth.signOut();
        
        // Redirect to login page with a cache-busting parameter
        window.location.replace(`index.html?logout=${Date.now()}`);
      } catch (error) {
        console.error("Logout failed:", error);
        alert("Logout failed. Please try again.");
      }
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set up auth state listener
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      loadRecentActivities(user);
      setupLogout();
    } else {
      // No user is signed in - redirect to login
      window.location.replace('index.html');
    }
  });
});