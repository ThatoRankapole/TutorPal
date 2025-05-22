import {
  db,
  auth,
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
  deleteObject,
  tutorsRef
} from './firebase-config.js';

const DEFAULT_PROFILE_PIC = 'https://img.icons8.com/material-rounded/24/user-male-circle.png';

async function verifyUser() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in to continue');
  }
  return user;
}

async function loadTutorProfile() {
  try {
    const user = await verifyUser();
    const emailQuery = query(tutorsRef, where("email", "==", user.email));
    const emailSnapshot = await getDocs(emailQuery);

    if (emailSnapshot.empty) {
      throw new Error('Tutor profile not found');
    }

    const tutorDoc = emailSnapshot.docs[0];
    const tutorData = tutorDoc.data();

    document.getElementById("tutor-name").textContent = (tutorData.firstname || "");
    document.getElementById("tutor-surname").textContent = (tutorData.lastname || "");
    document.getElementById("tutor-email").textContent = tutorData.email || user.email || "";

    const profilePicture = document.getElementById('profile-picture');
    profilePicture.src = tutorData.profilePictureUrl || DEFAULT_PROFILE_PIC;

  } catch (error) {
    console.error("Profile load error:", error);
    alert(error.message);
  }
}

async function uploadProfilePicture(file) {
  const user = await verifyUser();

  try {
    if (!file.type.match('image.*')) {
      throw new Error('Only image files are allowed');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Image must be less than 2MB');
    }

    const emailQuery = query(tutorsRef, where("email", "==", user.email));
    const emailSnapshot = await getDocs(emailQuery);

    if (emailSnapshot.empty) {
      throw new Error('Tutor record not found');
    }

    const tutorDoc = emailSnapshot.docs[0];
    const tutorData = tutorDoc.data();

    if (tutorData.profilePictureUrl && tutorData.profilePictureUrl !== DEFAULT_PROFILE_PIC) {
      try {
        const oldPictureRef = ref(storage, tutorData.profilePictureUrl);
        await deleteObject(oldPictureRef);
      } catch (error) {
        console.log("No old picture to delete or already removed");
      }
    }

    const storageRef = ref(storage, `tutor-profile-pictures/${user.uid}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    await updateDoc(doc(db, "Tutor", tutorDoc.id), {
      profilePictureUrl: downloadURL
    });

    return downloadURL;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

async function removeProfilePicture() {
  const user = await verifyUser();

  try {
    const emailQuery = query(tutorsRef, where("email", "==", user.email));
    const emailSnapshot = await getDocs(emailQuery);

    if (emailSnapshot.empty) {
      throw new Error('Tutor record not found');
    }

    const tutorDoc = emailSnapshot.docs[0];
    const tutorData = tutorDoc.data();
    const currentPicUrl = tutorData.profilePictureUrl;

    if (currentPicUrl && currentPicUrl !== DEFAULT_PROFILE_PIC) {
      try {
        const picRef = ref(storage, currentPicUrl);
        await deleteObject(picRef);
      } catch (error) {
        console.log("Picture already removed or not found");
      }
    }

    await updateDoc(doc(db, "Tutor", tutorDoc.id), {
      profilePictureUrl: DEFAULT_PROFILE_PIC
    });

    return DEFAULT_PROFILE_PIC;
  } catch (error) {
    console.error("Remove error:", error);
    throw error;
  }
}

function setupProfilePictureHandlers() {
  const changeBtn = document.getElementById('change-picture-btn');
  const removeBtn = document.getElementById('remove-picture-btn');
  const uploadInput = document.getElementById('profile-picture-upload');

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

document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadTutorProfile();
      setupProfilePictureHandlers();
      setupPasswordReset();
    }
  });
});
