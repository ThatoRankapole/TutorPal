import {
  db,
  moduleRef,
  meetingsRef,
  messagesRef,
  exercisesRef,
  tutorsRef,
  sessionsRef,
  eventsRef,
  studentRef,
  getDocs,
  query,
  where,
  auth
} from './firebase-config.js';

function getTimestampMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') {
    return ts.toMillis();
  }
  if (ts.seconds) {
    return ts.seconds * 1000;
  }
  if (typeof ts === 'number') {
    return ts < 1e12 ? ts * 1000 : ts;
  }
  const parsed = Date.parse(ts);
  if (!isNaN(parsed)) {
    return parsed;
  }
  return 0;
}

function formatTimestampDetailed(timestamp) {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
    timeZoneName: 'short'
  };
  return date.toLocaleString('en-US', options);
}


async function loadUserProfile(user) {
  if (!user) return;

  try {
    const q = query(studentRef, where('student-email', '==', user.email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn('No student data found for:', user.email);
      return;
    }

    const studentDoc = snapshot.docs[0];
    const studentData = studentDoc.data();

      document.getElementById('student-names').textContent = `${studentData.name} ${studentData.surname}`;

  } catch (error) {
    console.error('Failed to load student profile:', error);
  }
}


async function loadRecentActivities(user) {
  try {
    if (!user) return;

    const userEmail = user.email;

    const tutorSnapshot = await getDocs(tutorsRef);
    const [
      messagesSnapshot,
      meetingsSnapshot,
      exercisesSnapshot,
      sessionsSnapshot,
      eventsSnapshot
    ] = await Promise.all([
      getDocs(query(messagesRef, where('userid', '==', userEmail))),
      getDocs(query(meetingsRef, where('userid', '==', userEmail))),
      getDocs(query(exercisesRef, where('userid', '==', userEmail))),
      getDocs(query(sessionsRef, where('userid', '==', userEmail))),
      getDocs(query(eventsRef, where('userid', '==', userEmail)))
    ]);

    const activityContainer = document.getElementById('activity-list');
    if (!activityContainer) return;

    activityContainer.innerHTML = '<div class="loading">Loading activities...</div>';

    const notificationsArr = [];

    messagesSnapshot.forEach(doc => {
      const data = doc.data();
      let tutoName = "";
      tutorSnapshot.forEach(tutorDoc => {
        if (tutorDoc.id === data.tutorId) {
          const tutorData = tutorDoc.data();
          tutoName = `${tutorData.firstname} ${tutorData.lastname}`;
        }
      });
      notificationsArr.push({
        message: `From: ${tutoName}<br><br>${data.message}`,
        timestamp: getTimestampMillis(data["upload-date"]),
        rawTimestamp: data["upload-date"] || null,
        type: 'message'
      });
    });

    exercisesSnapshot.forEach(doc => {
      const data = doc.data();
      let tutoName = "";
      tutorSnapshot.forEach(tutorDoc => {
        if (tutorDoc.id === data.tutorId) {
          const tutorData = tutorDoc.data();
          tutoName = `${tutorData.firstname} ${tutorData.lastname}`;
        }
      });

      notificationsArr.push({
        message: `
        From: ${tutoName}<br>
        Exercise: ${data.name || data["exercise-name"] || ''}<br>
        Download: <a href="${data["exercise-download-link"]}">download exercise</a>`,
        timestamp: getTimestampMillis(data["upload-date"]),
        rawTimestamp: data["upload-date"] || null,
        type: 'exercise'
      });
    });

    sessionsSnapshot.forEach(doc => {
      const data = doc.data();
      let sessionLink = `<a href="${data["sessionLink"]}">JOIN</a>`;
      let tutoName = "";
      tutorSnapshot.forEach(tutorDoc => {
        if (tutorDoc.id === data.tutorId) {
          const tutorData = tutorDoc.data();
          tutoName = `${tutorData.firstname} ${tutorData.lastname}`;
        }
      });
      if (!data["sessionLink"] || data["sessionLink"].trim() === "") {
        sessionLink = `Contact Session`;
      }
      notificationsArr.push({
        message: `Session with: ${tutoName}<br>
        Session: ${data.title || data["session-title"] || ''}<br>
        Date: ${data.date || data["session-date"] || ''}<br>
        Time: ${data.time || data["session-time"]}<br>
        Location: ${data.location || data["session-location"] || 'online'}<br>
        Session Link: ${sessionLink}`,
        timestamp: getTimestampMillis(data.createdAt),
        rawTimestamp: data.createdAt || null,
        type: 'session'
      });
    });

    eventsSnapshot.forEach(doc => {
      const data = doc.data();
      notificationsArr.push({
        message: `Event: ${data.name || data["event-name"] || ''}<br>
        Date: ${data.date || data["event-date"] || ''}<br>
        Details: ${data.details || data["event-description"] || ''}`,
        timestamp: getTimestampMillis(data["created-at"]),
        rawTimestamp: data["created-at"] || null,
        type: 'event'
      });
    });

    notificationsArr.sort((a, b) => b.timestamp - a.timestamp);
    const recentActivities = notificationsArr.slice(0, 10);

    activityContainer.innerHTML = '';
    if (recentActivities.length === 0) {
      activityContainer.innerHTML = '<p class="text-gray-500">No recent activities.</p>';
      return;
    }

    recentActivities.forEach(item => {
      const activityItem = document.createElement('div');
      let notificationIcon = '';

      switch (item.type) {
        case 'message':
          notificationIcon = `<i class="fa-solid fa-envelope"></i>`;
          break;
        case 'meeting':
          notificationIcon = `<i class="fa-solid fa-video"></i>`;
          break;
        case 'exercise':
          notificationIcon = `<i class="fa-solid fa-pen-to-square"></i>`;
          break;
        case 'session':
          notificationIcon = `<i class="fa-solid fa-calendar-days"></i>`;
          break;
        case 'event':
          notificationIcon = `<i class="fa-solid fa-calendar"></i>`;
          break;
      }

      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon">
          ${notificationIcon}
        </div>
        <div class="activity-details">
          <div class="activity-message">${item.message}</div>
          <small class="activity-time">${item.rawTimestamp ? formatTimestampDetailed(item.rawTimestamp) : ''}</small>
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
        window.localStorage.clear();
        window.sessionStorage.clear();
        await auth.signOut();
        window.location.replace(`index.html?logout=${Date.now()}`);
      } catch (error) {
        console.error("Logout failed:", error);
        alert("Logout failed. Please try again.");
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (user) {
      loadUserProfile(user);
      loadRecentActivities(user);
      setupLogout();
    } else {
      window.location.replace('index.html');
    }
  });
});
