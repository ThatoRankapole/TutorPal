import {
  db,
  moduleRef,
  tutorsRef,
  studentRef,
  getDocs,
  auth,
  collection,
  query,
  where,
  onAuthStateChanged
} from './firebase-config.js';

async function loadCoursesForUser(user) {
  try {
    const userEmail = user.email;

    const studentQuery = query(collection(db, "Student"), where("student-email", "==", userEmail));
    const studentSnapshot = await getDocs(studentQuery);

    if (studentSnapshot.empty) {
      console.error("Student document not found for email:", userEmail);
      document.getElementById("course-list").innerHTML = "<p>No student data found.</p>";
      return;
    }

    const studentDoc = studentSnapshot.docs[0];
    const studentData = studentDoc.data();

    document.getElementById('student-names').textContent = `${studentData.name} ${studentData.surname}`;
    const enrolledModulesString = studentData.modules || "";
    const enrolledModules = enrolledModulesString.split(":").filter(Boolean);

    if (enrolledModules.length === 0) {
      document.getElementById("course-list").innerHTML = "<p>No modules found.</p>";
      return;
    }

    // Fetch all modules and tutors from Firestore
    const [moduleSnapshot, tutorSnapshot] = await Promise.all([
      getDocs(moduleRef),
      getDocs(tutorsRef)
    ]);

    const courseListContainer = document.getElementById("course-list");
    courseListContainer.innerHTML = "";

    // Convert tutors to array of data objects
    const tutors = tutorSnapshot.docs.map(doc => doc.data());

    // Convert moduleSnapshot to a map of moduleCode => moduleData (uppercase keys)
    const moduleMap = {};
    moduleSnapshot.forEach(doc => {
      moduleMap[doc.id.trim().toUpperCase()] = doc.data();
    });

    // Process each enrolled module
    enrolledModules.forEach(entry => {
      const match = entry.match(/^([A-Z0-9]+)\((\d+(?:\.\d+)?),\s*(yes|no),\s*(bad|good|excellent)\)$/i);
      if (!match) return;

      const moduleCode = match[1].trim().toUpperCase();
      const predicate = parseFloat(match[2]);
      const consultationNeeded = match[3];
      const performance = match[4];

      const moduleData = moduleMap[moduleCode];
      if (!moduleData) return;

      const consultationNeedText = consultationNeeded.charAt(0).toUpperCase() + consultationNeeded.slice(1);
      const completedWork = moduleData["completed-work-weight"] || 0;

      // Find tutor with matching module
      const tutor = tutors.find(t => {
        const tutorModules = t["modules"];
        if (!tutorModules) return false;

        if (typeof tutorModules === "string") {
          return tutorModules.split(":").includes(moduleCode);
        } else if (Array.isArray(tutorModules)) {
          return tutorModules.includes(moduleCode);
        } else {
          return false;
        }
      });

      const tutorNames = tutor ? `${tutor["firstname"]} ${tutor["lastname"]}` : "Unassigned";

      const courseCard = document.createElement("div");
      courseCard.className = "course-card";

      courseCard.innerHTML = `
        <div class="course-header">
          <h3>${moduleData["module-name"]}</h3>
          <span class="course-code">${moduleCode}</span>
        </div>
        <div class="course-modules">
          <h4>Details:</h4>
          <ul>
            <li>Performance: ${performance}</li>
            <li>Current-Predicate: ${predicate}%</li>
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
    document.getElementById("course-list").innerHTML = "<p>Error loading courses.</p>";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadCoursesForUser(user);
    } else {
      console.error("No user is signed in.");
      document.getElementById("course-list").innerHTML = "<p>Please sign in to view courses.</p>";
    }
  });
});
