import {
  db,
  auth,
  studentRef,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  sendPasswordResetEmail,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from './firebase-config.js';

// Default profile picture URL
const DEFAULT_PROFILE_PIC = 'https://img.icons8.com/material-rounded/24/user-male-circle.png';

// Enhanced user verification function
async function verifyUser() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in to continue');
  }
  return user;
}

// Improved profile loading with better error handling
async function loadStudentProfile() {
  try {
    const user = await verifyUser();
    const emailQuery = query(studentRef, where("student-email", "==", user.email));
    const emailSnapshot = await getDocs(emailQuery);

    if (emailSnapshot.empty) {
      throw new Error('Student profile not found');
    }

    const studentDoc = emailSnapshot.docs[0];
    const studentData = studentDoc.data();
    const studentNumber = studentData["student-number"];

    // Display basic info
    document.getElementById("student-name").textContent = studentData.name || "";
    document.getElementById("student-surname").textContent = studentData.surname || "";
    document.getElementById("student-number").textContent = studentNumber || "";
    document.getElementById("student-email").textContent = studentData["student-email"] || user.email || "";

    // Load profile picture with fallback
    const profilePicture = document.getElementById('profile-picture');
    profilePicture.src = studentData.profilePictureUrl || DEFAULT_PROFILE_PIC;

  } catch (error) {
    console.error("Profile load error:", error);
    alert(error.message);
  }
}

// Enhanced profile picture upload with file validation
async function uploadProfilePicture(file) {
  const user = await verifyUser();
  
  try {
    // Validate file
    if (!file.type.match('image.*')) {
      throw new Error('Only image files are allowed');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Image must be less than 2MB');
    }

    // Get student document
    const emailQuery = query(studentRef, where("student-email", "==", user.email));
    const emailSnapshot = await getDocs(emailQuery);
    
    if (emailSnapshot.empty) {
      throw new Error('Student record not found');
    }

    const studentDoc = emailSnapshot.docs[0];
    const studentData = studentDoc.data();
    const studentNumber = studentData["student-number"];
    
    if (!studentNumber) {
      throw new Error('Student number not found');
    }

    // Delete old picture if exists
    if (studentData.profilePictureUrl && studentData.profilePictureUrl !== DEFAULT_PROFILE_PIC) {
      try {
        const oldPictureRef = ref(storage, studentData.profilePictureUrl);
        await deleteObject(oldPictureRef);
      } catch (error) {
        console.log("No old picture to delete or already removed");
      }
    }

    // Upload new picture using UID as filename
    const storageRef = ref(storage, `profile-pictures/${user.uid}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Update student document
    await updateDoc(doc(db, "Student", studentDoc.id), {
      profilePictureUrl: downloadURL
    });

    return downloadURL;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

// Improved profile picture removal
async function removeProfilePicture() {
  const user = await verifyUser();
  
  try {
    // Get student document
    const emailQuery = query(studentRef, where("student-email", "==", user.email));
    const emailSnapshot = await getDocs(emailQuery);
    
    if (emailSnapshot.empty) {
      throw new Error('Student record not found');
    }

    const studentDoc = emailSnapshot.docs[0];
    const studentData = studentDoc.data();
    const currentPicUrl = studentData.profilePictureUrl;

    // Delete from storage if not default
    if (currentPicUrl && currentPicUrl !== DEFAULT_PROFILE_PIC) {
      try {
        const picRef = ref(storage, currentPicUrl);
        await deleteObject(picRef);
      } catch (error) {
        console.log("Picture already removed or not found");
      }
    }

    // Update student document
    await updateDoc(doc(db, "Student", studentDoc.id), {
      profilePictureUrl: DEFAULT_PROFILE_PIC
    });

    return DEFAULT_PROFILE_PIC;
  } catch (error) {
    console.error("Remove error:", error);
    throw error;
  }
}

// Setup profile picture handlers with UI feedback
function setupProfilePictureHandlers() {
  const changeBtn = document.getElementById('change-picture-btn');
  const removeBtn = document.getElementById('remove-picture-btn');
  const uploadInput = document.getElementById('profile-picture-upload');

  // Change picture handler
  if (changeBtn && uploadInput) {
    changeBtn.addEventListener('click', () => uploadInput.click());
    
    uploadInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        changeBtn.disabled = true;
        changeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        
        const url = await uploadProfilePicture(file);
        document.getElementById('profile-picture').src = url;
        document.getElementById('profile-pic').src = url;
        alert('Profile picture updated successfully!');
      } catch (error) {
        alert(error.message);
      } finally {
        changeBtn.disabled = false;
        changeBtn.innerHTML = '<i class="fas fa-camera"></i> Change';
        uploadInput.value = '';
      }
    });
  }

  // Remove picture handler
  if (removeBtn) {
    removeBtn.addEventListener('click', async () => {
      if (!confirm('Reset to default profile picture?')) return;
      
      try {
        removeBtn.disabled = true;
        removeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';
        
        const url = await removeProfilePicture();
        document.getElementById('profile-picture').src = url;
        alert('Profile picture reset to default!');
      } catch (error) {
        alert(error.message);
      } finally {
        removeBtn.disabled = false;
        removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
      }
    });
  }
}

// Password reset with improved error handling
function setupPasswordReset() {
  const changePasswordBtn = document.getElementById('open-password-change');
  if (!changePasswordBtn) return;

  changePasswordBtn.addEventListener('click', async () => {
    try {
      const user = await verifyUser();
      if (!user.email) {
        throw new Error('Email not available');
      }

      changePasswordBtn.disabled = true;
      changePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

      await sendPasswordResetEmail(auth, user.email);
      alert(`Password reset email sent to ${user.email}. Check your inbox.`);
      
    } catch (error) {
      console.error("Password reset error:", error);
      
      let errorMessage = "Failed to send password reset email";
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many attempts. Try again later.";
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      alert(`Error: ${errorMessage}`);
    } finally {
      changePasswordBtn.innerHTML = '<i class="fas fa-key"></i> Change Password';
      changePasswordBtn.disabled = false;
    }
  });
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadStudentProfile();
      setupProfilePictureHandlers();
      setupPasswordReset();
    }
  });
});