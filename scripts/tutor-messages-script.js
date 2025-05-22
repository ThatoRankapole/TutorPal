import { getFirestore, collection, query, where, getDocs, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { app } from './firebase-config.js';

const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // Load conversations when messages tab is shown
    document.querySelector('[data-tab="messages"]').addEventListener('click', loadConversations);
});

async function loadConversations() {
    try {
        const tutorId = "tutor123"; // Replace with actual tutor ID from auth
        
        const conversationsRef = collection(db, "conversations");
        const q = query(
            conversationsRef, 
            where("participants", "array-contains", tutorId)
        );
        
        const querySnapshot = await getDocs(q);
        const conversationList = document.querySelector('.conversation-list');
        conversationList.innerHTML = ''; // Clear existing conversations
        
        if (querySnapshot.empty) {
            conversationList.innerHTML = '<div class="no-conversations">No conversations yet.</div>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const conversationData = doc.data();
            
            // Find the other participant (not the tutor)
            const otherParticipantId = conversationData.participants.find(id => id !== tutorId);
            const otherParticipantName = conversationData.participantNames?.[otherParticipantId] || 'Unknown';
            
            const lastMessage = conversationData.lastMessage || "No messages yet";
            const lastMessageTime = conversationData.lastMessageTime ? 
                new Date(conversationData.lastMessageTime).toLocaleString() : '';
            
            const conversationElement = document.createElement('div');
            conversationElement.className = 'conversation';
            conversationElement.setAttribute('data-id', doc.id);
            conversationElement.setAttribute('data-other', otherParticipantId);
            
            conversationElement.innerHTML = `
                <div class="conversation-header">
                    <h4>${otherParticipantName}</h4>
                    <span class="time">${lastMessageTime}</span>
                </div>
                <p class="preview">${lastMessage}</p>
            `;
            
            conversationElement.addEventListener('click', () => {
                loadMessages(doc.id, otherParticipantId, otherParticipantName);
            });
            
            conversationList.appendChild(conversationElement);
        });
        
        // Load the first conversation by default
        if (querySnapshot.docs.length > 0) {
            const firstDoc = querySnapshot.docs[0];
            const firstData = firstDoc.data();
            const otherParticipantId = firstData.participants.find(id => id !== tutorId);
            const otherParticipantName = firstData.participantNames?.[otherParticipantId] || 'Unknown';
            
            loadMessages(firstDoc.id, otherParticipantId, otherParticipantName);
        }
        
    } catch (error) {
        console.error("Error loading conversations: ", error);
        alert("Failed to load conversations. Please try again.");
    }
}

async function loadMessages(conversationId, otherParticipantId, otherParticipantName) {
    try {
        const messageView = document.querySelector('.message-view');
        messageView.innerHTML = `
            <div class="message-header">
                <h3>Conversation with ${otherParticipantName}</h3>
            </div>
            <div class="messages" id="messages-container"></div>
            <div class="message-input">
                <input type="text" id="new-message" placeholder="Type your message...">
                <button id="send-message"><i class="fas fa-paper-plane"></i></button>
            </div>
        `;
        
        // Highlight the selected conversation
        document.querySelectorAll('.conversation').forEach(conv => {
            conv.classList.remove('active');
            if (conv.getAttribute('data-id') === conversationId) {
                conv.classList.add('active');
            }
        });
        
        // Load existing messages
        const messagesRef = collection(db, "conversations", conversationId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));
        
        const messagesContainer = document.getElementById('messages-container');
        
        // Real-time listener for messages
        onSnapshot(q, (snapshot) => {
            messagesContainer.innerHTML = ''; // Clear existing messages
            
            snapshot.forEach((doc) => {
                const messageData = doc.data();
                const messageElement = document.createElement('div');
                messageElement.className = `message ${messageData.senderId === tutorId ? 'sent' : 'received'}`;
                
                messageElement.innerHTML = `
                    <div class="message-content">${messageData.content}</div>
                    <div class="message-time">${new Date(messageData.timestamp?.toDate()).toLocaleTimeString()}</div>
                `;
                
                messagesContainer.appendChild(messageElement);
            });
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
        
        // Set up send message functionality
        document.getElementById('send-message').addEventListener('click', async () => {
            await sendMessage(conversationId, otherParticipantId);
        });
        
        document.getElementById('new-message').addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await sendMessage(conversationId, otherParticipantId);
            }
        });
        
    } catch (error) {
        console.error("Error loading messages: ", error);
    }
}

async function sendMessage(conversationId, otherParticipantId) {
    try {
        const tutorId = "tutor123"; // Replace with actual tutor ID from auth
        const messageInput = document.getElementById('new-message');
        const messageContent = messageInput.value.trim();
        
        if (!messageContent) return;
        
        // Add message to subcollection
        const messagesRef = collection(db, "conversations", conversationId, "messages");
        await addDoc(messagesRef, {
            content: messageContent,
            senderId: tutorId,
            timestamp: new Date()
        });
        
        // Update conversation last message
        const conversationRef = doc(db, "conversations", conversationId);
        await updateDoc(conversationRef, {
            lastMessage: messageContent,
            lastMessageTime: new Date()
        });
        
        // Clear input
        messageInput.value = '';
        
    } catch (error) {
        console.error("Error sending message: ", error);
        alert("Failed to send message. Please try again.");
    }
}