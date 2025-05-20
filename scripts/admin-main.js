// Load Firebase SDKs from CDN
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyDKxS5yJU-6KiOs_fVO03tXoPC6sLFbnJU",
        authDomain: "tutorpal-98679.firebaseapp.com",
        projectId: "tutorpal-98679",
        storageBucket: "tutorpal-98679.firebasestorage.app",
        messagingSenderId: "473172390647",
        appId: "1:473172390647:web:04d7cb1d550a91dc8059f2",
        measurementId: "G-538MQ597GM"
    };

    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const analytics = firebase.analytics();
    const db = firebase.firestore();
    const auth = firebase.auth();
    const storage = firebase.storage();

    // Collection references
    const moduleRef = db.collection("Modules");
    const meetingsRef = db.collection("meetings");
    const messagesRef = db.collection("Messages");
    const exercisesRef = db.collection("Exercises");
    const tutorsRef = db.collection("Tutor");
    const eventsRef = db.collection("Events");
    const studentRef = db.collection("Student");

    // Initialize dashboard
    initDashboard(db, studentRef, tutorsRef, moduleRef, eventsRef);
    
    // Set up event listeners
    setupEventListeners(db, studentRef, tutorsRef, moduleRef);
});

function initDashboard(db, studentRef, tutorsRef, moduleRef, eventsRef) {
    // Load initial data
    loadDashboardStats(db, studentRef, tutorsRef, moduleRef);
    loadRecentActivities(eventsRef);
}

function setupEventListeners(db, studentRef, tutorsRef, moduleRef) {
    // Search functionality
    document.getElementById('keyword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch(db, studentRef, tutorsRef, moduleRef);
        }
    });
}

function showTab(tabId, db, studentRef, tutorsRef, moduleRef) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // Update active state in sidebar
    document.querySelectorAll('.sidebar nav ul li').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        }
    });
    
    // Load tab-specific data
    switch(tabId) {
        case 'students':
            loadStudents(db, studentRef);
            break;
        case 'tutors':
            loadTutors(db, tutorsRef);
            break;
        case 'modules':
            loadModules(db, moduleRef);
            break;
    }
}

function handleSearch(db, studentRef, tutorsRef, moduleRef) {
    const keyword = document.getElementById('keyword').value.trim().toLowerCase();
    const activeTab = document.querySelector('.tab-content.active').id;
    
    if (!keyword) return;
    
    switch(activeTab) {
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

function loadDashboardStats(db, studentRef, tutorsRef, moduleRef) {
    // Count students
    studentRef.get().then((querySnapshot) => {
        document.getElementById('total-students').textContent = querySnapshot.size;
    }).catch((error) => {
        console.error("Error counting students: ", error);
        document.getElementById('total-students').textContent = '0';
    });
    
    // Count tutors
    tutorsRef.get().then((querySnapshot) => {
        document.getElementById('total-tutors').textContent = querySnapshot.size;
    }).catch((error) => {
        console.error("Error counting tutors: ", error);
        document.getElementById('total-tutors').textContent = '0';
    });
    
    // Count modules
    moduleRef.get().then((querySnapshot) => {
        document.getElementById('total-modules').textContent = querySnapshot.size;
    }).catch((error) => {
        console.error("Error counting modules: ", error);
        document.getElementById('total-modules').textContent = '0';
    });
}

function loadRecentActivities(eventsRef) {
    // Get recent activities from Firestore
    eventsRef.orderBy('timestamp', 'desc').limit(5).get()
        .then((querySnapshot) => {
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
                
                // Format timestamp
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
        })
        .catch((error) => {
            console.error("Error loading activities: ", error);
            document.getElementById('activity-list').innerHTML = 
                '<div class="activity-item">Error loading activities</div>';
        });
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

// Tab-specific operation functions with Firebase integration
function loadStudents(db, studentRef) {
    console.log('Loading students from Firestore...');
    // Implement actual student loading logic here
}

function loadTutors(db, tutorsRef) {
    console.log('Loading tutors from Firestore...');
    // Implement actual tutor loading logic here
}

function loadModules(db, moduleRef) {
    console.log('Loading modules from Firestore...');
    // Implement actual module loading logic here
}

function searchStudents(keyword, db, studentRef) {
    console.log(`Searching students for: ${keyword}`);
    // Implement actual student search logic here
}

function searchTutors(keyword, db, tutorsRef) {
    console.log(`Searching tutors for: ${keyword}`);
    // Implement actual tutor search logic here
}

function searchModules(keyword, db, moduleRef) {
    console.log(`Searching modules for: ${keyword}`);
    // Implement actual module search logic here
}