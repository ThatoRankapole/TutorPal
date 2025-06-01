import {
  db,
  meetingsRef,
  messagesRef,
  exercisesRef,
  getDocs,
  query,
  where,
  auth
} from './firebase-config.js';
import { formatTimestamp } from './main-script.js';

// Define setupLogout to fix ReferenceError
function setupLogout() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      auth.signOut().then(() => {
        window.location.replace('index.html');
      }).catch((error) => {
        console.error("Logout failed:", error);
      });
    });
  }
}

// Load tutor-specific recent activities
async function loadTutorActivities(user) {
  try {
    if (!user) {
      console.log("No authenticated tutor - skipping activity load");
      return;
    }

    const tutorID = user.email.split('@')[0];

    const [messagesSnapshot, meetingsSnapshot, exercisesSnapshot] = await Promise.all([
      getDocs(query(messagesRef, where('tutorID', '==', tutorID))),
      getDocs(query(meetingsRef, where('tutorID', '==', tutorID))),
      getDocs(query(exercisesRef, where('tutorID', '==', tutorID)))
    ]);

    const activityContainer = document.getElementById('activity-list');
    if (!activityContainer) return;
    activityContainer.innerHTML = '';

    const notificationsArr = [];

    messagesSnapshot.forEach(doc => {
      const data = doc.data();
      notificationsArr.push({
        message: data.message,
        timestamp: data.timestamp?.seconds || data["upload-date"]?.seconds || 0,
        formattedTime: formatTimestamp(data.timestamp || data["upload-date"]),
        type: 'message'
      });
    });

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

    exercisesSnapshot.forEach(doc => {
      const data = doc.data();
      notificationsArr.push({
        message: `Exercise Created: ${data.name || data["exercise-name"]}<br>
        Due: ${formatTimestamp(data.dueDate || data["due-date"])}`,
        timestamp: data.timestamp?.seconds || data["upload-date"]?.seconds || 0,
        formattedTime: formatTimestamp(data.timestamp || data["upload-date"]),
        type: 'exercise'
      });
    });

    notificationsArr.sort((a, b) => b.timestamp - a.timestamp);

    notificationsArr.slice(0, 10).forEach(item => {
      const activityItem = document.createElement('div');
      let icon = '';

      if (item.type === 'message') {
        icon = `<i class="fa-solid fa-envelope"></i>`;
      } else if (item.type === 'meeting') {
        icon = `<i class="fa-solid fa-video"></i>`;
      } else if (item.type === 'exercise') {
        icon = `<i class="fa-solid fa-pen-to-square"></i>`;
      }

      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon">
          ${icon}
        </div>
        <div class="activity-details">
          <div class="activity-message">${item.message}</div>
          <small class="activity-time">${item.formattedTime}</small>
        </div>
      `;
      activityContainer.appendChild(activityItem);
    });

  } catch (error) {
    console.error("Error loading tutor activities:", error);
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

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadTutorActivities(user);
      setupLogout(); // Now defined
    } else {
      window.location.replace('index.html');
    }
  });

  // Handle back navigation after logout
  window.onpageshow = function (event) {
    if (event.persisted || (window.performance && performance.navigation.type === 2)) {
      auth.onAuthStateChanged((user) => {
        if (!user) {
          window.location.replace('index.html');
        }
      });
    }
  };
});
