import {
  db,
  moduleRef,
  sessionsRef,
  messagesRef,
  getCountFromServer,
  query,
  where,
  auth,
  collection,
  getDocs
} from './firebase-config.js';

// Global functions
export function formatTimestamp(timestamp) {
  return timestamp.toDate().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Make showTab available globally
window.showTab = function (tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.sidebar li').forEach(item => {
    item.classList.remove('active');
  });
  document.getElementById(`${tabId}-tab`).classList.add('active');
  document.querySelector(`.sidebar li[data-tab="${tabId}"]`).classList.add('active');
};

export function handleSearch() {
  const keyword = document.getElementById('keyword').value.trim().toLowerCase();
  if (!keyword) return;
  alert(`Searching for: ${keyword}`);
}

// ✅ Fixed: Get the active courses count for the logged-in student
async function getStudentActiveCoursesCount(user) {
  if (!user) return 0;
  const studentEmail = user.email;
  try {
    const studentQuery = query(collection(db, "Student"), where("student-email", "==", studentEmail));
    const studentSnapshot = await getDocs(studentQuery);

    if (studentSnapshot.empty) {
      console.warn("No student found for email:", studentEmail);
      return 0;
    }

    const studentData = studentSnapshot.docs[0].data();
    const modules = studentData.modules;

    if (modules && typeof modules === "object") {
      return Object.keys(modules).length;
    }

    // Optional: fallback for legacy string format
    if (typeof modules === "string" && modules.trim()) {
      return modules.includes(":")
        ? modules.split(":").filter(code => code.trim() !== "").length
        : 1;
    }

    return 0;

  } catch (error) {
    console.error("Error getting student active courses count:", error);
    return 0;
  }
}

// ✅ Fixed: Safely initialize dashboard counters
async function initializeCounters() {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("No user logged in");
      return;
    }

    const coursesCount = await getStudentActiveCoursesCount(user);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const unreadCountPromise = getCountFromServer(query(messagesRef, where("read", "==", false)));
    const sessionsSnapshot = await getDocs(sessionsRef);

    let upcomingSessionsCount = 0;
    sessionsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.date && data.date >= todayStr) {
        upcomingSessionsCount++;
      }
    });

    const unreadCount = await unreadCountPromise;

    // ✅ Check if elements exist before updating
    const coursesElem = document.getElementById('number-of-courses');
    const meetingsElem = document.getElementById('number-of-meetings');
    const messagesElem = document.getElementById('unread-messages');

    if (coursesElem) coursesElem.textContent = `${coursesCount}`;
    if (meetingsElem) meetingsElem.textContent = upcomingSessionsCount;
    if (messagesElem) messagesElem.textContent = unreadCount.data().count;

  } catch (error) {
    console.error("Error initializing counters:", error);
  }
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (user) {
      initializeCounters();
    } else {
      console.warn("User not logged in");
    }
  });
});
