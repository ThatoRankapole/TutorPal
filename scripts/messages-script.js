// scripts/messages-script.js
import {
  db,
  messagesRef,
  tutorsRef,
  getDocs,
  doc,
  getDoc,
  collection,
  query
} from './firebase-config.js';

// Load messages from database
async function loadMessages() {
  try {
    const messages = [];
    const messagesSnapshot = await getDocs(collection(db, "Messages"));

    for (const messageDoc of messagesSnapshot.docs) {
      const data = messageDoc.data();
      const tutorId = data["tutor-id"];
      if (!tutorId) continue;

      const tutorDocRef = doc(db, "Tutors", tutorId);
      const tutorDocSnap = await getDoc(tutorDocRef);

      if (tutorDocSnap.exists()) {
        const tutorData = tutorDocSnap.data();

        const fullName = `${tutorData.name} ${tutorData.surname}`;
        const module = tutorData["module-code"];

        const timestamp = data["upload-date"]?.seconds || 0;
        const date = new Date(timestamp * 1000);

        // Format date as dd-MM-yyyy   hh:mm AM/PM
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const strHours = String(hours).padStart(2, "0");

        const formattedDate = `${day}-${month}-${year}   ${strHours}:${minutes} ${ampm}`;

        messages.push({
          id: messageDoc.id,
          name: fullName,
          module: module,
          message: data.message,
          time: formattedDate,
        });
      }
    }

    renderMessages(messages);
  } catch (error) {
    console.error("Error loading messages:", error);
  }
}

// Render messages to the UI
function renderMessages(messages) {
  const conversationList = document.querySelector(".conversation-list");
  const messageView = document.querySelector(".message-view");

  if (!conversationList || !messageView) return;

  conversationList.innerHTML = "";
  messageView.innerHTML = "";

  messages.forEach((msg, index) => {
    const convo = document.createElement("div");
    convo.className = `conversation ${index === 0 ? "active" : ""}`;
    convo.innerHTML = `
      <div class="conversation-avatar">
        <i class="fa-solid fa-envelope"></i>
      </div>
      <div class="conversation-details">
        <h4 id="tutor-message-name">${msg.name} (${msg.module})</h4>
        <p id="tutor-message-preview">${msg.message.length > 30 ? msg.message.substring(0, 30) + "..." : msg.message}</p>
        <small id="tutor-message-time">${msg.time}</small>
      </div>
    `;

    convo.addEventListener("click", () => {
      document.querySelectorAll(".conversation").forEach(c => c.classList.remove("active"));
      convo.classList.add("active");

      messageView.innerHTML = `
        <div class="message-header">
          <h3>${msg.name}</h3>
          <p>${msg.module} Tutor</p>
        </div>
        <div class="message-thread">
          <p id="tutor-message-text">${msg.message}</p>
        </div>
      `;
    });

    conversationList.appendChild(convo);

    if (index === 0) {
      // Load first message by default
      messageView.innerHTML = `
        <div class="message-header">
          <h3>${msg.name}</h3>
          <p>${msg.module} Tutor</p>
        </div>
        <div class="message-thread">
          <p id="tutor-message-text">${msg.message}</p>
        </div>
      `;
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadMessages();
});