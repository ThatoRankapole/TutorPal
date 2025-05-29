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
} from './firebase-config.js';

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

// Student management functionality with Firebase
document.addEventListener('DOMContentLoaded', function () {

    // Show the student form modal when clicking "Add Student"
    document.getElementById('add-student-btn').addEventListener('click', function () {
        document.getElementById('student-form').reset();
        document.getElementById('student-id').value = '';
        document.getElementById('student-modal-title').textContent = 'Add New Student';
        document.getElementById('student-modal').style.display = 'flex';
    });

    // Close student modal on close button click
    document.querySelector('#student-modal .close-modal').addEventListener('click', function () {
        document.getElementById('student-modal').style.display = 'none';
        document.getElementById('student-form').reset();
    });

    // Close module selection modal on close button click
    document.querySelector('#module-selection-modal .close-modal').addEventListener('click', function () {
        document.getElementById('module-selection-modal').style.display = 'none';
        document.getElementById('module-selection-form').reset();
    });

    // Refresh students list when clicking refresh button
    document.getElementById('refresh-students-btn').addEventListener('click', function () {
        const studentsTable = document.getElementById('students-table');
        const tableBody = studentsTable.querySelector('tbody');
        tableBody.innerHTML = '<tr><td colspan="5">Loading students...</td></tr>';

        const studentsRef = collection(db, "Student");

        getDocs(studentsRef).then((querySnapshot) => {
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
                    <td>${student['course-code'] || ''}</td>
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

    // Handle click on edit buttons (using event delegation)
    document.addEventListener("click", async (e) => {
        if (e.target.closest(".edit-btn")) {
            const button = e.target.closest(".edit-btn");
            const studentId = button.dataset.id;

            const studentDocRef = doc(db, "Student", studentId);
            const studentDocSnap = await getDoc(studentDocRef);

            if (studentDocSnap.exists()) {
                const student = studentDocSnap.data();

                document.getElementById("student-id").value = studentId;
                document.getElementById("student-number").value = student["student-number"] || '';
                document.getElementById("id-number").value = student["id-number"] || '';
                document.getElementById("name").value = student.name || '';
                document.getElementById("surname").value = student.surname || '';
                document.getElementById("student-email").value = student["student-email"] || '';
                document.getElementById("course-code").value = student["course-code"] || '';

                document.getElementById("student-modal-title").textContent = "Edit Student";
                document.getElementById("student-modal").style.display = "flex";
            }
        }
    });

    // Student form submit: Validate course code and show module selection modal
    document.getElementById('student-form').addEventListener('submit', async function selectmodules(e) {
        e.preventDefault();
        const courseCode = document.getElementById('course-code').value.trim();
        if (!courseCode) {
            alert('Please enter the Course Code before continuing.');
            return;
        }
        try {
            const modulesRef = collection(db, 'Modules');
            const querySnapshot = await getDocs(modulesRef);
            const matchingModules = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data['course-code'] && data['course-code'].toLowerCase() === courseCode.toLowerCase()) {
                    matchingModules.push(data);
                }
            });
            if (matchingModules.length === 0) {
                alert('No modules found for the entered course code.');
                return;
            }
            const container = document.getElementById('module-checkboxes');
            container.innerHTML = '';
            matchingModules.forEach(module => {
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = 'modules';
                checkbox.value = module['module-code'];
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${module['module-name']} (${module['module-code']})`));
                label.style.display = 'inline-block';
                label.style.marginRight = '2px';
                label.style.marginBottom = '6px';
                container.appendChild(label);
            });
            const studentId = document.getElementById('student-id').value.trim();
            if (studentId) {
                try {
                    const studentRef = doc(db, "Student", studentId);
                    const studentSnap = await getDoc(studentRef);
                    if (studentSnap.exists()) {
                        const studentData = studentSnap.data();
                        const savedModulesStr = studentData.modules || '';
                        const savedModules = savedModulesStr.split(':').filter(m => m);
                        const allCheckboxes = document.querySelectorAll('#module-checkboxes input[type="checkbox"]');
                        allCheckboxes.forEach(cb => {
                            cb.checked = savedModules.includes(cb.value);
                        });
                    }
                } catch (error) {
                    console.error("Error loading student's modules:", error);
                }
            }
            // Hide student form modal and show module selection modal
            document.getElementById('student-modal').style.display = 'none';
            document.getElementById('module-selection-modal').style.display = 'flex';
        } catch (error) {
            console.error('Error fetching modules:', error);
            alert('Error fetching modules: ' + error.message);
        }
    });

    // Module selection form submit: save or update student
    document.getElementById('module-selection-form').addEventListener('submit', async function (e) {
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

        const checkboxes = document.querySelectorAll('#module-checkboxes input[type="checkbox"]:checked');
        const selectedModules = Array.from(checkboxes).map(cb => cb.value);
        const modulesString = selectedModules.length > 0 ? selectedModules.join(':') + ':' : '';

        const studentData = {
            'student-number': studentNumber,
            name,
            surname,
            'student-email': email,
            'id-number': idNumber,
            'date-of-birth': dob,
            'profilePictureUrl': '',
            'course-code': courseCode,
            modules: modulesString
        };

        try {
            if (studentId) {
                const studentRef = doc(db, "Student", studentId);
                await updateDoc(studentRef, studentData);
                alert(`Student ${name} ${surname} updated successfully.`);
            } else {
                const randomPassword = Math.random().toString(36).slice(-10);
                await createUserWithEmailAndPassword(auth, email, randomPassword);
                await setDoc(doc(db, 'Student', studentNumber), studentData);
                await sendPasswordResetEmail(auth, email);
                alert(`Student ${name} ${surname} added successfully!\nA password reset email has been sent to ${email}.`);
            }
            document.getElementById('student-modal').style.display = 'none';
            document.getElementById('module-selection-modal').style.display = 'none';
            document.getElementById('refresh-students-btn').click();
        } catch (error) {
            console.error('Error saving student:', error);
            alert('Error saving student: ' + error.message);
        }
    });

    // Delete student function exposed globally
    window.deleteStudent = async function (studentId, studentName, btnElement) {
        const confirmDelete = confirm(`Are you sure you want to delete ${studentName}?`);
        if (!confirmDelete) return;

        try {
            const studentRef = doc(db, "Student", studentId);
            const studentSnap = await getDoc(studentRef);

            if (!studentSnap.exists()) {
                throw new Error("Student not found");
            }

            await deleteDoc(studentRef);

            // Remove the table row
            const row = btnElement.closest('tr');
            if (row) row.remove();

            alert(`Student ${studentName} deleted successfully.`);
            document.getElementById('refresh-students-btn').click();
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Error deleting student: ' + error.message);
        }
    };

    // Initially load the students list on page load
    document.getElementById('refresh-students-btn').click();
});
