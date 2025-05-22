import {
  db,
  auth,
  collection,
  query,
  where,
  getDocs,
} from "./firebase-config.js";

async function getTutorFullNameByEmail(email) {
  const tutorsRef = collection(db, "Tutor");
  const q = query(tutorsRef, where("email", "==", email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  const tutorDoc = querySnapshot.docs[0];
  const tutorData = tutorDoc.data();
  return `${tutorData.firstname} ${tutorData.lastname}`;
}

async function loadTutorModules(tutorFullName) {
  const tbody = document.querySelector('#modules-table tbody');

  tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading modules...</td></tr>';

  try {
    if (!tutorFullName) {
      tbody.innerHTML = '<tr><td colspan="5" class="error">No tutor information found.</td></tr>';
      return;
    }

    const modulesQuery = query(
      collection(db, "Modules"),
      where("module-tutor", "==", tutorFullName)
    );
    const querySnapshot = await getDocs(modulesQuery);

    tbody.innerHTML = '';

    if (querySnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" class="no-data">No modules assigned</td></tr>';
      return;
    }

    querySnapshot.forEach(docSnap => {
      const module = docSnap.data();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${module['module-code'] || 'N/A'}</td>
        <td>${module['module-name'] || 'N/A'}</td>
        <td>${module['module-credits'] || 'N/A'}</td>
        <td>${module['module-tutor'] || 'You'}</td>
        <td>
          <button class="btn-view-module" data-id="${docSnap.id}">
            <i class="fas fa-eye"></i> View
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    document.querySelectorAll('.btn-view-module').forEach(button => {
      button.addEventListener('click', e => {
        const moduleId = e.currentTarget.getAttribute('data-id');
        alert(`Viewing module with ID: ${moduleId}`);
      });
    });

  } catch (error) {
    console.error("Error loading modules:", error);
    tbody.innerHTML = '<tr><td colspan="5" class="error">Failed to load modules. Please try again.</td></tr>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Wait for auth state change
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const email = user.email;
      const tutorFullName = await getTutorFullNameByEmail(email);
      loadTutorModules(tutorFullName);
    } else {
      const tbody = document.querySelector('#modules-table tbody');
      tbody.innerHTML = '<tr><td colspan="5" class="error">Please log in to view your modules.</td></tr>';
    }
  });

  const refreshBtn = document.getElementById('refresh-modules-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (user) {
        const tutorFullName = await getTutorFullNameByEmail(user.email);
        loadTutorModules(tutorFullName);
      }
    });
  }
});

// Styles remain the same
const style = document.createElement('style');
style.textContent = `
  #modules-table tbody .loading,
  #modules-table tbody .no-data,
  #modules-table tbody .error {
    text-align: center;
    padding: 20px;
    color: #666;
  }
  #modules-table tbody .error {
    color: #d32f2f;
  }
  .btn-view-module {
    background: #4285f4;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
  }
  .btn-view-module:hover {
    background: #3367d6;
  }
`;
document.head.appendChild(style);
