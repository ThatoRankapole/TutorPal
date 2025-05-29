import {
  db,
  eventsRef,
  getDocs,
  query,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  auth
} from './firebase-config.js';

// References for sessions collection
const sessionsRef = collection(db, "sessions");

// Calendar variables
let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
const monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];
let eventData = []; // will hold both events and sessions

// Fetch events AND sessions from the database for the logged-in user
async function fetchEventsFromDatabase() {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      console.error("User not logged in.");
      return;
    }

    eventData.length = 0; // Clear existing events

    // Fetch Events
    let qEvents = query(eventsRef);
    const eventsSnapshot = await getDocs(qEvents);
    eventsSnapshot.forEach((doc) => {
      const event = doc.data();
      if (event["event-date"] && event["userid"] === user.email) {
        eventData.push({
          id: doc.id,
          date: event["event-date"],
          name: event["event-name"] || "Event",
          description: event["event-description"] || "",
          type: "event"
        });
      }
    });

    // Fetch Sessions (userid === user.email OR userid === "everyone")
    let qSessions = query(sessionsRef);
    const sessionsSnapshot = await getDocs(qSessions);
    sessionsSnapshot.forEach((doc) => {
      const session = doc.data();
      if (session.date && (session.userid === user.email || session.userid === "everyone")) {
        eventData.push({
          id: doc.id,
          date: session.date,
          name: session.title || "Session",
          description: `Module: ${session.moduleName || ''}<br>Time: ${session.time || ''}<br>Duration: ${session.duration || ''} mins<br>Status: ${session.status || ''}`,
          type: "session"
        });
      }
    });

  } catch (error) {
    console.error("Error fetching events and sessions:", error);
  }
}

