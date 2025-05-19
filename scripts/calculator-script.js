import {
  db,
  moduleRef,
  query,
  getDocs,
  where,
  updateDoc,
  doc
} from './firebase-config.js';

// Global variables
let subjects = [];

// Add styles for calculator inputs
const inputStyles = `
  .AddedTestInputs {
    display: flex;
    align-items: center;
    margin-top: 6px;
    text-align: right;
  }
  .AddedTestInputs label {
    padding-right: 39px;
    flex: 1;
  }
  .AddedTestInputs input {
    margin-left: 5px;
    width: 60px;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
`;

// Add the styles to the head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = inputStyles;
document.head.appendChild(styleSheet);

// Initialize calculator and load predicates from database
async function initializeCalculator() {
  const resultsDiv = document.getElementById('results');
  if (resultsDiv) {
    resultsDiv.style.display = 'none';
  }
  await loadPredicatesFromDatabase();
}

// Load existing predicates from database
async function loadPredicatesFromDatabase() {
  try {
    const querySnapshot = await getDocs(moduleRef);
    subjects = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        name: data["module-code"] || data["module-name"] || "Unknown",
        predicate: data["current-predicate"] || 0
      };
    });
  } catch (error) {
    console.error("Error loading predicates:", error);
  }
}

// Dynamic input generation based on number of tests
function numberOfTests() {
  const activeElementId = document.activeElement.id;

  if (activeElementId === 'revealQuizzesInput') {
    const numTests = parseInt(document.getElementById('numQuizzes').value) || 0;
    const selectedQuizzes = document.getElementById('selectedQuizzes');
    if (selectedQuizzes) {
      selectedQuizzes.innerHTML = '';

      for (let i = 1; i <= numTests; i++) {
        selectedQuizzes.innerHTML += `
          <div class="AddedTestInputs">
            <label>Quiz ${i}</label>
            <input class="markInputs" type="number" id="quiz${i}" min="0" max="100" placeholder="Mark %">
            <input class="markInputs" type="number" id="quizWeight${i}" min="0" max="100" placeholder="Weight %">
          </div>`;
      }
    }
  }
  else if (activeElementId === 'revealClassTestInput') {
    const numTests = parseInt(document.getElementById('numClassTests').value) || 0;
    const selectedClassTests = document.getElementById('selectedClassTests');
    if (selectedClassTests) {
      selectedClassTests.innerHTML = '';

      for (let i = 1; i <= numTests; i++) {
        selectedClassTests.innerHTML += `
          <div class="AddedTestInputs">
            <label>Class Test ${i}</label>
            <input class="markInputs" type="number" id="classTest${i}" min="0" max="100" placeholder="Mark %">
            <input class="markInputs" type="number" id="classTestWeight${i}" min="0" max="100" placeholder="Weight %">
          </div>`;
      }
    }
    const assignmentsDiv = document.getElementById('assignments');
    if (assignmentsDiv) {
      assignmentsDiv.style.display = 'flex';
    }
  }
  else if (activeElementId === 'revealAssignmentInput') {
    const numAssignments = parseInt(document.getElementById('numAssignments').value) || 0;
    const selectedAssignments = document.getElementById('selectedAssignments');
    if (selectedAssignments) {
      selectedAssignments.innerHTML = '';

      for (let i = 1; i <= numAssignments; i++) {
        selectedAssignments.innerHTML += `
          <div class="AddedTestInputs">
            <label>Assignment ${i}</label>
            <input class="markInputs" type="number" id="assignment${i}" min="0" max="100" placeholder="Mark %">
            <input class="markInputs" type="number" id="assignmentWeight${i}" min="0" max="100" placeholder="Weight %">
          </div>`;
      }
    }
    const semesterTestsDiv = document.getElementById('semesterTests');
    if (semesterTestsDiv) {
      semesterTestsDiv.style.display = 'flex';
    }
  }
  else if (activeElementId === 'revealSemTestsInput') {
    const numSemTests = parseInt(document.getElementById('numSemTests').value) || 0;
    const selectedSemTests = document.getElementById('selectedSemTests');
    if (selectedSemTests) {
      selectedSemTests.innerHTML = '';

      for (let i = 1; i <= numSemTests; i++) {
        selectedSemTests.innerHTML += `
          <div class="AddedTestInputs">
            <label>Semester Test ${i}</label>
            <input class="markInputs" type="number" id="semTest${i}" min="0" max="100" placeholder="Mark %">
            <input class="markInputs" type="number" id="semTestWeight${i}" min="0" max="100" placeholder="Weight %">
          </div>`;
      }
    }
  }
}

