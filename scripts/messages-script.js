import {
  auth,
  messagesRef,
  tutorsRef,
  getDocs,
  query,
  where,
  doc,
  updateDoc
} from './firebase-config.js';

function getTimestampMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  if (typeof ts === 'number') return ts < 1e12 ? ts * 1000 : ts;
  const parsed = Date.parse(ts);
  return isNaN(parsed) ? 0 : parsed;
}

function formatDateTime(timestamp) {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  // Format as YYYY-MM-DD HH:mm
  return date.toISOString().slice(0, 10) + ' ' + date.toTimeString().slice(0, 5);
}

let messagesList = [];  // Will store all individual messages with tutorName

async function loadStudentMessages(user) {
  try {
    if (!user) {
      console.log("No user authenticated");
      return;
    }

    const userEmail = user.email;

    // Fetch all tutors once
    const tutorSnapshot = await getDocs(tutorsRef);

    // Fetch user messages
    const messagesSnapshot = await getDocs(query(messagesRef, where('userid', '==', userEmail)));

    messagesList = [];

    messagesSnapshot.forEach(doc => {
      const data = doc.data();

      let tutoName = "Unknown Tutor";
      // Search tutor explicitly in tutorSnapshot
      tutorSnapshot.forEach(tutorDoc => {
        if (tutorDoc.id === data["tutor-id"]) {
          const tutorData = tutorDoc.data();
          tutoName = `${tutorData.firstname} ${tutorData.lastname}`;
        }
      });

      messagesList.push({
        id: doc.id,
        content: data.message || data.content || '',
        timestamp: getTimestampMillis(data["upload-date"]),
        rawTimestamp: data["upload-date"] || null,
        module: data.module || "General",
        tutorName: tutoName,
        tutorId: data.tutorId || "unknown",
        isRead: data.read ?? false
      });
    });

    // Sort all messages newest first
    messagesList.sort((a, b) => b.timestamp - a.timestamp);

    renderConversationList();
  } catch (error) {
    console.error("Error loading messages:", error);
    showErrorMessage(error);
  }
}

function renderConversationList() {
  const container = document.querySelector('.conversation-list');
  container.innerHTML = '';

  if (messagesList.length === 0) {
    container.innerHTML = '<p>No messages found.</p>';
    return;
  }

  messagesList.forEach((msg, index) => {
    const item = document.createElement('div');
    item.className = 'conversation';
    item.dataset.messageId = msg.id;
    if (!msg.isRead) {
      item.classList.add('unread');  // highlight unread messages
    }
    item.innerHTML = `
      <div class="conversation-header">
        <h4>${msg.tutorName}</h4>
      </div>
      <p class="preview">${msg.content.length > 40 ? msg.content.slice(0, 40) + '...' : msg.content}</p>
      <small class="datetime">${formatDateTime(msg.rawTimestamp)}</small>
    `;

    item.addEventListener('click', async () => {
      document.querySelectorAll('.conversation').forEach(c => c.classList.remove('active'));
      item.classList.add('active');
      renderMessageView(msg);

      // If unread, update to read:true in Firestore & remove highlight
      if (!msg.isRead) {
        try {
          await updateDoc(doc(messagesRef, msg.id), { read: true });
          msg.isRead = true;
          item.classList.remove('unread');
        } catch (err) {
          console.error('Failed to mark message as read:', err);
        }
      }
    });

    container.appendChild(item);

    // Activate first message by default
    if (index === 0) {
      item.classList.add('active');
      renderMessageView(msg);
    }
  });
}

function renderMessageView(msg) {
  const container = document.querySelector('.message-view');
  container.innerHTML = '';

  const messageEl = document.createElement('div');
  messageEl.className = `message`;
  // Show only the message content, no time or other metadata
  messageEl.innerHTML = `
    <div class="message-content">${msg.content}</div>
  `;

  container.appendChild(messageEl);
}

function showErrorMessage(error) {
  const messageView = document.querySelector(".message-view");
  if (messageView) {
    messageView.innerHTML = `
      <div class="error-message">
        <h3>Failed to load messages</h3>
        <p>${error.message}</p>
        <button onclick="window.loadStudentMessages()">Retry</button>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (user) {
      loadStudentMessages(user);
    } else {
      console.log("User not logged in");
      window.location.replace("index.html");
    }
  });
});

window.loadStudentMessages = loadStudentMessages;
