import {
  db,
  moduleRef,
  tutorsRef,
  getDocs,
  getDoc,
  doc,
  auth,
  collection,
  query,
  where,
  onAuthStateChanged,
  updateDoc
} from './firebase-config.js';

// Fetch and display courses for the logged-in student
async function loadCoursesForUser(user) {
  try {
    const userEmail = user.email;

    // Query Student document by email
    const studentQuery = query(collection(db, "Student"), where("student-email", "==", userEmail));
    const studentSnapshot = await getDocs(studentQuery);

    if (studentSnapshot.empty) {
      console.error("Student document not found for email:", userEmail);
      return;
    }

    const studentDoc = studentSnapshot.docs[0];
    const studentData = studentDoc.data();
    
    const enrolledModulesString = [];
    const modules = [];
    for (let [key, value] of Object.entries(studentData.modules)) {
      enrolledModulesString.push(`${key}${value}`)
      modules.push(`${key}`)
    }
    const enrolledModules = enrolledModulesString;

    if (enrolledModules.length === 0) {
      document.getElementById("course-list").innerHTML = "<p>No modules found.</p>";
      return;
    }

    const [moduleSnapshot, tutorSnapshot] = await Promise.all([
      getDocs(moduleRef),
      getDocs(tutorsRef)
    ]);

    const courseListContainer = document.getElementById("course-list");
    courseListContainer.innerHTML = "";

    const tutors = tutorSnapshot.docs.map(doc => doc.data());

    moduleSnapshot.forEach(async (modDoc) => {
      const data = modDoc.data();
      const moduleCode = modDoc.id;

      console.log(moduleCode)
      if (!modules.includes(moduleCode)) return;

      // Predicate Calculation Logic
      const completedWork = data["completed-work-weight"] || 0;
      const currentPredicate = data["current-predicate"] || 0;

      let overallMark = (currentPredicate / completedWork) * 100;

      let consultationNeeded = false;
      let performance = "";

      if (overallMark < 50) {
        consultationNeeded = true;
        performance = "bad";
      } else if (overallMark >= 50 && overallMark < 75) {
        consultationNeeded = false;
        performance = "good";
      } else if (overallMark >= 75 && overallMark <= 100) {
        consultationNeeded = false;
        performance = "excellent";
      }

      // Persist updated fields to Firestore including current-predicate
      await updateDoc(doc(moduleRef, moduleCode), {
        "consultation-needed": consultationNeeded,
        "performance": performance,
        "current-predicate": currentPredicate
      });

      // Update local data for rendering
      data["consultation-needed"] = consultationNeeded;
      data.performance = performance;
      data["current-predicate"] = currentPredicate;

      const consultationNeedText = consultationNeeded ? "Yes" : "No";
      const tutor = tutors.find(t => t["module-code"] === moduleCode);
      const tutorNames = tutor ? `${tutor["name"]} ${tutor["surname"]}` : "Unassigned";

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
            <li>Performance: ${performance}</li>
            <li>Current-Predicate: ${currentPredicate}%</li>
            <li>Completed Work: ${completedWork}%</li>
            <li>Consultation Needed: ${consultationNeedText}</li>
          </ul>
        </div>
        <div class="course-tutor">
          <p>Tutor: ${tutorNames}
          ${tutor ? `<a href="mailto:${tutor.email}?subject=feedback">email me</a>` : ""}</p>
        </div>
      `;

      courseListContainer.appendChild(courseCard);
    });
  } catch (error) {
    console.error("Error loading courses:", error);
  }
}

// Wait for auth state to initialize
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadCoursesForUser(user);
    } else {
      console.error("No user is signed in.");
    }
  });
});
