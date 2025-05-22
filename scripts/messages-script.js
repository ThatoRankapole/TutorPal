import {
  db,
  getDocs,
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  updateDoc
} from './firebase-config.js';

const getCurrentUserId = () => {
  // Implement your actual user ID retrieval
  return "student123"; // Temporary placeholder
};

async function loadStudentCommunications() {
  try {
    const studentId = getCurrentUserId();
    
    // Query that handles potential field name variations
    const messagesQuery = query(
      collection(db, "Messages"),
      where("recipientId", "==", studentId),
      orderBy("timestamp", "desc")
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    const messages = [];
    
    for (const doc of messagesSnapshot.docs) {
      const data = doc.data();
      
      // Handle field name variations
      const tutorId = data.senderId || data['tutor-id'];
      const content = data.content || data.message;
      const timestamp = data.timestamp || data['upload-date'];
      const isRead = data.isRead || data.read || false;
      const module = data.module || "General";
      
      if (tutorId) {
        const tutorDoc = await getDoc(doc(db, "Users", tutorId));
        if (tutorDoc.exists()) {
          messages.push({
            id: doc.id,
            from: `${tutorDoc.data().firstName} ${tutorDoc.data().lastName}`,
            content: content,
            timestamp: timestamp,
            isRead: isRead,
            module: module
          });
        }
      }
    }
    
    renderCommunications(messages);
  } catch (error) {
    console.error("Error loading communications:", error);
    showErrorMessage(error);
  }
}

function showErrorMessage(error) {
  const messageView = document.querySelector(".message-view");
  if (messageView) {
    messageView.innerHTML = `
      <div class="error-message">
        <h3>Failed to load messages</h3>
        <p>${error.message}</p>
        ${error.message.includes('index') ? 
          '<p class="error-note">Note: This query requires a Firestore composite index.</p>' : ''}
        <button onclick="loadStudentCommunications()">Retry</button>
      </div>
    `;
  }
}

// Render function (example)
function renderCommunications(messages) {
  const container = document.querySelector('.message-view');
  container.innerHTML = '';
  
  if (messages.length === 0) {
    container.innerHTML = '<p>No messages found.</p>';
    return;
  }
  
  messages.forEach(msg => {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${msg.isRead ? 'read' : 'unread'}`;
    messageEl.innerHTML = `
      <div class="message-header">
        <span class="sender">${msg.from}</span>
        <span class="timestamp">${formatDate(msg.timestamp)}</span>
        <span class="module-tag">${msg.module}</span>
      </div>
      <div class="message-content">${msg.content}</div>
    `;
    container.appendChild(messageEl);
  });
}

// Helper function to format dates
function formatDate(timestamp) {
  if (!timestamp) return '';
  
  // Handle Firestore Timestamp objects
  if (timestamp.toDate) {
    return timestamp.toDate().toLocaleString();
  }
  
  // Handle string timestamps
  return new Date(timestamp).toLocaleString();
}