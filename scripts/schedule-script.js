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
  auth,
  where
} from './firebase-config.js';

const sessionsRef = collection(db, "sessions");

const eventNameInput = document.getElementById("event-name");
const eventDateInput = document.getElementById("event-date");
const eventDescriptionInput = document.getElementById("event-description");
const eventForm = document.getElementById("event-form");
const eventModal = document.getElementById("event-modal");
let saveEventBtn = document.getElementById("save-event-btn");
const eventHeading = document.getElementById("event-manipulation-heading");

let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
let eventData = [];

async function fetchEventsFromDatabase() {
  try {
    const user = auth.currentUser;
    const userEmail = user.email;
    const studentQuery = query(collection(db, "Student"), where("student-email", "==", userEmail));
    const studentSnapshot = await getDocs(studentQuery);
    const studentDoc = studentSnapshot.docs[0];
    const studentData = studentDoc.data();

    document.getElementById('student-names').textContent = `${studentData.name} ${studentData.surname}`;
    if (!user || !user.email) {
      console.error("User not logged in.");
      return;
    }

    eventData.length = 0;

    const qEvents = query(eventsRef);
    const eventsSnapshot = await getDocs(qEvents);
    eventsSnapshot.forEach((docSnap) => {
      const event = docSnap.data();
      if (event["event-date"] && event["userid"] === user.email) {
        eventData.push({
          id: docSnap.id,
          date: event["event-date"],
          name: event["event-name"] || "Event",
          description: event["event-description"] || "",
          type: "event"
        });
      }
    });

    const qSessions = query(sessionsRef);
    const sessionsSnapshot = await getDocs(qSessions);
    sessionsSnapshot.forEach((docSnap) => {
      const session = docSnap.data();
      if (session.date && (session.userid === user.email || session.userid === "everyone")) {
        eventData.push({
          id: docSnap.id,
          date: session.date,
          name: session.title || "Session",
          description: `
            <p><strong>Module:</strong> ${session.moduleName || ''}</p>
            <p><strong>Time:</strong> ${session.time || ''}</p>
            <p><strong>Duration:</strong> ${session.duration || ''} mins</p>
            <p><strong>Status:</strong> ${session.status || ''}</p>
          `,
          type: "session"
        });
      }
    });

  } catch (error) {
    console.error("Error fetching events and sessions:", error);
  }
}

