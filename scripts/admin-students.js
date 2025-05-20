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

// Student management functionality with Firebase
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('add-student-btn').addEventListener('click', function () {
        const modal = document.getElementById('student-modal');
        modal.style.display = 'flex';
    });

    document.querySelector('#student-modal .close-modal').addEventListener('click', function () {
        document.getElementById('student-modal').style.display = 'none';
    });

    //refresh students
    document.getElementById('refresh-students-btn').addEventListener('click', function () {
        const studentsTable = document.getElementById('students-table');
        const tableBody = studentsTable.querySelector('tbody');
        tableBody.innerHTML = '<tr><td colspan="5">Loading students...</td></tr>';

        // Get reference to the students collection
        const studentsRef = firebase.firestore().collection('Student');

        studentsRef.get().then((querySnapshot) => {
            tableBody.innerHTML = '';

            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="5">No students found</td></tr>';
                document.getElementById('total-students').textContent = '0';
                return;
            }

            // Update dashboard count
            document.getElementById('total-students').textContent = querySnapshot.size;

            querySnapshot.forEach((doc) => {
                const student = doc.data();
                const row = document.createElement('tr');

                row.innerHTML = `
                <td>${student['student-number'] || 'N/A'}</td>
                <td>${student.name || ''} ${student.surname || ''}</td>
                <td>${student['student-email'] || 'N/A'}</td>
                <td>${student['course-code']}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${doc.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="deleteStudent('${doc.id}', '${student.name} ${student.surname}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
                tableBody.appendChild(row);
            });
        }).catch((error) => {
            console.error("Error loading students: ", error);
            tableBody.innerHTML = '<tr><td colspan="5">Error loading students</td></tr>';
        });
    });

    //edit student
    // Attach listener to all edit buttons
    document.addEventListener("click", async (e) => {
        if (e.target.closest(".edit-btn")) {
            const button = e.target.closest(".edit-btn");
            const studentId = button.dataset.id;

            const studentDocRef = doc(db, "Student", studentId);
            const studentDocSnap = await getDoc(studentDocRef);

            if (studentDocSnap.exists()) {
                const student = studentDocSnap.data();

                // Fill form fields
                document.getElementById("student-id").value = studentId;
                document.getElementById("student-number").value = student["student-number"] || '';
                document.getElementById("id-number").value = student["id-number"] || '';
                document.getElementById("name").value = student.name || '';
                document.getElementById("surname").value = student.surname || '';
                document.getElementById("student-email").value = student["student-email"] || '';
                document.getElementById("course-code").value = student["course-code"] || '';

                // Set modal title
                document.getElementById("student-modal-title").textContent = "Edit Student";

                // Show modal
                document.getElementById("student-modal").style.display = "block";
            } else {
                alert("Student not found!");
            }
        }
    });

    document.getElementById('edit-student-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const studentId = document.getElementById('student-id').value.trim();
        const studentNumber = document.getElementById('student-number').value.trim();
        const idNumber = document.getElementById('id-number').value.trim();
        const name = document.getElementById('name').value.trim();
        const surname = document.getElementById('surname').value.trim();
        const email = document.getElementById('student-email').value.trim();
        const courseCode = document.getElementById('course-code').value.trim();

        if (!studentNumber || !email || !name || !surname) {
            alert('Please fill in all required fields (Student Number, Name, Surname, Email)');
            return;
        }

        let dob;
        try {
            const year = parseInt(idNumber.substring(0, 2), 10);
            const month = parseInt(idNumber.substring(2, 4), 10) - 1;
            const day = parseInt(idNumber.substring(4, 6), 10);
            const fullYear = year >= 0 && year <= 25 ? 2000 + year : 1900 + year;
            dob = new Date(fullYear, month, day);
            if (isNaN(dob.getTime())) throw new Error('Invalid date');
        } catch {
            alert('Invalid ID Number format. Could not extract a valid date of birth.');
            return;
        }

        const studentData = {
            'student-number': studentNumber,
            name,
            surname,
            'student-email': email,
            'id-number': idNumber,
            'date-of-birth': dob,
            'profilePictureUrl': '',
            'course-code': courseCode
        };

        try {
            const studentRef = doc(db, "Student", studentId);

            await updateDoc(studentRef, studentData);

            alert(`Student ${name} ${surname} updated successfully.`);

            // Close modal
            document.getElementById('student-modal').style.display = 'none';

            // Refresh list
            document.getElementById('refresh-students-btn').click();
        } catch (error) {
            console.error('Error updating student:', error);
            alert('Error updating student: ' + error.message);
        }
    });

    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('student-modal').style.display = 'none';
        document.getElementById('edit-student-form').reset();
        document.getElementById('student-id').value = '';
        document.getElementById('student-modal-title').textContent = 'Add New Student';

    });


    //add a student
    document.getElementById('student-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const studentNumber = document.getElementById('student-number').value.trim();
        const idNumber = document.getElementById('id-number').value.trim();
        const name = document.getElementById('name').value.trim();
        const surname = document.getElementById('surname').value.trim();
        const email = document.getElementById('student-email').value.trim();
        const courseCode = document.getElementById('course-code').value.trim();

        if (!studentNumber || !email || !name || !surname) {
            alert('Please fill in all required fields (Student Number, Name, Surname, Email)');
            return;
        }

        // Extract DOB from South African ID Number
        let dob;
        try {
            const year = parseInt(idNumber.substring(0, 2), 10);
            const month = parseInt(idNumber.substring(2, 4), 10) - 1;
            const day = parseInt(idNumber.substring(4, 6), 10);
            const fullYear = year >= 0 && year <= 25 ? 2000 + year : 1900 + year;
            dob = new Date(fullYear, month, day);
            if (isNaN(dob.getTime())) throw new Error('Invalid date');
        } catch {
            alert('Invalid ID Number format. Could not extract a valid date of birth.');
            return;
        }

        // Generate a temporary password (Firebase requires at least 6 characters)
        const randomPassword = Math.random().toString(36).slice(-10);

        const studentData = {
            'student-number': studentNumber,
            name,
            surname,
            'student-email': email,
            'id-number': idNumber,
            'date-of-birth': dob,
            'creation-date': serverTimestamp(),
            'profilePictureUrl': '',
            'course-code': courseCode
        };

        try {
            // Create user in Firebase Authentication
            await createUserWithEmailAndPassword(auth, email, randomPassword);

            // Add student data to Firestore
            await setDoc(doc(db, 'Student', studentNumber), studentData);

            // Send password reset email
            await sendPasswordResetEmail(auth, email);

            alert(`Student ${name} ${surname} added successfully!\nA password reset email has been sent to ${email}.`);

            // Close modal
            document.getElementById('student-modal').style.display = 'none';

            // Refresh student list
            document.getElementById('refresh-students-btn').click();

        } catch (error) {
            console.error('Error adding student:', error);
            alert('Error adding student: ' + error.message);
        }
    });
});