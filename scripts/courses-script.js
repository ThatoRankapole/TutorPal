// scripts/courses-script.js
import {
  db,
  moduleRef,
  tutorsRef,
  getDocs
} from './firebase-config.js';

// Fetch and display courses
async function loadCourses() {
  try {
    const [moduleSnapshot, tutorSnapshot] = await Promise.all([
      getDocs(moduleRef),
      getDocs(tutorsRef)
    ]);

    const courseListContainer = document.getElementById("course-list");
    courseListContainer.innerHTML = "";

    const tutors = tutorSnapshot.docs.map(doc => doc.data());

    moduleSnapshot.forEach((doc) => {
      const data = doc.data();
      const moduleName = data["module-code"];
      let consultationNeed = data["consultation-needed"] ? "Yes" : "No";

      const tutor = tutors.find(t => t["module-code"] === moduleName);
      const tutorNames = tutor ? tutor["name"] + " " + tutor["surname"] : "Unassigned";

      const courseCard = document.createElement("div");
      courseCard.className = "course-card";

      courseCard.innerHTML = `
        <div class="course-header">
          <h3>${data["module-name"]}</h3>
          <span class="course-code">${data["module-code"]}</span>
        </div>
        <div class="course-modules">
          <h4>Details:</h4>
          <ul>
            <li>Performance: ${data.performance}</li>
            <li>Current-Predicate: ${data["current-predicate"]}</li>
            <li>Consultation Needed: ${consultationNeed}</li>
          </ul>
        </div>
        <div class="course-tutor">
          <p>Tutor: ${tutor ? tutorNames : "Unassigned"}
          ${tutor ? `<a href="mailto:${tutor.email}?subject=feedback">email me</a>` : ""}</p>
        </div>
      `;

      courseListContainer.appendChild(courseCard);
    });
  } catch (error) {
    console.error("Error loading courses:", error);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadCourses();
});