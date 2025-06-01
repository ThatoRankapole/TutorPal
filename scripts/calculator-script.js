import {
  db,
  moduleRef,
  tutorsRef,
  studentRef,
  getDocs,
  updateDoc,
  doc as docRef,
  query,
  where,
  auth,
  onAuthStateChanged
} from './firebase-config.js';

const moduleSelect = document.getElementById('moduleSelect');
const selectedQuizzes = document.getElementById('selectedQuizzes');
const selectedAssignments = document.getElementById('selectedAssignments');
const selectedProjects = document.getElementById('selectedProjects');
const selectedClassTests = document.getElementById('selectedClassTests');
const selectedSemesterTests = document.getElementById('selectedSemTests');
const numQuizzes = document.getElementById('numQuizzes');
const numAssignments = document.getElementById('numAssignments');
const numProjects = document.getElementById('numProjects');
const numClassTests = document.getElementById('numClassTests');
const numSemTests = document.getElementById('numSemTests');
const resultsDiv = document.getElementById('results');
const resultsDisplay = document.getElementById('resultsDisplay');
const calculateBtn = document.getElementById('calculate');


function clearAllTestInputs() {
  selectedQuizzes.innerHTML = '';
  selectedAssignments.innerHTML = '';
  selectedProjects.innerHTML = '';
  selectedClassTests.innerHTML = '';
  selectedSemesterTests.innerHTML = '';
  numQuizzes.textContent = '0';
  numAssignments.textContent = '0';
  numProjects.textContent = '0';
  numClassTests.textContent = '0';
  numSemTests.textContent = '0';
  resultsDiv.style.display = 'none';
  resultsDisplay.textContent = '';
}

function createTestInputRow(type, i, weightText = '', weightValue = 0) {
  return `
    <div class="AddedTestInputs">
      <label>${type} ${i + 1}</label>
      <input class="markInputs" type="number" data-weight="${weightValue}" size="1" min="0" max="100" step="1">
      ${weightText ? `<span class="weightDisplay">Weight: ${weightText}%</span>` : ''} 
    </div>`;
}

function parseWeights(weightString) {
  if (!weightString) return [];
  return weightString.split(':').map(w => parseFloat(w.trim()));
}

async function populateModules() {
  try {
    const querySnapshot = await getDocs(moduleRef);
    moduleSelect.innerHTML = '<option value="" disabled selected>Select a module</option>';
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const moduleName = data['module-name'] || doc.id;
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = moduleName;
      moduleSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
  }
}

moduleSelect.addEventListener('change', async (e) => {
  const selectedModuleId = e.target.value;
  clearAllTestInputs();
  try {
    const querySnapshot = await getDocs(moduleRef);
    const doc = querySnapshot.docs.find(d => d.id === selectedModuleId);
    if (!doc) return;
    const data = doc.data();
    const groups = [
      { type: 'Quiz', count: Number(data.quzzes || 0), weights: parseWeights(data['quiz-weights']), element: selectedQuizzes, counter: numQuizzes },
      { type: 'Assignment', count: Number(data.assignments || 0), weights: parseWeights(data['assignment-weights']), element: selectedAssignments, counter: numAssignments },
      { type: 'Project', count: Number(data.projects || 0), weights: parseWeights(data['project-weights']), element: selectedProjects, counter: numProjects },
      { type: 'Class test', count: Number(data['class-tests'] || 0), weights: parseWeights(data['class-test-weights']), element: selectedClassTests, counter: numClassTests },
      { type: 'Semester test', count: Number(data['semester-tests'] || 0), weights: parseWeights(data['semester-test-weights']), element: selectedSemesterTests, counter: numSemTests },
    ];
    for (const group of groups) {
      const { type, count, weights, element, counter } = group;
      if (count > 0 && element) {
        if (counter) counter.textContent = count;
        for (let i = 0; i < count; i++) {
          const weight = weights[i] || 0;
          element.innerHTML += createTestInputRow(type, i, weight.toString(), weight);
        }
      }
    }
  } catch (error) {
    console.error('Error loading module data:', error);
  }
});