function showEventsForDate(dateString) {
  const existingPopup = document.querySelector('.event-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const events = eventData.filter(e => e.date === dateString);
  if (events.length === 0) return;

  const eventDetails = events.map(e => {
    let extraButtons = '';
    if (e.type === "event") {
      extraButtons = `
        <button class="edit-event-btn" data-id="${e.id}">Edit</button>
        <button class="delete-event-btn" data-id="${e.id}">Delete</button>
      `;
    }
    return `
      <div class="event-tooltip">
        <strong>${e.name}</strong>
        ${e.description ? `<p>${e.description}</p>` : ''}
        ${extraButtons}
      </div>
    `;
  }).join('');

  const tooltip = document.createElement('div');
  tooltip.className = 'event-popup';
  tooltip.innerHTML = `
    <div class="event-popup-content">
      <span class="close-popup">&times;</span>
      <h3>Events on ${new Date(dateString).toLocaleDateString()}</h3>
      ${eventDetails}
    </div>
  `;

  document.body.appendChild(tooltip);

  // Only add edit/delete handlers to events (not sessions)
  tooltip.querySelectorAll('.edit-event-btn').forEach(button => {
    button.addEventListener('click', function() {
      const eventId = this.getAttribute('data-id');
      const event = eventData.find(e => e.id === eventId);
      if (event) editEvent(event);
    });
  });

  tooltip.querySelectorAll('.delete-event-btn').forEach(button => {
    button.addEventListener('click', function() {
      const eventId = this.getAttribute('data-id');
      deleteEvent(eventId);
    });
  });

  tooltip.querySelector('.close-popup').onclick = function() {
    document.body.removeChild(tooltip);
  };
}

async function editEvent(event) {
  // Close any open popup before opening modal
  document.querySelector('.event-popup')?.remove();

  const modal = document.getElementById("event-modal");
  document.getElementById("event-name").value = event.name;
  document.getElementById("event-date").value = event.date;
  document.getElementById("event-description").value = event.description || '';
  document.getElementById("event-manipulation-heading").textContent = "Edit Event";

  const saveBtn = document.getElementById("save-event-btn");
  saveBtn.textContent = "Update Event";
  saveBtn.onclick = async function() {
    const name = document.getElementById("event-name").value.trim();
    const date = document.getElementById("event-date").value;
    const description = document.getElementById("event-description").value.trim();

    if (name && date) {
      try {
        await updateDoc(doc(db, "Events", event.id), {
          "event-name": name,
          "event-date": date,
          "event-description": description
        });

        modal.style.display = "none";
        await generateCalendar(currentMonth, currentYear);
      } catch (error) {
        console.error("Error updating event:", error);
        alert("Error updating event");
      }
    } else {
      alert("Please fill in the name and date.");
    }
  };

  modal.style.display = "block";
}

async function deleteEvent(eventId) {
  if (confirm("Are you sure you want to delete this event?")) {
    try {
      await deleteDoc(doc(db, "Events", eventId));
      document.querySelector('.event-popup')?.remove();
      await generateCalendar(currentMonth, currentYear);
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Error deleting event");
    }
  }
}

async function generateCalendar(month, year) {
  const firstDay = new Date(year, month).getDay();
  const daysInMonth = 32 - new Date(year, month, 32).getDate();
  const calendarBody = document.getElementById("calendar-body");
  calendarBody.innerHTML = "";
  document.getElementById("month-year").textContent = `${monthNames[month]} ${year}`;

  await fetchEventsFromDatabase();

  let date = 1;
  for (let i = 0; i < 6; i++) {
    const row = document.createElement("tr");

    for (let j = 0; j < 7; j++) {
      const cell = document.createElement("td");

      if (i === 0 && j < firstDay) {
        cell.textContent = "";
      } else if (date > daysInMonth) {
        break;
      } else {
        const thisDate = new Date(year, month, date);
        const formatted = thisDate.getFullYear() + "-" +
                          String(thisDate.getMonth() + 1).padStart(2, '0') + "-" +
                          String(thisDate.getDate()).padStart(2, '0');
        cell.textContent = date;

        if (eventData.find(e => e.date === formatted)) {
          cell.classList.add("event-day");
          cell.onclick = function() {
            showEventsForDate(formatted);
          };
        }

        if (date === today.getDate() &&
            year === today.getFullYear() &&
            month === today.getMonth()) {
          cell.classList.add("today");
        }
        date++;
      }
      row.appendChild(cell);
    }
    calendarBody.appendChild(row);
  }
}

async function saveNewEvent() {
  const name = document.getElementById("event-name").value.trim();
  const date = document.getElementById("event-date").value;
  const description = document.getElementById("event-description").value.trim();

  const user = auth.currentUser;

  if (name && date && user?.email) {
    try {
      await addDoc(collection(db, "Events"), {
        "event-name": name,
        "event-date": date,
        "event-description": description,
        "userid": user.email,
        "created-at": serverTimestamp()
      });

      document.getElementById("event-modal").style.display = "none";
      await generateCalendar(currentMonth, currentYear);
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error saving event to database");
    }
  } else {
    alert("Please fill in the name, date, and make sure you're logged in.");
  }
}

async function initializeCalendar() {
  await generateCalendar(currentMonth, currentYear);

  const modal = document.getElementById("event-modal");
  const openBtn = document.getElementById("add-event-btn");
  const closeBtn = document.getElementById("close-modal");
  const saveBtn = document.getElementById("save-event-btn");
  document.getElementById("event-manipulation-heading").textContent = "Add New Event";

  openBtn.onclick = () => {
    document.getElementById("event-name").value = "";
    document.getElementById("event-date").value = "";
    document.getElementById("event-description").value = "";
    saveBtn.textContent = "Save Event";
    saveBtn.onclick = saveNewEvent;
    modal.style.display = "block";
  };

  closeBtn.onclick = () => modal.style.display = "none";
  window.onclick = e => { if (e.target === modal) modal.style.display = "none"; }
}

// Change month navigation
window.changeMonth = function(offset) {
  currentMonth += offset;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  generateCalendar(currentMonth, currentYear);
};

// Wait for Firebase Auth to initialize and user to be logged in before starting calendar
document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (user) {
      initializeCalendar();
    } else {
      console.error("User not logged in.");
      // Optionally, show login prompt here
    }
  });
});
