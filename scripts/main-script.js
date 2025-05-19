// scripts/main-script.js
import { 
  db,
  moduleRef,
  meetingsRef,
  messagesRef,
  getCountFromServer,
  query,
  where
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
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Deactivate all sidebar items
  document.querySelectorAll('.sidebar li').forEach(item => {
    item.classList.remove('active');
  });

  // Show the selected tab content
  document.getElementById(`${tabId}-tab`).classList.add('active');

  // Activate the selected sidebar item
  document.querySelector(`.sidebar li[data-tab="${tabId}"]`).classList.add('active');
};

export function handleSearch() {
  const keyword = document.getElementById('keyword').value.trim().toLowerCase();
  if (!keyword) return;

  // Search logic would go here
  alert(`Searching for: ${keyword}`);
}

// Initialize dashboard counters
async function initializeCounters() {
  try {
    const [coursesCount, meetingsCount] = await Promise.all([
      getCountFromServer(moduleRef),
      getCountFromServer(meetingsRef)
    ]);
    
    document.getElementById('number-of-courses').textContent = coursesCount.data().count;
    document.getElementById('number-of-meetings').textContent = meetingsCount.data().count;

    const unreadMessagesRef = query(messagesRef, where("read", "==", false));
    const unreadCount = await getCountFromServer(unreadMessagesRef);
    document.getElementById('unread-messages').textContent = unreadCount.data().count;
  } catch (error) {
    console.error("Error initializing counters:", error);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeCounters();
});