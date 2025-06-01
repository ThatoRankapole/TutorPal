import {
    db,
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc
} from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async function () {

    async function populateTutorSelect() {
        const tutorSelect = document.getElementById('module-tutor');
        if (!tutorSelect) return;
        tutorSelect.innerHTML = '<option value="">Select Tutor</option>';
        try {
            const tutorsSnapshot = await getDocs(collection(db, "Tutor"));
            tutorsSnapshot.forEach((docSnap) => {
                const tutor = docSnap.data();
                const fullName = `${tutor.firstname} ${tutor.lastname}`.trim();
                const option = document.createElement('option');
                option.value = fullName;
                option.textContent = fullName;
                tutorSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Failed to load tutors:", error);
            tutorSelect.innerHTML = '<option value="">Error loading tutors</option>';
        }
    }

    async function populateCourseCodeSelect() {
        const courseCodeSelect = document.getElementById('module-course-code');
        if (!courseCodeSelect) return;
        courseCodeSelect.innerHTML = '<option value="" disabled selected>Select course code</option>';
        try {
            const qualificationsSnapshot = await getDocs(collection(db, "Qualifications"));
            const allCourses = new Set();
            qualificationsSnapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (Array.isArray(data.courses)) {
                    data.courses.forEach(courseCode => {
                        allCourses.add(courseCode);
                    });
                }
            });
            if (allCourses.size === 0) {
                courseCodeSelect.innerHTML = '<option value="" disabled>No courses found</option>';
                return;
            }
            allCourses.forEach(courseCode => {
                const option = document.createElement('option');
                option.value = courseCode;
                option.textContent = courseCode;
                courseCodeSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Failed to load courses:", error);
            courseCodeSelect.innerHTML = '<option value="" disabled>Error loading courses</option>';
        }
    }

    async function loadModules() {
        const modulesTable = document.getElementById('modules-table');
        const tableBody = modulesTable.querySelector('tbody');
        tableBody.innerHTML = '<tr><td colspan="5">Loading modules...</td></tr>';
        try {
            const modulesSnapshot = await getDocs(collection(db, 'Modules'));
            tableBody.innerHTML = '';
            if (modulesSnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="5">No modules found</td></tr>';
                document.getElementById('total-modules').textContent = '0';
                return;
            }
            modulesSnapshot.forEach(docSnap => {
                const module = docSnap.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${module['module-code'] || 'N/A'}</td>
                    <td>${module['module-name'] || ''}</td>
                    <td>${module['module-credits'] || ''}</td>
                    <td>${module['module-tutor'] || ''}</td>
                    <td class="action-buttons">
                        <button class="edit-module-btn" data-id="${docSnap.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-module-btn" onclick="deleteModule('${docSnap.id}', '${module['module-code']}', '${module['module-name']}', '${module['module-tutor']}', this)">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Error loading modules:", error);
            tableBody.innerHTML = '<tr><td colspan="5">Error loading modules</td></tr>';
        }
    }

    document.getElementById('add-module-btn').addEventListener('click', async function () {
        document.getElementById('module-form').reset();
        document.getElementById('module-id').value = '';
        document.getElementById('module-modal-title').textContent = 'Add New Module';
        await populateTutorSelect();
        await populateCourseCodeSelect();
        document.getElementById('module-modal').style.display = 'flex';
    });

    document.querySelector('#module-modal .close-modal').addEventListener('click', function () {
        document.getElementById('module-modal').style.display = 'none';
        document.getElementById('module-form').reset();
    });

    document.addEventListener('click', async (e) => {
        if (e.target.closest('.edit-module-btn')) {
            const button = e.target.closest('.edit-module-btn');
            const moduleId = button.dataset.id;
            const moduleDocRef = doc(db, 'Modules', moduleId);
            try {
                const moduleDocSnap = await getDoc(moduleDocRef);
                if (moduleDocSnap.exists()) {
                    const module = moduleDocSnap.data();
                    document.getElementById('module-id').value = moduleId;
                    document.getElementById('module-code').value = module['module-code'] || '';
                    document.getElementById('module-name').value = module['module-name'] || '';
                    document.getElementById('module-credits').value = module['module-credits'] || '';
                    document.getElementById('module-course-code').value = module['course-code'] || '';
                    await populateTutorSelect();
                    await populateCourseCodeSelect();
                    document.getElementById('module-tutor').value = module['module-tutor'] || '';
                    document.getElementById('module-modal-title').textContent = 'Edit Module';
                    document.getElementById('module-modal').style.display = 'flex';
                }
            } catch (error) {
                console.error("Error fetching module:", error);
                alert('Error fetching module data');
            }
        }
    });

    document.getElementById('module-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const moduleId = document.getElementById('module-id').value.trim();
        const moduleCode = document.getElementById('module-code').value.trim();
        const moduleName = document.getElementById('module-name').value.trim();
        const moduleCredits = parseInt(document.getElementById('module-credits').value.trim(), 10);
        const courseCode = document.getElementById('module-course-code').value.trim();
        const moduleTutor = document.getElementById('module-tutor').value.trim();

        if (!moduleCode || !moduleName || isNaN(moduleCredits) || !moduleTutor || !courseCode) {
            alert('Please fill in all required fields');
            return;
        }

        const moduleData = {
            'module-code': moduleCode,
            'module-name': moduleName,
            'module-credits': moduleCredits,
            'course-code': courseCode,
            'module-tutor': moduleTutor
        };

        try {
            if (moduleId) {
                const moduleRef = doc(db, 'Modules', moduleId);
                const oldModuleDoc = await getDoc(moduleRef);
                const oldModuleData = oldModuleDoc.data();
                const oldTutorName = oldModuleData['module-tutor'];

                // Update module
                await updateDoc(moduleRef, moduleData);

                // If tutor has changed
                if (oldTutorName !== moduleTutor) {
                    const tutorsSnapshot = await getDocs(collection(db, "Tutor"));
                    for (const docSnap of tutorsSnapshot.docs) {
                        const tutor = docSnap.data();
                        const fullName = `${tutor.firstname} ${tutor.lastname}`.trim();
                        const currentModules = Array.isArray(tutor.modules) ? tutor.modules : [];

                        if (fullName === oldTutorName && currentModules.includes(moduleCode)) {
                            const updatedModules = currentModules.filter(m => m !== moduleCode);
                            await updateDoc(doc(db, "Tutor", docSnap.id), { modules: updatedModules });
                        }

                        if (fullName === moduleTutor && !currentModules.includes(moduleCode)) {
                            currentModules.push(moduleCode);
                            await updateDoc(doc(db, "Tutor", docSnap.id), { modules: currentModules });
                        }
                    }
                }

                alert(`Module ${moduleName} updated successfully.`);
            } else {
                const existingDoc = await getDoc(doc(db, 'Modules', moduleCode));
                if (existingDoc.exists()) {
                    alert(`A module with the code "${moduleCode}" already exists.`);
                    return;
                }
                await setDoc(doc(db, 'Modules', moduleCode), moduleData);

                // Add module to tutor's list
                const tutorsSnapshot = await getDocs(collection(db, "Tutor"));
                for (const docSnap of tutorsSnapshot.docs) {
                    const tutor = docSnap.data();
                    const fullName = `${tutor.firstname} ${tutor.lastname}`.trim();
                    if (fullName === moduleTutor) {
                        const currentModules = Array.isArray(tutor.modules) ? tutor.modules : [];
                        if (!currentModules.includes(moduleCode)) {
                            currentModules.push(moduleCode);
                        }
                        await updateDoc(doc(db, "Tutor", docSnap.id), { modules: currentModules });
                        break;
                    }
                }

                // Add default module entry to students
                const studentsSnapshot = await getDocs(collection(db, "Student"));
                for (const studentDoc of studentsSnapshot.docs) {
                    const studentData = studentDoc.data();
                    let studentModules = studentData.modules || {};
                    if (typeof studentModules === "string") {
                        const parsedModules = {};
                        const entries = studentModules.split(":");
                        for (const entry of entries) {
                            const match = entry.match(/^([A-Z0-9]+)\(([^)]+)\)$/);
                            if (match) {
                                parsedModules[match[1]] = `(${match[2]})`;
                            }
                        }
                        studentModules = parsedModules;
                    }
                    if (!studentModules[moduleCode]) {
                        studentModules[moduleCode] = '(0,yes,bad)';
                        await updateDoc(doc(db, "Student", studentDoc.id), { modules: studentModules });
                    }
                }

                alert(`Module ${moduleName} added successfully.`);
            }

            document.getElementById('module-form').reset();
            document.getElementById('module-modal').style.display = 'none';
            await loadModules();

        } catch (error) {
            console.error("Error saving module:", error);
            alert('Error saving module. Check console for details.');
        }
    });

    await loadModules();
});

window.deleteModule = async function (moduleId, moduleCode, moduleName, moduleTutor, btn) {
    if (!confirm(`Are you sure you want to delete the module ${moduleCode} - ${moduleName}?`)) return;
    btn.disabled = true;
    btn.textContent = 'Deleting...';

    try {
        const tutorsSnapshot = await getDocs(collection(db, "Tutor"));
        for (const docSnap of tutorsSnapshot.docs) {
            const tutor = docSnap.data();
            const fullName = `${tutor.firstname} ${tutor.lastname}`.trim();
            if (fullName === moduleTutor) {
                const currentModules = Array.isArray(tutor.modules) ? tutor.modules : [];
                if (currentModules.includes(moduleCode)) {
                    const updatedModules = currentModules.filter(m => m !== moduleCode);
                    await updateDoc(doc(db, "Tutor", docSnap.id), { modules: updatedModules });
                }
                break;
            }
        }

        await deleteDoc(doc(db, 'Modules', moduleId));

        const studentsSnapshot = await getDocs(collection(db, "Student"));
        for (const studentDoc of studentsSnapshot.docs) {
            const studentData = studentDoc.data();
            let studentModules = studentData.modules || {};
            if (typeof studentModules === "string") {
                const parsedModules = {};
                const entries = studentModules.split(":");
                for (const entry of entries) {
                    const match = entry.match(/^([A-Z0-9]+)\(([^)]+)\)$/);
                    if (match) {
                        parsedModules[match[1]] = `(${match[2]})`;
                    }
                }
                studentModules = parsedModules;
            }

            if (studentModules[moduleCode]) {
                delete studentModules[moduleCode];
                await updateDoc(doc(db, "Student", studentDoc.id), { modules: studentModules });
            }
        }

        alert(`Module ${moduleCode} deleted successfully.`);
        await loadModules();
    } catch (error) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash"></i> Delete';
    }
};
