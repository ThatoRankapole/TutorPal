// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

document.addEventListener('DOMContentLoaded', async function () {
    const firebaseConfig = {
        apiKey: "AIzaSyDKxS5yJU-6KiOs_fVO03tXoPC6sLFbnJU",
        authDomain: "tutorpal-98679.firebaseapp.com",
        projectId: "tutorpal-98679",
        storageBucket: "tutorpal-98679.appspot.com",
        messagingSenderId: "473172390647",
        appId: "1:473172390647:web:04d7cb1d550a91dc8059f2",
        measurementId: "G-538MQ597GM"
    };

    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);

    const moduleRef = collection(db, "Modules");
    const meetingsRef = collection(db, "meetings");
    const messagesRef = collection(db, "Messages");
    const exercisesRef = collection(db, "Exercises");
    const tutorsRef = collection(db, "Tutor");
    const eventsRef = collection(db, "Events");
    const studentRef = collection(db, "Student");

    initDashboard(db, studentRef, tutorsRef, moduleRef, eventsRef);
    setupEventListeners(db, studentRef, tutorsRef, moduleRef);

    // Make showTab and handleSearch available globally for inline HTML use
    window.showTab = (tabId) => showTab(tabId, db, studentRef, tutorsRef, moduleRef);
    window.handleSearch = () => handleSearch(db, studentRef, tutorsRef, moduleRef);
});

function initDashboard(db, studentRef, tutorsRef, moduleRef, eventsRef) {
    loadDashboardStats(db, studentRef, tutorsRef, moduleRef);
    loadRecentActivities(eventsRef);
}

function setupEventListeners(db, studentRef, tutorsRef, moduleRef) {
    document.getElementById('keyword').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleSearch(db, studentRef, tutorsRef, moduleRef);
        }
    });
}

function showTab(tabId, db, studentRef, tutorsRef, moduleRef) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    const selectedTab = document.getElementById(`${tabId}-tab`);
    if (selectedTab) selectedTab.classList.add('active');

    document.querySelectorAll('.sidebar nav ul li').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        }
    });

    switch (tabId) {
        case 'students':
            loadStudents(db, collection(db, "Student"));
            break;
        case 'tutors':
            loadTutors(db, collection(db, "Tutor"));
            break;
        case 'modules':
            loadModules(db, collection(db, "Modules"));
            break;
    }
}

function handleSearch(db, studentRef, tutorsRef, moduleRef) {
    const keyword = document.getElementById('keyword').value.trim().toLowerCase();
    const activeTab = document.querySelector('.tab-content.active')?.id;

    if (!keyword) return;

    switch (activeTab) {
        case 'students-tab':
            searchStudents(keyword, db, studentRef);
            break;
        case 'tutors-tab':
            searchTutors(keyword, db, tutorsRef);
            break;
        case 'modules-tab':
            searchModules(keyword, db, moduleRef);
            break;
        default:
            alert('Search is not available on this tab');
    }
}

async function loadDashboardStats(db, studentRef, tutorsRef, moduleRef) {
    try {
        const studentSnap = await getDocs(studentRef);
        document.getElementById('total-students').textContent = studentSnap.size;
    } catch (error) {
        console.error("Error counting students: ", error);
        document.getElementById('total-students').textContent = '0';
    }

    try {
        const tutorSnap = await getDocs(tutorsRef);
        document.getElementById('total-tutors').textContent = tutorSnap.size;
    } catch (error) {
        console.error("Error counting tutors: ", error);
        document.getElementById('total-tutors').textContent = '0';
    }

    try {
        const moduleSnap = await getDocs(moduleRef);
        document.getElementById('total-modules').textContent = moduleSnap.size;
    } catch (error) {
        console.error("Error counting modules: ", error);
        document.getElementById('total-modules').textContent = '0';
    }
}

