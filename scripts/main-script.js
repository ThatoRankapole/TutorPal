import { 
  db,
  moduleRef,
  meetingsRef,
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

// Make showTab available globally by attaching to window
window.showTab = function(tabId) {
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

// New function: Get the active courses count for the logged-in student
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
    const modulesString = studentData.modules || "";
    if (!modulesString.trim()) return 0;

    return modulesString.includes(":")
      ? modulesString.split(":").filter(code => code.trim() !== "").length
      : 1;

  } catch (error) {
    console.error("Error getting student active courses count:", error);
    return 0;
  }
}

// Initialize dashboard counters with user context
async function initializeCounters() {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("No user logged in");
      return;
    }

    // Get student-specific active courses count
    const coursesCount = await getStudentActiveCoursesCount(user);

    // Get meetings and unread messages count as before
    const [meetingsCount, unreadCount] = await Promise.all([
      getCountFromServer(meetingsRef),
      getCountFromServer(query(messagesRef, where("read", "==", false)))
    ]);

    // Update the UI
    document.getElementById('number-of-courses').textContent = `${coursesCount}`;
    document.getElementById('number-of-meetings').textContent = meetingsCount.data().count;
    document.getElementById('unread-messages').textContent = unreadCount.data().count;

  } catch (error) {
    console.error("Error initializing counters:", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Wait for Firebase auth state to initialize
  auth.onAuthStateChanged(user => {
    if (user) {
      initializeCounters();
    } else {
      // Optionally redirect or show login
      console.warn("User not logged in");
    }
  });
});