calculateBtn.addEventListener('click', async () => {
  const selectedModuleId = moduleSelect.value;
  if (!selectedModuleId) {
    alert('Please select a module first.');
    return;
  }

  const allInputs = document.querySelectorAll('.markInputs');
  let totalWeightDone = 0;
  let weightedScore = 0;
  allInputs.forEach(inp => {
    const mark = parseInt(inp.value);
    const weight = parseFloat(inp.getAttribute('data-weight'));
    if (!isNaN(mark) && !isNaN(weight)) {
      totalWeightDone += weight;
      weightedScore += (mark / 100) * weight;
    }
  });

  const currentPredicate = (weightedScore * 100 / totalWeightDone);
  try {
    const user = auth.currentUser;
    
    if (!user) throw new Error('User not authenticated');
    const q = query(studentRef, where('student-email', '==', user.email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) throw new Error('No student document found');
    const studentDocSnap = querySnapshot.docs[0];
    const studentDocId = studentDocSnap.id;
    const studentDoc = docRef(studentRef, studentDocId);
    let currentModules = studentDocSnap.data().modules || '';
    const modulesArray = currentModules.split(':').map(m => m.trim()).filter(m => m);
    let found = false;
    const updatedArray = modulesArray.map(m => {
      if (m.startsWith(`${selectedModuleId}(`)) {
        found = true;
        const match = m.match(/\((\d+\.?\d*),\s*(yes|no),\s*(bad|good|excellent)\)/i);
        let consultationNeeded = "no";
        let performance = "good";
        if (currentPredicate < 50) {
          consultationNeeded = "yes";
          performance = "bad";
        } else if (currentPredicate >= 75) {
          performance = "excellent";
        }
        return `${selectedModuleId}(${(currentPredicate.toFixed(2) / 100) * totalWeightDone}, ${consultationNeeded}, ${performance})`;
      }
      return m;
    });
    if (!found) {
      updatedArray.push(`${selectedModuleId}(${currentPredicate.toFixed(2)}, yes, good)`);
    }
    const updatedModuleString = updatedArray.join(':');
    await updateDoc(studentDoc, {
      modules: updatedModuleString
    });

    document.querySelector('.PredicateCalculator').style.display = 'none';
    resultsDiv.style.display = 'block';
    const resultsContainer = resultsDisplay;
    resultsContainer.innerHTML = 'Loading...';

    const studentSnapshot = await getDocs(query(studentRef, where('student-email', '==', user.email)));
    
    if (studentSnapshot.empty) {
      resultsContainer.innerHTML = 'Student document not found.';
      return;
    }
    const updatedStudentData = studentSnapshot.docs[0].data();
    const enrolledModulesString = updatedStudentData.modules || "";
    const enrolledModules = enrolledModulesString.split(":").filter(Boolean);
    if (enrolledModules.length === 0) {
      resultsContainer.innerHTML = '<p>No modules found.</p>';
      return;
    }
    const moduleSnapshot = await getDocs(moduleRef);
    let resultsHTML = '';
    enrolledModules.forEach((studentModuleEntry) => {
      const match = studentModuleEntry.match(/^([^()]+)\((\d+\.?\d*),\s*(yes|no),\s*(bad|good|excellent)\)$/i);
      if (!match) return;
      const moduleId = match[1];
      const predicate = parseFloat(match[2]);
      const consultation = match[3];
      const performance = match[4];
      const moduleDoc = moduleSnapshot.docs.find(doc => doc.id === moduleId);
      if (!moduleDoc) return;
      const moduleData = moduleDoc.data();
      const moduleName = moduleData['module-name'];
      const workDone = moduleId === selectedModuleId ? totalWeightDone.toFixed(2) + '%' : 'Not Available';
      resultsHTML += `
        <div class="module-predicate">
          <h4>${moduleName}</h4>
          <p>Predicate: ${predicate.toFixed(2)}%</p>
          <p>Work Done: ${workDone}</p>
          <p>Consultation Needed: ${consultation}</p>
          <p>Performance: ${performance}</p>
        </div>`;
    });
    resultsContainer.innerHTML = resultsHTML;

  } catch (err) {
    console.error('Failed to store or display predicate:', err);
  }
});

document.querySelector('.resultButtons .homeButton:nth-child(1)').addEventListener('click', () => {
  resultsDiv.style.display = 'none';
  document.querySelector('.PredicateCalculator').style.display = 'block';
  moduleSelect.selectedIndex = 0;
  numQuizzes.textContent = '0';
  numClassTests.textContent = '0';
  numAssignments.textContent = '0';
  numProjects.textContent = '0';
  numSemTests.textContent = '0';
  selectedQuizzes.innerHTML = '';
  selectedClassTests.innerHTML = '';
  selectedAssignments.innerHTML = '';
  selectedProjects.innerHTML = '';
  selectedSemesterTests.innerHTML = '';
  resultsDisplay.innerHTML = '';
});

document.querySelector('.resultButtons .homeButton:nth-child(2)').addEventListener('click', () => {
  resultsDiv.style.display = 'none';
  document.querySelector('.PredicateCalculator').style.display = 'block';
});
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userEmail = user.email;
    const studentQuery = query(studentRef, where("student-email", "==", userEmail));
    const studentSnapshot = await getDocs(studentQuery);
    const studentDoc = studentSnapshot.docs[0];
    const studentData = studentDoc.data();
    
    document.getElementById('student-names').textContent = `${studentData.name} ${studentData.surname}`;
  } else {
    console.error("User not signed in.");
  }
});

