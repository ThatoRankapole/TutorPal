// Settings management functionality with Firebase
document.addEventListener('DOMContentLoaded', function() {
    const firebaseConfig = {
        apiKey: "AIzaSyDKxS5yJU-6KiOs_fVO03tXoPC6sLFbnJU",
        authDomain: "tutorpal-98679.firebaseapp.com",
        projectId: "tutorpal-98679",
        storageBucket: "tutorpal-98679.firebasestorage.app",
        messagingSenderId: "473172390647",
        appId: "1:473172390647:web:04d7cb1d550a91dc8059f2",
        measurementId: "G-538MQ597GM"
    };

    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const storage = firebase.storage();
    const db = firebase.firestore();

    initSettingsManagement(auth, storage, db);
});

function initSettingsManagement(auth, storage, db) {
    loadAdminProfile(auth, db);
    setupSettingsEventListeners(auth, storage, db);
}

function loadAdminProfile(auth, db) {
    const user = auth.currentUser;
    if (user) {
        document.getElementById('admin-name').textContent = user.displayName || 'Admin User';
        document.getElementById('admin-email').textContent = user.email;
        
        // Load profile picture if available
        if (user.photoURL) {
            document.getElementById('profile-picture').src = user.photoURL;
        }
    }
}

function setupSettingsEventListeners(auth, storage, db) {
    // Profile picture change
    document.getElementById('change-picture-btn').addEventListener('click', () => {
        document.getElementById('profile-picture-upload').click();
    });
    
    document.getElementById('profile-picture-upload').addEventListener('change', (e) => {
        uploadProfilePicture(auth, storage, e.target.files[0]);
    });
    
    // Profile picture removal
    document.getElementById('remove-picture-btn').addEventListener('click', () => {
        removeProfilePicture(auth, storage);
    });
    
    // Password change
    document.getElementById('open-password-change').addEventListener('click', () => {
        showPasswordChangeModal();
    });
    
    document.getElementById('password-form').addEventListener('submit', (e) => {
        e.preventDefault();
        changePassword(auth);
    });
    
    // Modal close handlers
    document.querySelector('#password-modal .close-modal').addEventListener('click', () => {
        document.getElementById('password-modal').style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('password-modal')) {
            document.getElementById('password-modal').style.display = 'none';
        }
    });
}

function uploadProfilePicture(auth, storage, file) {
    if (!file) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    const storageRef = storage.ref(`profile-pictures/${user.uid}`);
    const uploadTask = storageRef.put(file);
    
    uploadTask.on('state_changed',
        (snapshot) => {
            // Progress monitoring can be added here
        },
        (error) => {
            console.error("Upload error:", error);
            showAlert('Error uploading profile picture', 'error');
        },
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                user.updateProfile({
                    photoURL: downloadURL
                }).then(() => {
                    document.getElementById('profile-picture').src = downloadURL;
                    showAlert('Profile picture updated successfully', 'success');
                }).catch((error) => {
                    console.error("Error updating profile:", error);
                    showAlert('Error updating profile', 'error');
                });
            });
        }
    );
}

function removeProfilePicture(auth, storage) {
    const user = auth.currentUser;
    if (!user || !user.photoURL) return;
    
    if (confirm('Are you sure you want to remove your profile picture?')) {
        // Delete from storage if it's a Firebase Storage URL
        if (user.photoURL.includes('firebasestorage.googleapis.com')) {
            const storageRef = storage.refFromURL(user.photoURL);
            storageRef.delete().catch(error => {
                console.error("Error deleting old image:", error);
            });
        }
        
        user.updateProfile({
            photoURL: null
        }).then(() => {
            document.getElementById('profile-picture').src = 'https://img.icons8.com/material-rounded/24/user-male-circle.png';
            showAlert('Profile picture removed successfully', 'success');
        }).catch((error) => {
            console.error("Error removing profile picture:", error);
            showAlert('Error removing profile picture', 'error');
        });
    }
}

function showPasswordChangeModal() {
    document.getElementById('password-form').reset();
    document.getElementById('password-modal').style.display = 'flex';
}

function changePassword(auth) {
    const email = auth.currentUser?.email;
    if (!email) return;
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showAlert('Password reset email sent. Please check your inbox.', 'success');
            document.getElementById('password-modal').style.display = 'none';
        })
        .catch((error) => {
            console.error("Error sending reset email:", error);
            showAlert('Error sending password reset email', 'error');
        });
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}