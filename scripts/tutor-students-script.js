import {
  db,
  auth,
  collection,
  query,
  where,
  getDocs,
} from "./firebase-config.js";

// Get the full name of the logged-in tutor using their email
async function getTutorFullNameByEmail(email) {
  const tutorsRef = collection(db, "Tutor");
  const q = query(tutorsRef, where("email", "==", email));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const tutor = snapshot.docs[0].data();
  return `${tutor.firstname} ${tutor.lastname}`;
}

// Get all module codes the tutor is responsible for
async function getTutorModuleCodes(tutorFullName) {
  const modulesRef = collection(db, "Modules");
  const q = query(modulesRef, where("module-tutor", "==", tutorFullName));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => doc.data()["module-code"]);
}

// Load students doing any of the tutor's modules
async function loadMyStudents(tutorFullName) {
  const tbody = document.querySelector('#students-table tbody');
  tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading students...</td></tr>';

  try {
    const tutorModules = await getTutorModuleCodes(tutorFullName);

    if (tutorModules.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="no-data">You are not assigned any modules.</td></tr>';
      return;
    }

    const studentsRef = collection(db, "Student");
    const snapshot = await getDocs(studentsRef);
    const matchingStudents = [];

    snapshot.forEach(docSnap => {
      const student = docSnap.data();
      const studentModules = (student.modules || "").split(':').filter(Boolean);

      // Filter student's modules to only those taught by this tutor
      const relevantModules = studentModules.filter(m => tutorModules.includes(m));

      if (relevantModules.length > 0) {
        matchingStudents.push({
          id: docSnap.id,
          ...student,
          relevantModules
        });
      }
    });

    tbody.innerHTML = '';

    if (matchingStudents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="no-data">No students found for your modules.</td></tr>';
      return;
    }

    matchingStudents.forEach(student => {
      const modulesHtml = student.relevantModules.map(moduleCode => `
        <div style="display:inline-block; margin-right:10px;">
          <span>${moduleCode}</span>
          <button class="btn-view-module" data-student-id="${student.id}" data-module-code="${moduleCode}" style="margin-left:5px; padding:2px 6px; font-size:0.8rem;">
            View
          </button>
        </div>
      `).join('');

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${student["student-number"] || "N/A"}</td>
        <td>${student.name || ""} ${student.surname || ""}</td>
        <td>${student["student-email"] || "N/A"}</td>
        <td>${student["course-code"] || "N/A"}</td>
        <td>${modulesHtml}</td>
      `;
      tbody.appendChild(row);
    });

    // Attach click handlers to View buttons
    document.querySelectorAll(".btn-view-module").forEach(button => {
      button.addEventListener("click", (e) => {
        const studentId = e.currentTarget.getAttribute("data-student-id");
        const moduleCode = e.currentTarget.getAttribute("data-module-code");
        alert(`View performance of student ID ${studentId} in module ${moduleCode}`);
      });
    });

  } catch (err) {
    console.error("Error loading students:", err);
    tbody.innerHTML = '<tr><td colspan="5" class="error">Failed to load students.</td></tr>';
  }
}

// Run on DOM load and on refresh
document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(async user => {
    if (user) {
      const fullName = await getTutorFullNameByEmail(user.email);
      loadMyStudents(fullName);
    } else {
      document.querySelector('#students-table tbody').innerHTML = '<tr><td colspan="5" class="error">Not logged in.</td></tr>';
    }
  });

  const refreshBtn = document.getElementById('refresh-students-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (user) {
        const fullName = await getTutorFullNameByEmail(user.email);
        loadMyStudents(fullName);
      }
    });
  }
});
