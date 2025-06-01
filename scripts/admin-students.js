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

async function populateCourseCodeSelect() {
    const courseCodeSelect = document.getElementById('course-code');
    if (!courseCodeSelect) return;

    courseCodeSelect.innerHTML = '<option value="" disabled selected>Select Course Code</option>';

    try {
        const qualificationsSnapshot = await getDocs(collection(db, "Qualifications"));
        const courseCodes = new Set();

        qualificationsSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (Array.isArray(data.courses)) {
                data.courses.forEach(course => {
                    if (typeof course === 'string') {
                        courseCodes.add(course);
                    }
                });
            }
        });

        courseCodes.forEach(courseCode => {
            const option = document.createElement('option');
            option.value = courseCode;
            option.textContent = courseCode;
            courseCodeSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to load course codes:", error);
        courseCodeSelect.innerHTML = '<option value="">Error loading course codes</option>';
    }
}

document.addEventListener('DOMContentLoaded', function () {

    populateCourseCodeSelect();
    refreshStudentsTable();

    document.getElementById('add-student-btn').addEventListener('click', function () {
        document.getElementById('student-form').reset();
        document.getElementById('student-id').value = '';
        document.getElementById('student-number').disabled = false;
        document.getElementById('student-modal-title').textContent = 'Add New Student';
        document.getElementById('student-modal').style.display = 'flex';
    });

    document.querySelector('#student-modal .close-modal').addEventListener('click', function () {
        document.getElementById('student-modal').style.display = 'none';
        document.getElementById('student-form').reset();
    });

    document.querySelector('#module-selection-modal .close-modal').addEventListener('click', function () {
        document.getElementById('module-selection-modal').style.display = 'none';
        document.getElementById('module-selection-form').reset();
    });

    async function refreshStudentsTable() {
        const studentsTable = document.getElementById('students-table');
        const tableBody = studentsTable.querySelector('tbody');
        tableBody.innerHTML = '<tr><td colspan="5">Loading students...</td></tr>';

        try {
            const studentsRef = collection(db, "Student");
            const querySnapshot = await getDocs(studentsRef);

            tableBody.innerHTML = '';
            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="5">No students found</td></tr>';
                return;
            }

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
        } catch (error) {
            console.error("Error loading students: ", error);
            tableBody.innerHTML = '<tr><td colspan="5">Error loading students</td></tr>';
        }
    }

    document.addEventListener("click", async (e) => {
        if (e.target.closest(".edit-btn")) {
            const button = e.target.closest(".edit-btn");
            const studentId = button.dataset.id;

            try {
                const studentDocRef = doc(db, "Student", studentId);
                const studentDocSnap = await getDoc(studentDocRef);

                if (studentDocSnap.exists()) {
                    const student = studentDocSnap.data();

                    document.getElementById("student-id").value = studentId;
                    document.getElementById("student-number").value = student["student-number"] || '';
                    document.getElementById("student-number").disabled = true;
                    document.getElementById("id-number").value = student["id-number"] || '';
                    document.getElementById("name").value = student.name || '';
                    document.getElementById("surname").value = student.surname || '';
                    document.getElementById("student-email").value = student["student-email"] || '';
                    document.getElementById("course-code").value = student["course-code"] || '';

                    document.getElementById("student-modal-title").textContent = "Edit Student";
                    document.getElementById("student-modal").style.display = "flex";
                }
            } catch (error) {
                alert("Error loading student data: " + error.message);
                console.error(error);
            }
        }
    });

    document.getElementById('student-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const studentNumber = document.getElementById('student-number').value.trim();
        const idNumber = document.getElementById('id-number').value.trim();
        const email = document.getElementById('student-email').value.trim();
        const courseCode = document.getElementById('course-code').value.trim();
        const name = document.getElementById('name').value.trim();
        const surname = document.getElementById('surname').value.trim();

        if (!/^\d{9}$/.test(studentNumber)) {
            alert('Student number must be exactly 9 digits.');
            return;
        }

        if (!/^\d{13}$/.test(idNumber)) {
            alert('ID Number must be exactly 13 digits and numeric.');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        if (!courseCode || !name || !surname) {
            alert('Please fill in all required fields.');
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
                label.style.marginRight = '10px';
                label.style.marginBottom = '6px';
                container.appendChild(label);
            });

            const studentId = document.getElementById('student-id').value.trim();
            if (studentId) {
                const studentRef = doc(db, "Student", studentId);
                const studentSnap = await getDoc(studentRef);
                if (studentSnap.exists()) {
                    const studentData = studentSnap.data();
                    const savedModulesStr = studentData.modules || '';
                    const savedModules = savedModulesStr.split(':').map(m => m.split('(')[0]);
                    const allCheckboxes = document.querySelectorAll('#module-checkboxes input[type="checkbox"]');
                    allCheckboxes.forEach(cb => {
                        cb.checked = savedModules.includes(cb.value);
                    });
                }
            }

            document.getElementById('student-modal').style.display = 'none';
            document.getElementById('module-selection-modal').style.display = 'flex';

        } catch (error) {
            console.error('Error fetching modules:', error);
            alert('Error fetching modules: ' + error.message);
        }
    });

    document.getElementById('module-selection-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const studentId = document.getElementById('student-id').value.trim();
        const studentNumber = document.getElementById('student-number').value.trim();
        const idNumber = document.getElementById('id-number').value.trim();
        const name = document.getElementById('name').value.trim();
        const surname = document.getElementById('surname').value.trim();
        const email = document.getElementById('student-email').value.trim();
        const courseCode = document.getElementById('course-code').value.trim();

        if (!studentNumber) {
            alert('Student number missing.');
            return;
        }

        const selectedModules = Array.from(document.querySelectorAll('#module-checkboxes input[type="checkbox"]:checked')).map(cb => cb.value);
        if (selectedModules.length === 0) {
            alert('Please select at least one module.');
            return;
        }

        const modulesString = selectedModules.map(m => `${m}(0,yes,bad)`).join(':');

        const dataToSave = {
            "student-number": studentNumber,
            "id-number": idNumber,
            "name": name,
            "surname": surname,
            "student-email": email,
            "course-code": courseCode,
            modules: modulesString,
            last_updated: serverTimestamp(),
        };

        try {
            const studentRef = doc(db, "Student", studentNumber);
            await setDoc(studentRef, dataToSave, { merge: true });

            // Only send reset email if it's a NEW student (no studentId set)
            if (!studentId) {
                const randomPassword = "sdkjfnvkjnsuinvkvfdnvkjndfkjvnklcnxkjvmdfknvcmjvvjdfnjbfdjskvnkjnfdkj";

                try {
                    await createUserWithEmailAndPassword(auth, email, randomPassword);
                    await sendPasswordResetEmail(auth, email);
                } catch (authError) {
                    if (authError.code === 'auth/email-already-in-use') {
                        // Do nothing (editing case should not trigger this now)
                    } else {
                        console.error('Auth error:', authError);
                        alert('Student saved but failed to create auth user: ' + authError.message);
                        return;
                    }
                }
            }

            alert(`Student ${studentNumber} saved successfully.` + (!studentId ? ` A password reset email has been sent to ${email}.` : ''));
            document.getElementById('module-selection-modal').style.display = 'none';
            document.getElementById('student-form').reset();
            refreshStudentsTable();
        } catch (error) {
            console.error('Error saving student:', error);
            alert('Error saving student: ' + error.message);
        }
    });

    window.deleteStudent = async function (studentId, studentName, btn) {
        if (!confirm(`Are you sure you want to delete student ${studentName}?`)) {
            return;
        }
        try {
            await deleteDoc(doc(db, "Student", studentId));
            refreshStudentsTable();
        } catch (error) {
            alert("Failed to delete student: " + error.message);
        }
    };
});