async function loadRecentActivities(eventsRef) {
    try {
        const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);

        const activityList = document.getElementById('activity-list');
        activityList.innerHTML = '';

        if (querySnapshot.empty) {
            activityList.innerHTML = '<div class="activity-item">No recent activities</div>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const activity = doc.data();
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';

            const timestamp = activity.timestamp?.toDate();
            const timeAgo = timestamp ? formatTimeAgo(timestamp) : 'Just now';

            activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-details">
                    <p>${activity.message}</p>
                    <small>${timeAgo}</small>
                </div>
            `;
            activityList.appendChild(activityItem);
        });
    } catch (error) {
        console.error("Error loading activities: ", error);
        document.getElementById('activity-list').innerHTML =
            '<div class="activity-item">Error loading activities</div>';
    }
}

function getActivityIcon(activityType) {
    const icons = {
        'student': 'fa-user-graduate',
        'tutor': 'fa-chalkboard-teacher',
        'module': 'fa-book',
        'default': 'fa-history'
    };
    return icons[activityType] || icons['default'];
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return interval === 1 ? `${interval} ${unit} ago` : `${interval} ${unit}s ago`;
        }
    }

    return 'Just now';
}

async function loadStudents(db, studentRef) {
    const studentsTable = document.getElementById('students-table');
    const tableBody = studentsTable.querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="5">Loading students...</td></tr>';

    try {
        const querySnapshot = await getDocs(studentRef);
        tableBody.innerHTML = '';

        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5">No students found</td></tr>';
            document.getElementById('total-students').textContent = '0';
            return;
        }

        document.getElementById('total-students').textContent = querySnapshot.size;

        querySnapshot.forEach((doc) => {
            const student = doc.data();
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${student['student-number'] || 'N/A'}</td>
                <td>${student.name || ''} ${student.surname || ''}</td>
                <td>${student['student-email'] || 'N/A'}</td>
                <td>${student['course-code'] || 'N/A'}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${doc.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="deleteStudent('${doc.id}', '${student.name} ${student.surname}', this)">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading students: ", error);
        tableBody.innerHTML = '<tr><td colspan="5">Error loading students</td></tr>';
    }
}

async function loadTutors(db, tutorsRef) {
    const tutorsTable = document.getElementById('tutors-table');
    const tableBody = tutorsTable.querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="5">Loading tutors...</td></tr>';

    try {
        const querySnapshot = await getDocs(tutorsRef);
        tableBody.innerHTML = '';

        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5">No tutors found</td></tr>';
            document.getElementById('total-tutors').textContent = '0';
            return;
        }

        document.getElementById('total-tutors').textContent = querySnapshot.size;

        querySnapshot.forEach((docSnap) => {
            const tutor = docSnap.data();
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${tutor['staff-number'] || 'N/A'}</td>
                <td>${tutor.firstname || ''} ${tutor.lastname || ''}</td>
                <td>${tutor.email || 'N/A'}</td>
                <td>${tutor.specialization || 'N/A'}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${docSnap.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-btn" onclick="deleteTutor('${docSnap.id}', '${tutor.firstname} ${tutor.lastname}', this)"><i class="fas fa-trash"></i> Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading tutors: ", error);
        tableBody.innerHTML = '<tr><td colspan="5">Error loading tutors</td></tr>';
    }
}

async function loadModules(db, moduleRef) {
    const modulesTable = document.getElementById('modules-table');
    const tableBody = modulesTable.querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="5">Loading modules...</td></tr>';

    try {
        const modulesSnapshot = await getDocs(collection(db, 'Modules'));
        tableBody.innerHTML = '';

        if (modulesSnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5">No modules found</td></tr>';
            document.getElementById('total-modules').textContent = '0';
            return;
        }

        document.getElementById('total-modules').textContent = modulesSnapshot.size;

        modulesSnapshot.forEach(docSnap => {
            const module = docSnap.data();
            const row = document.createElement('tr');

            row.innerHTML = `
                    <td>${module['module-code'] || 'N/A'}</td>
                    <td>${module['module-name'] || ''}</td>
                    <td>${module['module-credits'] || ''}</td>
                    <td>${module['module-tutor'] || ''}</td>
                    <td class="action-buttons">
                        <button class="edit-module-btn" data-id="${docSnap.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-module-btn" onclick="deleteModule('${docSnap.id}', '${module['module-name']}', this)">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading modules:", error);
        tableBody.innerHTML = '<tr><td colspan="5">Error loading modules</td></tr>';
    }
}

function searchStudents(keyword, db, studentRef) {
    console.log(`Searching students for: ${keyword}`);
    // You can implement filter logic here (e.g., fetch all and filter by name/email)
}

function searchTutors(keyword, db, tutorsRef) {
    console.log(`Searching tutors for: ${keyword}`);
    // Same idea as above
}

function searchModules(keyword, db, moduleRef) {
    console.log(`Searching modules for: ${keyword}`);
    // Same idea as above
}
