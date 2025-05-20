import {
    db,
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    Timestamp,
    serverTimestamp,
    addDoc,
    auth,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from "./firebase-config.js";

// Tutor management functionality with Firebase
document.addEventListener('DOMContentLoaded', function () {
    // Open tutor modal
    document.getElementById('add-tutor-btn').addEventListener('click', function () {
        const modal = document.getElementById('tutor-modal');
        modal.style.display = 'flex';
    });

    // Close tutor modal
    document.querySelector('#tutor-modal .close-modal').addEventListener('click', function () {
        document.getElementById('tutor-modal').style.display = 'none';
        document.getElementById('edit-tutor-form').reset();
        document.getElementById('tutor-id').value = '';
        document.getElementById('tutor-modal-title').textContent = 'Add New Tutor';
    });

    // Refresh tutors list
    document.getElementById('refresh-tutors-btn').addEventListener('click', function () {
        const tutorsTable = document.getElementById('tutors-table');
        const tableBody = tutorsTable.querySelector('tbody');
        tableBody.innerHTML = '<tr><td colspan="5">Loading tutors...</td></tr>';

        // Get reference to the tutors collection
        const tutorsRef = collection(db, 'Tutors');

        getDocs(tutorsRef).then((querySnapshot) => {
            tableBody.innerHTML = '';

            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="5">No tutors found</td></tr>';
                document.getElementById('total-tutors').textContent = '0';
                return;
            }

            // Update dashboard count
            document.getElementById('total-tutors').textContent = querySnapshot.size;

            querySnapshot.forEach((doc) => {
                const tutor = doc.data();
                const row = document.createElement('tr');

                row.innerHTML = `
                    <td>${doc.id || 'N/A'}</td>
                    <td>${tutor.name || ''} ${tutor.surname || ''}</td>
                    <td>${tutor.email || 'N/A'}</td>
                    <td>${tutor['module-code'] || 'N/A'}</td>
                    <td class="action-buttons">
                        <button class="edit-tutor-btn" data-id="${doc.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-tutor-btn" onclick="deleteTutor('${doc.id}', '${tutor.name} ${tutor.surname}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }).catch((error) => {
            console.error("Error loading tutors: ", error);
            tableBody.innerHTML = '<tr><td colspan="5">Error loading tutors</td></tr>';
        });
    });

    // Edit tutor - Attach listener to all edit buttons
    document.addEventListener("click", async (e) => {
        if (e.target.closest(".edit-tutor-btn")) {
            const button = e.target.closest(".edit-tutor-btn");
            const tutorId = button.dataset.id;

            const tutorDocRef = doc(db, "Tutors", tutorId);
            const tutorDocSnap = await getDoc(tutorDocRef);

            if (tutorDocSnap.exists()) {
                const tutor = tutorDocSnap.data();

                // Fill form fields
                document.getElementById("tutor-id").value = tutorId;
                document.getElementById("tutor-firstname").value = tutor.name || '';
                document.getElementById("tutor-lastname").value = tutor.surname || '';
                document.getElementById("tutor-email").value = tutor.email || '';
                document.getElementById("tutor-specialization").value = tutor['module-code'] || '';

                // Set modal title
                document.getElementById("tutor-modal-title").textContent = "Edit Tutor";

                // Show modal
                document.getElementById("tutor-modal").style.display = "block";
            } else {
                alert("Tutor not found!");
            }
        }
    });

    // Edit tutor form submission
    document.getElementById('edit-tutor-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const tutorId = document.getElementById('tutor-id').value.trim();
        const firstName = document.getElementById('tutor-firstname').value.trim();
        const lastName = document.getElementById('tutor-lastname').value.trim();
        const email = document.getElementById('tutor-email').value.trim();
        const moduleCode = document.getElementById('tutor-specialization').value.trim();

        if (!firstName || !lastName || !email || !moduleCode) {
            alert('Please fill in all required fields');
            return;
        }

        const tutorData = {
            name: firstName,
            surname: lastName,
            email: email,
            'module-code': moduleCode
        };

        try {
            const tutorRef = doc(db, "Tutors", tutorId);
            await updateDoc(tutorRef, tutorData);

            alert(`Tutor ${firstName} ${lastName} updated successfully.`);
            document.getElementById('tutor-modal').style.display = 'none';
            document.getElementById('refresh-tutors-btn').click();
        } catch (error) {
            console.error('Error updating tutor:', error);
            alert('Error updating tutor: ' + error.message);
        }
    });

    // Add new tutor
    document.getElementById('tutor-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const staffNumber = document.getElementById('staff-number').value.trim();
        const firstName = document.getElementById('tutor-firstname').value.trim();
        const lastName = document.getElementById('tutor-lastname').value.trim();
        const email = document.getElementById('tutor-email').value.trim();
        const moduleCode = document.getElementById('tutor-specialization').value.trim();
        const idNumber = document.getElementById('tutor-id-number').value.trim();

        if (!staffNumber || !firstName || !lastName || !email || !moduleCode || !idNumber) {
            alert('Please fill in all required fields');
            return;
        }

        // Generate a temporary password
        const randomPassword = Math.random().toString(36).slice(-10);

        const tutorData = {
            name: firstName,
            surname: lastName,
            email: email,
            'module-code': moduleCode,
            'id-number': idNumber,
            'creation-date': serverTimestamp()
        };

        try {
            // Create user in Firebase Authentication
            await createUserWithEmailAndPassword(auth, email, randomPassword);

            // Add tutor data to Firestore
            await setDoc(doc(db, 'Tutors', staffNumber), tutorData);

            // Send password reset email
            await sendPasswordResetEmail(auth, email);

            alert(`Tutor ${firstName} ${lastName} added successfully!\nA password reset email has been sent to ${email}.`);

            // Close modal and refresh list
            document.getElementById('tutor-modal').style.display = 'none';
            document.getElementById('refresh-tutors-btn').click();

        } catch (error) {
            console.error('Error adding tutor:', error);
            alert('Error adding tutor: ' + error.message);
        }
    });
});

// Delete tutor function (called from onclick in HTML)
async function deleteTutor(tutorId, tutorName) {
    if (!confirm(`Are you sure you want to delete ${tutorName}?`)) {
        return;
    }

    try {
        // Delete from Firestore
        await deleteDoc(doc(db, "Tutors", tutorId));
        
        // Note: You might want to also delete the auth user, but that requires admin privileges
        // and should be done on the server side for security
        
        alert(`${tutorName} deleted successfully`);
        document.getElementById('refresh-tutors-btn').click();
    } catch (error) {
        console.error("Error deleting tutor:", error);
        alert("Error deleting tutor: " + error.message);
    }
}