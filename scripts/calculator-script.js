import { moduleRef, getDocs, updateDoc, doc as docRef } from './firebase-config.js';

const moduleSelect = document.getElementById('moduleSelect');

// Updated IDs based on your HTML
const selectedQuizzes = document.getElementById('selectedQuizzes');
const selectedAssignments = document.getElementById('selectedAssignments');
const selectedProjects = document.getElementById('selectedProjects');
const selectedClassTests = document.getElementById('selectedClassTests');
const selectedSemesterTests = document.getElementById('selectedSemTests');

// Counters
const numQuizzes = document.getElementById('numQuizzes');
const numAssignments = document.getElementById('numAssignments');
const numProjects = document.getElementById('numProjects');
const numClassTests = document.getElementById('numClassTests');
const numSemTests = document.getElementById('numSemTests');

// Results display elements
const resultsDiv = document.getElementById('results');
const resultsDisplay = document.getElementById('resultsDisplay');

// Calculate button (note the ID changed from 'calculateBtn' to 'calculate')
const calculateBtn = document.getElementById('calculate');

function clearAllTestInputs() {
  if (selectedQuizzes) selectedQuizzes.innerHTML = '';
  if (selectedAssignments) selectedAssignments.innerHTML = '';
  if (selectedProjects) selectedProjects.innerHTML = '';
  if (selectedClassTests) selectedClassTests.innerHTML = '';
  if (selectedSemesterTests) selectedSemesterTests.innerHTML = '';

  if (numQuizzes) numQuizzes.textContent = '0';
  if (numAssignments) numAssignments.textContent = '0';
  if (numProjects) numProjects.textContent = '0';
  if (numClassTests) numClassTests.textContent = '0';
  if (numSemTests) numSemTests.textContent = '0';

  if (resultsDiv) resultsDiv.style.display = 'none';
  if (resultsDisplay) resultsDisplay.textContent = '';
}

function createTestInputRow(type, i, weightText = '', weightValue = 0) {
  return `
    <div class="AddedTestInputs">
      <label>${type} ${i + 1}</label>
      <input class="markInputs" type="number" data-weight="${weightValue}" size="1" min="0" max="100">
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

// Calculate button handler
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
    const mark = parseFloat(inp.value);
    const weight = parseFloat(inp.getAttribute('data-weight'));

    if (!isNaN(mark) && !isNaN(weight)) {
      totalWeightDone += weight;
      weightedScore += (mark / 100) * weight;
    }
  });

  const currentPredicate = weightedScore;
  document.querySelector('.PredicateCalculator').remove();
  // Display results
  if (resultsDiv && resultsDisplay) {
    resultsDiv.style.display = 'block';
    resultsDisplay.innerHTML = `
      <h3>Calculated Predicate for Module "${moduleSelect.selectedOptions[0].textContent}"</h3>
      <p>Weighted Score: ${currentPredicate.toFixed(2)}%</p>
      <p>Total Weight Completed: ${totalWeightDone}%</p>
    `;
  }

  // Optionally update Firestore with results
  try {
    await updateDoc(docRef(moduleRef, selectedModuleId), {
      'completed-work-weight': totalWeightDone,
      'current-predicate': currentPredicate
    });
  } catch (err) {
    console.error('Failed to update predicate:', err);
  }
});
document.querySelector('.resultButtons .homeButton:nth-child(1)').addEventListener('click', () => {
  document.querySelector('#results').style.display = 'none';
  document.querySelector('.PredicateCalculator').style.display = 'block';

  document.querySelector('#moduleSelect').selectedIndex = 0;
  document.querySelector('#numQuizzes').textContent = '0';
  document.querySelector('#numClassTests').textContent = '0';
  document.querySelector('#numAssignments').textContent = '0';
  document.querySelector('#numProjects').textContent = '0';
  document.querySelector('#numSemTests').textContent = '0';

  document.querySelector('#selectedQuizzes').innerHTML = '';
  document.querySelector('#selectedClassTests').innerHTML = '';
  document.querySelector('#selectedAssignments').innerHTML = '';
  document.querySelector('#selectedProjects').innerHTML = '';
  document.querySelector('#selectedSemTests').innerHTML = '';
  document.querySelector('#resultsDisplay').innerHTML = '';
});

document.querySelector('.resultButtons .homeButton:nth-child(2)').addEventListener('click', () => {
  document.querySelector('#results').style.display = 'none';
  document.querySelector('.PredicateCalculator').style.display = 'block';
});
document.querySelector('#view').addEventListener('click', async () => {
  document.querySelector('.PredicateCalculator').style.display = 'none';
  document.querySelector('#results').style.display = 'block';

  const resultsContainer = document.querySelector('#resultsDisplay');
  resultsContainer.innerHTML = 'Loading...';

  try {
    const snapshot = await getDocs(moduleRef);

    if (snapshot.empty) {
      resultsContainer.innerHTML = 'No modules found.';
      return;
    }

    let resultsHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const moduleName = data["module-name"] || "Unnamed Module";
      const predicate = data["current-predicate"] || 0;
      resultsHTML += `${moduleName}: ${predicate}%<br>`;
    });
    resultsContainer.innerHTML = resultsHTML;

  } catch (error) {
    console.error("Error fetching module data:", error);
    resultsContainer.innerHTML = 'Failed to load results.';
  }
});



populateModules();
