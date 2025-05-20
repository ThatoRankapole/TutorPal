// Module management functionality with Firebase
document.addEventListener('DOMContentLoaded', function() {
    const firebaseConfig = {
        apiKey: "AIzaSyDKxS5yJU-6KiOs_fVO03tXoPC6sLFbnJU",
        authDomain: "tutorpal-98679.firebaseapp.com",
        projectId: "tutorpal-98679",
        storageBucket: "tutorpal-98679.firebasestorage.app",
        messagingSenderId: "473172390647",
        appId: "1:473172390647:web:04d7cb1d550a91dc8059f2",
        measurementId: "G-538MQ597GM"
    };

    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const modulesRef = db.collection("Modules");
    const tutorsRef = db.collection("Tutors");

    initModuleManagement(db, modulesRef, tutorsRef);
});

function initModuleManagement(db, modulesRef, tutorsRef) {
    loadModules(db, modulesRef);
    loadTutorsForDropdown(db, tutorsRef);
    setupModuleEventListeners(db, modulesRef);
}

function setupModuleEventListeners(db, modulesRef) {
    document.getElementById('add-module-btn').addEventListener('click', showAddModuleModal);
    document.getElementById('refresh-modules-btn').addEventListener('click', () => loadModules(db, modulesRef));
    
    document.querySelector('#module-modal .close-modal').addEventListener('click', () => {
        document.getElementById('module-modal').style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('module-modal')) {
            document.getElementById('module-modal').style.display = 'none';
        }
    });
    
    document.getElementById('module-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveModule(db, modulesRef);
    });
}

function showAddModuleModal() {
    document.getElementById('module-modal-title').textContent = 'Add New Module';
    document.getElementById('module-form').reset();
    document.getElementById('module-id').value = '';
    document.getElementById('module-modal').style.display = 'flex';
}

function loadModules(db, modulesRef) {
    const modulesTable = document.getElementById('modules-table');
    const tableBody = modulesTable.querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="6">Loading modules...</td></tr>';
    
    modulesRef.orderBy('createdAt', 'desc').get()
        .then((querySnapshot) => {
            tableBody.innerHTML = '';
            
            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="6">No modules found</td></tr>';
                return;
            }
            
            querySnapshot.forEach(async (doc) => {
                const module = doc.data();
                const row = document.createElement('tr');
                
                let tutorName = 'Not assigned';
                if (module.assignedTutorId) {
                    const tutorDoc = await db.collection("Tutors").doc(module.assignedTutorId).get();
                    if (tutorDoc.exists) {
                        const tutor = tutorDoc.data();
                        tutorName = `${tutor.name} ${tutor.surname}`;
                    }
                }
                
                row.innerHTML = `
                    <td>${module.moduleCode || 'N/A'}</td>
                    <td>${module.moduleName || 'N/A'}</td>
                    <td>${module.credits || 'N/A'}</td>
                    <td>${tutorName}</td>
                    <td>${module.createdAt?.toDate().toLocaleDateString() || 'N/A'}</td>
                    <td class="action-buttons">
                        <button class="edit-btn" data-id="${doc.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" data-id="${doc.id}" data-name="${module.moduleName}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    editModule(db, modulesRef, e.target.closest('button').getAttribute('data-id'));
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const button = e.target.closest('button');
                    deleteModule(db, modulesRef, button.getAttribute('data-id'), button.getAttribute('data-name'));
                });
            });
        })
        .catch((error) => {
            console.error("Error loading modules: ", error);
            tableBody.innerHTML = '<tr><td colspan="6">Error loading modules</td></tr>';
        });
}

function loadTutorsForDropdown(db, tutorsRef) {
    const tutorSelect = document.getElementById('module-tutor');
    tutorSelect.innerHTML = '<option value="">Select Tutor</option>';
    
    tutorsRef.get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const tutor = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${tutor.name} ${tutor.surname}`;
                tutorSelect.appendChild(option);
            });
        })
        .catch((error) => {
            console.error("Error loading tutors for dropdown: ", error);
        });
}

function saveModule(db, modulesRef) {
    const moduleId = document.getElementById('module-id').value;
    const isEdit = moduleId !== '';
    
    if (!validateModuleForm()) return;
    
    const moduleData = {
        moduleCode: document.getElementById('module-code').value,
        moduleName: document.getElementById('module-name').value,
        credits: parseInt(document.getElementById('module-credits').value),
        assignedTutorId: document.getElementById('module-tutor').value,
        createdAt: isEdit ? 
            firebase.firestore.FieldValue.serverTimestamp() : 
            firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (isEdit) {
        modulesRef.doc(moduleId).update(moduleData)
            .then(() => {
                showAlert('Module updated successfully', 'success');
                document.getElementById('module-modal').style.display = 'none';
                loadModules(db, modulesRef);
            })
            .catch((error) => {
                console.error("Error updating module: ", error);
                showAlert('Error updating module', 'error');
            });
    } else {
        modulesRef.add(moduleData)
            .then(() => {
                showAlert('Module added successfully', 'success');
                document.getElementById('module-modal').style.display = 'none';
                loadModules(db, modulesRef);
            })
            .catch((error) => {
                console.error("Error adding module: ", error);
                showAlert('Error adding module', 'error');
            });
    }
}

function editModule(db, modulesRef, moduleId) {
    modulesRef.doc(moduleId).get()
        .then((doc) => {
            if (!doc.exists) {
                showAlert('Module not found', 'error');
                return;
            }
            
            const module = doc.data();
            document.getElementById('module-modal-title').textContent = 'Edit Module';
            document.getElementById('module-id').value = doc.id;
            document.getElementById('module-code').value = module.moduleCode || '';
            document.getElementById('module-name').value = module.moduleName || '';
            document.getElementById('module-credits').value = module.credits || '';
            document.getElementById('module-tutor').value = module.assignedTutorId || '';
            
            document.getElementById('module-modal').style.display = 'flex';
        })
        .catch((error) => {
            console.error("Error getting module: ", error);
            showAlert('Error loading module data', 'error');
        });
}

function deleteModule(db, modulesRef, moduleId, moduleName) {
    if (confirm(`Are you sure you want to delete module "${moduleName}"?`)) {
        modulesRef.doc(moduleId).delete()
            .then(() => {
                showAlert('Module deleted successfully', 'success');
                loadModules(db, modulesRef);
            })
            .catch((error) => {
                console.error("Error deleting module: ", error);
                showAlert('Error deleting module', 'error');
            });
    }
}

function validateModuleForm() {
    const requiredFields = [
        'module-code', 'module-name', 'module-credits'
    ];
    
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.style.borderColor = 'red';
            isValid = false;
        } else {
            field.style.borderColor = '';
        }
    });
    
    if (!isValid) showAlert('Please fill in all required fields', 'error');
    return isValid;
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}