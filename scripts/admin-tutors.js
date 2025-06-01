import {
    db,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    collection,
    auth,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    query,
    where
} from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('add-tutor-btn').addEventListener('click', function () {
        document.getElementById('tutor-form').reset();
        document.getElementById('tutor-id').value = '';
        document.getElementById('tutor-modal-title').textContent = 'Add New Tutor';
        document.getElementById('tutor-modal').style.display = 'flex';
    });

    document.querySelector('#tutor-modal .close-modal').addEventListener('click', function () {
        document.getElementById('tutor-modal').style.display = 'none';
        document.getElementById('tutor-form').reset();
    });

    async function loadTutors() {
        const tutorsTable = document.getElementById('tutors-table');
        const tableBody = tutorsTable.querySelector('tbody');
        tableBody.innerHTML = '<tr><td colspan="5">Loading tutors...</td></tr>';

        try {
            const tutorsRef = collection(db, 'Tutor');
            const querySnapshot = await getDocs(tutorsRef);

            tableBody.innerHTML = '';

            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="5">No tutors found</td></tr>';
                return;
            }

            for (const docSnap of querySnapshot.docs) {
                const tutor = docSnap.data();
                const tutorFullName = `${tutor.firstname} ${tutor.lastname}`.trim();

                let modulesList = 'N/A';

                try {
                    const modulesRef = collection(db, 'Modules');
                    const modulesQuery = query(modulesRef, where('module-tutor', '==', tutorFullName));
                    const modulesSnap = await getDocs(modulesQuery);

                    if (!modulesSnap.empty) {
                        modulesList = modulesSnap.docs.map(moduleDoc => moduleDoc.id).join('<br>');
                    }
                } catch (modErr) {
                    console.error('Error fetching modules for tutor:', tutorFullName, modErr);
                }

                const row = document.createElement('tr');

                row.innerHTML = `
                    <td>${tutor['staff-number'] || 'N/A'}</td>
                    <td>${tutor.firstname || ''} ${tutor.lastname || ''}</td>
                    <td>${tutor.email || 'N/A'}</td>
                    <td>${modulesList}</td>
                    <td class="action-buttons">
                        <button class="edit-btn" data-id="${docSnap.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="delete-btn" onclick="deleteTutor('${docSnap.id}', '${tutor.firstname} ${tutor.lastname}', this)"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            }
        } catch (error) {
            console.error("Error loading tutors: ", error);
            tableBody.innerHTML = '<tr><td colspan="5">Error loading tutors</td></tr>';
        }
    }

    loadTutors();

    document.addEventListener("click", async (e) => {
        if (e.target.closest(".edit-btn")) {
            const button = e.target.closest(".edit-btn");
            const tutorId = button.dataset.id;

            const tutorDocRef = doc(db, "Tutor", tutorId);
            const tutorDocSnap = await getDoc(tutorDocRef);

            if (tutorDocSnap.exists()) {
                const tutor = tutorDocSnap.data();

                document.getElementById("tutor-id").value = tutorId;
                document.getElementById("staff-number").value = tutor['staff-number'] || '';
                document.getElementById("tutor-firstname").value = tutor.firstname || '';
                document.getElementById("tutor-lastname").value = tutor.lastname || '';
                document.getElementById("tutor-email").value = tutor.email || '';

                document.getElementById("tutor-modal-title").textContent = "Edit Tutor";
                document.getElementById("tutor-modal").style.display = "flex";
            }
        }
    });

    document.getElementById('tutor-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const tutorId = document.getElementById('tutor-id').value.trim();
        const staffNumber = document.getElementById('staff-number').value.trim();
        const firstname = document.getElementById('tutor-firstname').value.trim();
        const lastname = document.getElementById('tutor-lastname').value.trim();
        const email = document.getElementById('tutor-email').value.trim();

        if (!staffNumber || !firstname || !lastname || !email) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            if (tutorId) {
                const tutorRef = doc(db, "Tutor", tutorId);
                await updateDoc(tutorRef, {
                    'staff-number': staffNumber,
                    firstname,
                    lastname,
                    email
                });
                alert(`Tutor ${firstname} ${lastname} updated successfully.`);
            } else {
                const randomPassword = Math.random().toString(36).slice(-10);
                const userCredential = await createUserWithEmailAndPassword(auth, email, randomPassword);
                const uid = userCredential.user.uid;

                await setDoc(doc(db, 'Tutor', staffNumber), {
                    'staff-number': staffNumber,
                    firstname,
                    lastname,
                    email,
                    uid
                });

                await sendPasswordResetEmail(auth, email);
                alert(`Tutor ${firstname} ${lastname} added successfully! A password reset email has been sent to ${email}.`);
            }

            document.getElementById('tutor-modal').style.display = 'none';
            loadTutors();
        } catch (error) {
            console.error('Error saving tutor:', error);
            alert('Error saving tutor: ' + error.message);
        }
    });

    window.deleteTutor = async function (tutorId, tutorName, btnElement) {
        const confirmDelete = confirm(`Are you sure you want to delete ${tutorName}?`);
        if (!confirmDelete) return;

        try {
            const tutorRef = doc(db, "Tutor", tutorId);
            const tutorSnap = await getDoc(tutorRef);

            if (!tutorSnap.exists()) throw new Error("Tutor not found");

            const tutorData = tutorSnap.data();
            const tutorEmail = tutorData.email;

            await deleteDoc(tutorRef);
            console.log(`Tutor deleted from Firestore. Email: ${tutorEmail}`);

            if (btnElement && btnElement.closest) {
                const row = btnElement.closest('tr');
                if (row) row.remove();
            }

            alert(`${tutorName} deleted successfully.`);
            loadTutors();
        } catch (error) {
            console.error("Error deleting tutor:", error);
            alert("Error deleting tutor: " + error.message);
        }
    };
});
