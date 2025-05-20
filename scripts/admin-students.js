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
                    <button class="delete-btn" onclick="deleteStudent('${doc.id}', '${student.name} ${student.surname}', this)">
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

     // Add Student Button Click Handler
    document.getElementById('add-student-btn').addEventListener('click', function() {
        // Reset form and set title for adding new student
        document.getElementById('student-form').reset();
        document.getElementById('student-id').value = '';
        document.getElementById('student-modal-title').textContent = 'Add New Student';
        document.getElementById('student-modal').style.display = 'flex';
    });

    // Edit Student Button Click Handler
    document.addEventListener("click", async (e) => {
        if (e.target.closest(".edit-btn")) {
            const button = e.target.closest(".edit-btn");
            const studentId = button.dataset.id;

            const studentDocRef = doc(db, "Student", studentId);
            const studentDocSnap = await getDoc(studentDocRef);

            if (studentDocSnap.exists()) {
                const student = studentDocSnap.data();

                // Fill form fields with student data
                document.getElementById("student-id").value = studentId;
                document.getElementById("student-number").value = student["student-number"] || '';
                document.getElementById("id-number").value = student["id-number"] || '';
                document.getElementById("name").value = student.name || '';
                document.getElementById("surname").value = student.surname || '';
                document.getElementById("student-email").value = student["student-email"] || '';
                document.getElementById("course-code").value = student["course-code"] || '';

                // Set modal title for editing
                document.getElementById("student-modal-title").textContent = "Edit Student";
                
                // Show modal
                document.getElementById("student-modal").style.display = "flex";
            }
        }
    });

    // Form Submission Handler (for both add and edit)
    document.getElementById('student-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const studentId = document.getElementById('student-id').value.trim();
        const studentNumber = document.getElementById('student-number').value.trim();
        const idNumber = document.getElementById('id-number').value.trim();
        const name = document.getElementById('name').value.trim();
        const surname = document.getElementById('surname').value.trim();
        const email = document.getElementById('student-email').value.trim();
        const courseCode = document.getElementById('course-code').value.trim();

        // Validation
        if (!studentNumber || !email || !name || !surname) {
            alert('Please fill in all required fields (Student Number, Name, Surname, Email)');
            return;
        }

        // Extract DOB from ID Number
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
            if (studentId) {
                // Update existing student
                const studentRef = doc(db, "Student", studentId);
                await updateDoc(studentRef, studentData);
                alert(`Student ${name} ${surname} updated successfully.`);
            } else {
                // Add new student
                // Generate temporary password
                const randomPassword = Math.random().toString(36).slice(-10);
                
                // Create auth user
                await createUserWithEmailAndPassword(auth, email, randomPassword);
                
                // Add to Firestore
                await setDoc(doc(db, 'Student', studentNumber), studentData);
                
                // Send password reset email
                await sendPasswordResetEmail(auth, email);
                
                alert(`Student ${name} ${surname} added successfully!\nA password reset email has been sent to ${email}.`);
            }

            // Close modal and refresh list
            document.getElementById('student-modal').style.display = 'none';
            document.getElementById('refresh-students-btn').click();
            
        } catch (error) {
            console.error('Error saving student:', error);
            alert('Error saving student: ' + error.message);
        }
    });

    // Close Modal Handler
    document.querySelector('#student-modal .close-modal').addEventListener('click', function() {
        document.getElementById('student-modal').style.display = 'none';
        document.getElementById('student-form').reset();
    });

    //delete sttudent
    window.deleteStudent = async function (studentId, studentName, btnElement) {
    const confirmDelete = confirm(`Are you sure you want to delete ${studentName}?`);
    if (!confirmDelete) return;

    try {
        // First get the student document to access the email
        const studentRef = doc(db, "Student", studentId);
        const studentSnap = await getDoc(studentRef);
        
        if (!studentSnap.exists()) {
            throw new Error("Student not found");
        }

        const studentEmail = studentSnap.data()['student-email'];

        // Delete from Firestore
        await deleteDoc(studentRef);

        // Note: To delete from Firebase Authentication, you would need a Cloud Function
        // as client-side can't directly delete users. Here we just log the email.
        console.log(`Student account to delete from auth: ${studentEmail}`);
        // In production, you would call a Cloud Function here

        // Remove row from table
        if (btnElement && btnElement.closest) {
            const row = btnElement.closest('tr');
            if (row) row.remove();
        }

        // Update the student count
        const studentCountElement = document.getElementById('total-students');
        if (studentCountElement) {
            const currentCount = parseInt(studentCountElement.textContent) || 0;
            studentCountElement.textContent = Math.max(0, currentCount - 1);
        }

        alert(`${studentName} deleted successfully`);
    } catch (error) {
        console.error("Error deleting student:", error);
        alert("Error deleting student: " + error.message);
    }
};
});