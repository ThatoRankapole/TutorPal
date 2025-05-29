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

document.addEventListener('DOMContentLoaded', function () {
    async function populateTutorSelect() {
        const tutorSelect = document.getElementById('module-tutor');
        if (!tutorSelect) return;

        tutorSelect.innerHTML = '<option value="">Select Tutor</option>';

        try {
            const tutorsSnapshot = await getDocs(collection(db, "Tutor"));
            tutorsSnapshot.forEach((docSnap) => {
                const tutor = docSnap.data();
                const fullName = `${tutor.firstname} ${tutor.lastname}`;
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

    document.getElementById('add-module-btn').addEventListener('click', function () {
        document.getElementById('module-form').reset();
        document.getElementById('module-id').value = '';
        document.getElementById('module-modal-title').textContent = 'Add New Module';
        populateTutorSelect();
        document.getElementById('module-modal').style.display = 'flex';
    });

    document.querySelector('#module-modal .close-modal').addEventListener('click', function () {
        document.getElementById('module-modal').style.display = 'none';
        document.getElementById('module-form').reset();
    });

    document.getElementById('refresh-modules-btn').addEventListener('click', async function () {
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

            document.getElementById('total-modules').textContent = modulesSnapshot.size;

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

                    await populateTutorSelect();
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
        const moduleTutor = document.getElementById('module-tutor').value.trim();

        if (!moduleCode || !moduleName || isNaN(moduleCredits) || !moduleTutor) {
            alert('Please fill in all required fields');
            return;
        }

        const moduleData = {
            'module-code': moduleCode,
            'module-name': moduleName,
            'module-credits': moduleCredits,
            'module-tutor': moduleTutor,
            'consultation-needed': false,
            'current-predicate': 0,
            'performance': 0
        };

        try {
            if (moduleId) {
                const moduleRef = doc(db, 'Modules', moduleId);
                await updateDoc(moduleRef, moduleData);
                alert(`Module ${moduleName} updated successfully.`);
            } else {
                await setDoc(doc(db, 'Modules', moduleCode), moduleData);

                // Add module code to tutor string
                const tutorsSnapshot = await getDocs(collection(db, "Tutor"));
                tutorsSnapshot.forEach(async (docSnap) => {
                    const tutor = docSnap.data();
                    const fullName = `${tutor.firstname} ${tutor.lastname}`;

                    if (fullName === moduleTutor) {
                        const currentModules = tutor.modules || "";
                        const modulesArray = currentModules.split(':').filter(m => m);
                        if (!modulesArray.includes(moduleCode)) {
                            modulesArray.push(moduleCode);
                        }
                        const updatedModulesString = modulesArray.join(':');
                        await updateDoc(doc(db, "Tutor", docSnap.id), { modules: updatedModulesString });
                    }
                });

                alert(`Module ${moduleName} added successfully.`);
            }

            document.getElementById('module-modal').style.display = 'none';
            document.getElementById('refresh-modules-btn').click();
        } catch (error) {
            console.error('Error saving module:', error);
            alert('Error saving module: ' + error.message);
        }
    });

    window.deleteModule = async function (moduleId, moduleCode, moduleName, moduleTutor, btnElement) {
        const confirmDelete = confirm(`Are you sure you want to delete the module "${moduleName}"?`);
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, 'Modules', moduleId));

            const tutorsSnapshot = await getDocs(collection(db, "Tutor"));
            tutorsSnapshot.forEach(async (docSnap) => {
                const tutor = docSnap.data();
                const fullName = `${tutor.firstname} ${tutor.lastname}`;

                if (fullName === moduleTutor) {
                    const modulesStr = tutor.modules || "";
                    let modulesArray = modulesStr.split(':').filter(m => m !== moduleCode);
                    const updatedModules = modulesArray.join(':');

                    await updateDoc(doc(db, "Tutor", docSnap.id), {
                        modules: updatedModules
                    });
                }
            });

            if (btnElement?.closest) {
                const row = btnElement.closest('tr');
                if (row) row.remove();
            }

            const moduleCountElement = document.getElementById('total-modules');
            if (moduleCountElement) {
                const currentCount = parseInt(moduleCountElement.textContent) || 0;
                moduleCountElement.textContent = Math.max(0, currentCount - 1);
            }

            alert(`Module "${moduleName}" deleted successfully.`);
        } catch (error) {
            console.error("Error deleting module:", error);
            alert("Error deleting module: " + error.message);
        }
    };

    if (document.getElementById('refresh-modules-btn')) {
        document.getElementById('refresh-modules-btn').click();
    }
});