// Calculate predicate mark
async function calculate() {
  let predicate = 0;
  let totalWeight = 0;
  const subjectName = document.getElementById('subjectName')?.value.trim();

  if (!subjectName) {
    alert('Please enter a subject name/code');
    return;
  }

  // Calculate for each assessment type
  const calculations = [
    { type: 'quiz', countId: 'numQuizzes' },
    { type: 'classTest', countId: 'numClassTests' },
    { type: 'assignment', countId: 'numAssignments' },
    { type: 'semTest', countId: 'numSemTests' }
  ];

  for (const calc of calculations) {
    const countInput = document.getElementById(calc.countId);
    const count = countInput ? parseInt(countInput.value) || 0 : 0;

    for (let i = 1; i <= count; i++) {
      const markInput = document.getElementById(`${calc.type}${i}`);
      const weightInput = document.getElementById(`${calc.type}Weight${i}`);

      if (!markInput || !weightInput) continue;

      const mark = parseFloat(markInput.value);
      const weight = parseFloat(weightInput.value);

      if (isNaN(mark)) {
        alert(`Please enter mark for ${calc.type.replace(/([A-Z])/g, ' $1')} ${i}`);
        return;
      }

      if (isNaN(weight)) {
        alert(`Please enter weight for ${calc.type.replace(/([A-Z])/g, ' $1')} ${i}`);
        return;
      }

      predicate += (mark * weight) / 100;
      totalWeight += weight;
    }
  }

  // Validate total weight
  if (totalWeight !== 100) {
    alert(`Total weight must be 100% (current: ${totalWeight}%)`);
    return;
  }

  const finalPredicate = predicate.toFixed(2);

  // Update or add subject
  const existingIndex = subjects.findIndex(s => s.name === subjectName);
  if (existingIndex !== -1) {
    subjects[existingIndex].predicate = finalPredicate;
  } else {
    subjects.push({
      name: subjectName,
      predicate: finalPredicate
    });
  }

  // Update database if subject code matches
  await updatePredicateOnDatabase(subjectName, finalPredicate);
  await loadPredicatesFromDatabase();
  viewResultsButton();
}

async function updatePredicateOnDatabase(subjectName, finalPredicate) {
  try {
    const q = query(moduleRef, where("module-code", "==", subjectName));
    const querySnapshot = await getDocs(q);

    for (const document of querySnapshot.docs) {
      const docId = document.id;
      const moduleDocRef = doc(db, "Modules", docId);

      await updateDoc(moduleDocRef, {
        "current-predicate": parseFloat(finalPredicate)
      });

      alert("Predicate updated successfully");
    }
  } catch (error) {
    console.error("Error updating predicate:", error);
    alert("Error updating predicate");
  }
}

// View management functions
function viewResultsButton() {
  const resultsDiv = document.getElementById('resultsDisplay');
  const resultsContainer = document.querySelector('#results');
  const calculatorContainer = document.querySelector('.PredicateCalculator');

  if (resultsDiv && resultsContainer && calculatorContainer) {
    resultsDiv.innerHTML = subjects.length === 0
      ? '<p>No results found</p>'
      : subjects.map(subject =>
          `<p><strong>${subject.name}:</strong> ${subject.predicate}%</p>`
        ).join('');

    resultsContainer.style.display = 'block';
    calculatorContainer.style.display = 'none';
  }
}

function reset() {
  const subjectNameInput = document.getElementById('subjectName');
  const selectedQuizzes = document.getElementById('selectedQuizzes');
  const selectedClassTests = document.getElementById('selectedClassTests');
  const selectedAssignments = document.getElementById('selectedAssignments');
  const selectedSemTests = document.getElementById('selectedSemTests');
  const numQuizzes = document.getElementById('numQuizzes');
  const numClassTests = document.getElementById('numClassTests');
  const numAssignments = document.getElementById('numAssignments');
  const numSemTests = document.getElementById('numSemTests');
  const assignmentsDiv = document.getElementById('assignments');
  const semesterTestsDiv = document.getElementById('semesterTests');
  const resultsContainer = document.querySelector('#results');
  const calculatorContainer = document.querySelector('.PredicateCalculator');

  if (subjectNameInput) subjectNameInput.value = '';
  if (selectedQuizzes) selectedQuizzes.innerHTML = '';
  if (selectedClassTests) selectedClassTests.innerHTML = '';
  if (selectedAssignments) selectedAssignments.innerHTML = '';
  if (selectedSemTests) selectedSemTests.innerHTML = '';
  if (numQuizzes) numQuizzes.value = '';
  if (numClassTests) numClassTests.value = '';
  if (numAssignments) numAssignments.value = '';
  if (numSemTests) numSemTests.value = '';
  if (assignmentsDiv) assignmentsDiv.style.display = 'none';
  if (semesterTestsDiv) semesterTestsDiv.style.display = 'none';
  if (resultsContainer) resultsContainer.style.display = 'none';
  if (calculatorContainer) calculatorContainer.style.display = 'block';
}

function back() {
  const resultsContainer = document.querySelector('#results');
  const calculatorContainer = document.querySelector('.PredicateCalculator');

  if (resultsContainer && calculatorContainer) {
    resultsContainer.style.display = 'none';
    calculatorContainer.style.display = 'block';
  }
}

// Make functions available globally
window.numberOfTests = numberOfTests;
window.calculateButton = calculate;
window.viewResultsButton = viewResultsButton;
window.reset = reset;
window.back = back;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeCalculator();
});