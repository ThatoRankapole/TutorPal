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
  onAuthStateChanged
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
    const enrolledModulesString = studentData.modules || "";
    const enrolledModules = enrolledModulesString.split(":").filter(Boolean);

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

    moduleSnapshot.forEach((doc) => {
      const data = doc.data();
      const moduleCode = doc.id;

      if (!enrolledModules.includes(moduleCode)) return;

      const consultationNeed = data["consultation-needed"] ? "Yes" : "No";
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
            <li>Performance: ${data.performance}</li>
            <li>Current-Predicate: ${data["current-predicate"]}</li>
            <li>Consultation Needed: ${consultationNeed}</li>
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