document.querySelector('#view').addEventListener('click', async () => {
  document.querySelector('.PredicateCalculator').style.display = 'none';
  resultsDiv.style.display = 'block';
  const resultsContainer = resultsDisplay;
  resultsContainer.innerHTML = 'Loading...';
  try {
    const user = auth.currentUser;
    if (!user) {
      resultsContainer.innerHTML = 'No user signed in.';
      return;
    }
    const studentQuery = query(studentRef, where('student-email', '==', user.email));
    const studentSnapshot = await getDocs(studentQuery);
    if (studentSnapshot.empty) {
      resultsContainer.innerHTML = 'Student document not found.';
      return;
    }
    const studentDocSnap = studentSnapshot.docs[0];
    const studentData = studentDocSnap.data();
    const enrolledModulesString = studentData.modules || "";
    const enrolledModules = enrolledModulesString.split(":").filter(Boolean);
    if (enrolledModules.length === 0) {
      resultsContainer.innerHTML = '<p>No modules found.</p>';
      return;
    }
    const moduleSnapshot = await getDocs(moduleRef);
    let resultsHTML = '';
    enrolledModules.forEach((studentModuleEntry) => {
      const match = studentModuleEntry.match(/^([^()]+)\((\d+\.?\d*),\s*(yes|no),\s*(bad|good|excellent)\)$/i);
      if (!match) return;
      const moduleId = match[1];
      const predicate = parseFloat(match[2]);
      const consultation = match[3];
      const performance = match[4];
      const moduleDoc = moduleSnapshot.docs.find(doc => doc.id === moduleId);
      if (!moduleDoc) return;
      const moduleData = moduleDoc.data();
      const moduleName = moduleData['module-name'];
      const workDone = moduleData['completed-work-weight'];
      resultsHTML += `
        <div class="module-predicate">
          <h4>${moduleName}</h4>
          <p>Predicate: ${predicate.toFixed(2)}%</p>
          <p>Work Done: ${workDone}%</p>
          <p>Consultation Needed: ${consultation}</p>
          <p>Performance: ${performance}</p>
        </div>`;
    });
    resultsContainer.innerHTML = resultsHTML;
  } catch (err) {
    console.error('Failed to view predicate results:', err);
    resultsContainer.innerHTML = 'An error occurred while fetching predicate data.';
  }
});

populateModules();
