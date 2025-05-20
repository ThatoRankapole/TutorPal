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
        message: `Exercise: ${data.name || data["exercise-name"]}<br>
        Due: ${formatTimestamp(data.dueDate || data["due-date"])}`,
        timestamp: data.timestamp?.seconds || data["upload-date"]?.seconds || 0,
        formattedTime: formatTimestamp(data.timestamp || data["upload-date"]),
        type: 'exercise'
      });
    });

    notificationsArr.sort((a, b) => b.timestamp - a.timestamp);

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

function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace(`index.html?logout=${Date.now()}`);
      } catch (error) {
        console.error("Logout failed:", error);
        alert("Logout failed. Please try again.");
      }
    });
  }
}

// Main init block
document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadRecentActivities(user);
      setupLogout();
    } else {
      window.location.replace('index.html');
    }
  });

  // Prevent browser from restoring cached page after logout
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