function showEventsForDate(dateString) {
  document.querySelector('.event-popup')?.remove();

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
        ${e.description ? `<div>${e.description}</div>` : ''}
        ${extraButtons}
      </div>
    `;
  }).join('');

  const tooltip = document.createElement('div');
  tooltip.className = 'event-popup';
  tooltip.innerHTML = `
    <div class="event-popup-content">
      <span class="close-popup" style="cursor:pointer;">&times;</span>
      <h3>Events on ${new Date(dateString).toLocaleDateString()}</h3>
      ${eventDetails}
    </div>
  `;

  document.body.appendChild(tooltip);

  tooltip.querySelectorAll('.edit-event-btn').forEach(button => {
    button.addEventListener('click', () => {
      const eventId = button.getAttribute('data-id');
      const event = eventData.find(e => e.id === eventId);
      if (event) editEvent(event);
    });
  });

  tooltip.querySelectorAll('.delete-event-btn').forEach(button => {
    button.addEventListener('click', () => {
      const eventId = button.getAttribute('data-id');
      deleteEvent(eventId);
    });
  });

  tooltip.querySelector('.close-popup').onclick = () => tooltip.remove();
}

async function editEvent(event) {
  document.querySelector('.event-popup')?.remove();

  eventNameInput.value = event.name;
  eventDateInput.value = event.date;
  eventDescriptionInput.value = event.description || '';
  eventHeading.textContent = "Edit Event";

  const newSaveBtn = saveEventBtn.cloneNode(true);
  saveEventBtn.parentNode.replaceChild(newSaveBtn, saveEventBtn);
  saveEventBtn = newSaveBtn;
  saveEventBtn.textContent = "Update Event";

  saveEventBtn.addEventListener('click', async () => {
    const name = eventNameInput.value.trim();
    const date = eventDateInput.value;
    const description = eventDescriptionInput.value.trim();

    if (name && date) {
      try {
        await updateDoc(doc(db, "Events", event.id), {
          "event-name": name,
          "event-date": date,
          "event-description": description
        });

        eventModal.style.display = "none";
        await generateCalendar(currentMonth, currentYear);
      } catch (error) {
        console.error("Error updating event:", error);
        alert("Error updating event");
      }
    } else {
      alert("Please fill in the name and date.");
    }
  });

  eventModal.style.display = "block";
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
        const formatted = `${thisDate.getFullYear()}-${String(thisDate.getMonth() + 1).padStart(2, '0')}-${String(thisDate.getDate()).padStart(2, '0')}`;
        cell.textContent = date;

        if (eventData.find(e => e.date === formatted)) {
          cell.classList.add("event-day");
          cell.style.cursor = "pointer";
          cell.onclick = () => showEventsForDate(formatted);
        } else {
          cell.onclick = null;
          cell.style.cursor = "default";
        }

        if (date === today.getDate() && year === today.getFullYear() && month === today.getMonth()) {
          cell.classList.add("today");
        }

        date++;
      }

      row.appendChild(cell);
    }

    calendarBody.appendChild(row);
  }
}

async function saveNewEvent(e) {
  e.preventDefault();

  const name = eventNameInput.value.trim();
  const date = eventDateInput.value;
  const description = eventDescriptionInput.value.trim();
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

      eventModal.style.display = "none";
      await generateCalendar(currentMonth, currentYear);
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error saving event to database");
    }
  } else {
    alert("Please fill in all fields and make sure you're logged in.");
  }
}

async function initializeCalendar() {
  await generateCalendar(currentMonth, currentYear);

  const openBtn = document.getElementById("add-event-btn");
  const closeBtn = document.getElementById("close-modal");

  eventHeading.textContent = "Add New Event";

  if (openBtn) {
    openBtn.onclick = () => {
      eventNameInput.value = "";
      eventDateInput.value = "";
      eventDescriptionInput.value = "";
      eventHeading.textContent = "Add New Event";

      const newSaveBtn = saveEventBtn.cloneNode(true);
      saveEventBtn.parentNode.replaceChild(newSaveBtn, saveEventBtn);
      saveEventBtn = newSaveBtn;
      saveEventBtn.textContent = "Save Event";

      saveEventBtn.addEventListener("click", saveNewEvent);
      eventModal.style.display = "block";
    };
  }

  if (eventForm) {
    eventForm.removeEventListener("submit", saveNewEvent);
    eventForm.addEventListener("submit", saveNewEvent);
  }

  if (closeBtn) {
    closeBtn.onclick = () => eventModal.style.display = "none";
  }

  window.onclick = e => {
    if (e.target === eventModal) eventModal.style.display = "none";
  };
}

window.changeMonth = function (offset) {
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

export async function loadSessions() {
  const user = auth.currentUser;
  if (!user) return alert("User not logged in");

  const studentRef = collection(db, "Student");
  const q = query(studentRef, where('student-email', '==', user.email));
  const snapshot = await getDocs(q);

  let studentData = null;
  if (snapshot.empty) {
    console.warn('No student data found for:', user.email);
  } else {
    const studentDoc = snapshot.docs[0];
    studentData = studentDoc.data();
  }


  let table = document.getElementById('calendar')
  let rows = table.rows
  let qSessions = query(sessionsRef);
  const sessionsSnapshot = await getDocs(qSessions);
  sessionsSnapshot.forEach((doc) => {
    const session = doc.data();
    let date = new Date(session.date);
    let day = date.getDate();
    day = `${day}`
    for (let i = 1; i < rows.length; i++) {
      let cells = rows[i].cells;
      for (let j = 0; j < cells.length; j++) {
        let cell = cells[j];
        let dat = cell.innerText;
        if (day == dat) {
          if (studentData == null) {
            cell.classList.add("today");
            cell.addEventListener('click', (e) => {
              let msg = `
  Title : ${session.title}
  Module: ${session.moduleName}
  Date: ${session.date}
  Time: ${session.title}
 `;
              alert(msg)

            })


            let p = document.createElement("p")
            p.innerText = session.moduleName
            cell.appendChild(p);

          } else {
            let mods = Object.keys(studentData.modules);
            console.log(mods + " => " + session.moduleId)
            if (mods.includes(session.moduleId)) {
              cell.classList.add("today");
              let p = document.createElement("p")
              p.innerText = session.moduleName
              cell.appendChild(p);
            }
          }

          break;
        }
      }
    }

  });

}

// Wait for Firebase Auth to initialize and user to be logged in before starting calendar
document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (user) {
      initializeCalendar();
      loadSessions()
    } else {
      console.error("User not logged in.");
      // Optionally, show login prompt here
    }
  });
});
