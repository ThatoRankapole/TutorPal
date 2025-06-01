// admin-main.js
import {
  app,
  db,
  studentRef,
  tutorsRef,
  moduleRef,
  eventsRef,
  getDocs,
  query,
  orderBy,
  limit
} from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  updateCount(studentRef, 'total-students');
  updateCount(tutorsRef, 'total-tutors');
  updateCount(moduleRef, 'total-modules');
  loadRecentActivities(eventsRef);
});

async function updateCount(ref, elementId) {
  try {
    const snap = await getDocs(ref);
    document.getElementById(elementId).textContent = snap.size;
  } catch (err) {
    console.error(`Error fetching ${elementId}:`, err);
    document.getElementById(elementId).textContent = '0';
  }
}

async function loadRecentActivities(eventsRef) {
  try {
    const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = '';

    if (snapshot.empty) {
      activityList.innerHTML = '<div class="activity-item">No recent activities</div>';
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const item = document.createElement('div');
      item.className = 'activity-item';

      const timestamp = data.timestamp?.toDate();
      const timeAgo = timestamp ? formatTimeAgo(timestamp) : 'Just now';

      item.innerHTML = `
        <div class="activity-icon"><i class="fas ${getActivityIcon(data.type)}"></i></div>
        <div class="activity-details">
          <p>${data.message}</p>
          <small>${timeAgo}</small>
        </div>
      `;
      activityList.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading recent activities:", err);
    document.getElementById('activity-list').innerHTML =
      '<div class="activity-item">Error loading activities</div>';
  }
}

function getActivityIcon(type) {
  const map = {
    student: 'fa-user-graduate',
    tutor: 'fa-chalkboard-teacher',
    module: 'fa-book',
  };
  return map[type] || 'fa-history';
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const units = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, value] of Object.entries(units)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
}
