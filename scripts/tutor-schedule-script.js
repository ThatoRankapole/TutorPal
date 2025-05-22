import {
  db,
  auth,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc
} from "./firebase-config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

let currentTutorName = "";

// 🔧 Get full tutor name using email (EXACTLY like your working modules code)
async function getTutorFullNameByEmail(email) {
  const tutorsRef = collection(db, "Tutor");
  const q = query(tutorsRef, where("email", "==", email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;

  const tutorDoc = querySnapshot.docs[0];
  const tutorData = tutorDoc.data();
  return `${tutorData.firstname} ${tutorData.lastname}`;
}

// 🔄 Load modules for dropdown
async function loadTutorModulesForDropdown(tutorFullName) {
  try {
    const moduleSelect = document.getElementById('session-module');
    moduleSelect.innerHTML = '<option value="">Select Module</option>';

    const modulesRef = collection(db, "Modules");
    const q = query(modulesRef, where("module-tutor", "==", tutorFullName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      const option = document.createElement('option');
      option.value = "";
      option.textContent = "No modules assigned";
      moduleSelect.appendChild(option);
      return;
    }

    querySnapshot.forEach((doc) => {
      const moduleData = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = `${moduleData['module-code'] || 'N/A'} - ${moduleData['module-name'] || 'N/A'}`;
      moduleSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading modules for dropdown:", error);
  }
}

// 💾 Save session
async function saveSession() {
  try {
    const user = auth.currentUser;
    if (!user) return alert("User not logged in");

    const tutorId = user.uid;
    const sender = currentTutorName;

    const title = document.getElementById('session-title').value;
    const moduleId = document.getElementById('session-module').value;
    const date = document.getElementById('session-date').value;
    const time = document.getElementById('session-time').value;
    const duration = document.getElementById('session-duration').value;

    const moduleDocRef = doc(db, "Modules", moduleId);
    const moduleDoc = await getDoc(moduleDocRef);
    if (!moduleDoc.exists()) {
      alert("Selected module does not exist.");
      return;
    }

    const moduleData = moduleDoc.data();

    const sessionData = {
      tutorId,
      sender,
      title,
      moduleId,
      moduleCode: moduleData['module-code'],
      moduleName: moduleData['module-name'],
      date,
      time,
      duration: parseInt(duration),
      studentsEnrolled: [],
      status: "scheduled",
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, "sessions"), sessionData);

    alert("Session created successfully!");
    document.getElementById('session-modal').style.display = 'none';
    await loadTutorMeetings(currentTutorName);
  } catch (error) {
    console.error("Error saving session: ", error);
    alert("Failed to create session. Please try again.");
  }
}

// 📅 Load meetings
async function loadTutorMeetings(fullName) {
  try {
    const meetingsRef = collection(db, "meetings");
    const q = query(meetingsRef, where("sender", "==", fullName));
    const snapshot = await getDocs(q);
    const meetings = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      meetings.push({ id: doc.id, ...data });

      const meetingDate = data["meeting-date"]?.toDate?.();
      if (meetingDate) {
        const formattedDate = meetingDate.toISOString().split('T')[0];
        highlightDateOnCalendar(formattedDate, data["meeting-name"]);
      }
    });

    document.getElementById('number-of-sessions').textContent = `${meetings.length} meetings found`;

    console.log("Tutor-specific meetings:", meetings);
  } catch (error) {
    console.error("Error loading tutor meetings:", error);
  }
}

// 🗓️ Highlight calendar
function highlightDateOnCalendar(date, title) {
  console.log(`Highlighting on calendar: ${date} - ${title}`);
}

// ✅ INIT
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const email = user.email;
      currentTutorName = await getTutorFullNameByEmail(email);
      await loadTutorModulesForDropdown(currentTutorName);
      await loadTutorMeetings(currentTutorName);
    }
  });

  // Modal event listeners
  const sessionModal = document.getElementById('session-modal');
  const closeModal = document.querySelector('.close-modal');
  const addSessionBtn = document.getElementById('add-session-btn');
  const sessionForm = document.getElementById('session-form');

  if (addSessionBtn) {
    addSessionBtn.addEventListener('click', () => {
      document.getElementById('session-modal-title').textContent = 'Add New Session';
      sessionForm.reset();
      sessionModal.style.display = 'block';
    });
  }

  if (closeModal) {
    closeModal.addEventListener('click', () => {
      sessionModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === sessionModal) {
      sessionModal.style.display = 'none';
    }
  });

  if (sessionForm) {
    sessionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveSession();
    });
  }

  const scheduleTab = document.querySelector('[data-tab="schedule"]');
  if (scheduleTab) {
    scheduleTab.addEventListener('click', () => {
      if (currentTutorName) {
        loadTutorMeetings(currentTutorName);
      }
    });
  }
});
