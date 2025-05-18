let today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();

  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
  const eventData = [];
  function generateCalendar(month, year) {
    const firstDay = new Date(year, month).getDay();
    const daysInMonth = 32 - new Date(year, month, 32).getDate();

    const calendarBody = document.getElementById("calendar-body");
    calendarBody.innerHTML = "";

    document.getElementById("month-year").textContent = `${monthNames[month]} ${year}`;

    let date = 1;
    for (let i = 0; i < 6; i++) {
      const row = document.createElement("tr");

      for (let j = 0; j < 7; j++) {
        const cell = document.createElement("td");

        if (i === 0 && j < firstDay) {
          cell.textContent = "";
        } else if (date > daysInMonth) {
          break;
        } else {
          cell.textContent = date;
          if (date === today.getDate() && year === today.getFullYear() && month === today.getMonth()) {
            cell.classList.add("today");
          }
          date++;
        }

        row.appendChild(cell);
      }

      calendarBody.appendChild(row);
    }
  }

  function changeMonth(offset) {
    currentMonth += offset;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    } else if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    generateCalendar(currentMonth, currentYear);
  }

  generateCalendar(currentMonth, currentYear);


  document.addEventListener("DOMContentLoaded", () => {
    generateCalendar(currentMonth, currentYear);

    // Modal controls
    const modal = document.getElementById("event-modal");
    const openBtn = document.getElementById("add-event-btn");
    const closeBtn = document.getElementById("close-modal");
    const saveBtn = document.getElementById("save-event-btn");

    openBtn.onclick = () => modal.style.display = "block";
    closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = e => { if (e.target === modal) modal.style.display = "none"; }

    saveBtn.onclick = () => {
      const name = document.getElementById("event-name").value.trim();
      const date = document.getElementById("event-date").value;
      const description = document.getElementById("event-description").value.trim();

      if (name && date) {
        eventData.push({ name, date, description });
        modal.style.display = "none";
        generateCalendar(currentMonth, currentYear); // refresh calendar
        document.getElementById("event-name").value = "";
        document.getElementById("event-date").value = "";
        document.getElementById("event-description").value = "";
      } else {
        alert("Please fill in the name and date.");
      }
    };
  });

  function generateCalendar(month, year) {
    const firstDay = new Date(year, month).getDay();
    const daysInMonth = 32 - new Date(year, month, 32).getDate();
    const calendarBody = document.getElementById("calendar-body");
    calendarBody.innerHTML = "";
    document.getElementById("month-year").textContent = `${monthNames[month]} ${year}`;

    let date = 1;
    for (let i = 0; i < 6; i++) {
      const row = document.createElement("tr");

      for (let j = 0; j < 7; j++) {
        const cell = document.createElement("td");

        if (i === 0 && j < firstDay) {
          cell.textContent = "";
        } else if (date > daysInMonth) {
          break;
        } else {
  const thisDate = new Date(year, month, date);
  const formatted = thisDate.toISOString().split("T")[0];
  cell.textContent = date;

  if (eventData.find(e => e.date === formatted)) {
    cell.classList.add("event-day");
    cell.title = eventData.find(e => e.date === formatted).name;
    // Add this click handler:
    cell.onclick = function() {
      showEventsForDate(formatted);
    };
  }

  if (
    date === today.getDate() &&
    year === today.getFullYear() &&
    month === today.getMonth()
  ) {
    cell.classList.add("today");
  }
  date++;
}

        row.appendChild(cell);
      }

      calendarBody.appendChild(row);
    }
  }
