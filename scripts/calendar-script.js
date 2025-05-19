let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const eventData = [];

function generateCalendar(month, year) {
    const firstDay = new Date(year, month).getDay();
    const daysInMonth = 32 - new Date(year, month, 32).getDate();
    const calendarBody = document.getElementById("calendar-body");
    if (!calendarBody) return;
    
    calendarBody.innerHTML = "";
    const monthYearElement = document.getElementById("month-year");
    if (monthYearElement) monthYearElement.textContent = `${monthNames[month]} ${year}`;

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

                const event = eventData.find(e => e.date === formatted);
                if (event) {
                    cell.classList.add("event-day");
                    cell.title = event.name;
                    cell.onclick = function() {
                        showEventsForDate(formatted);
                    };
                }

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

function showEventsForDate(date) {
    const events = eventData.filter(e => e.date === date);
    if (events.length > 0) {
        alert(`Events for ${date}:\n${events.map(e => `${e.name}: ${e.description || 'No description'}`).join('\n')}`);
    } else {
        alert(`No events found for ${date}`);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    generateCalendar(currentMonth, currentYear);

    const modal = document.getElementById("event-modal");
    const openBtn = document.getElementById("add-event-btn");
    const closeBtn = document.getElementById("close-modal");
    const saveBtn = document.getElementById("save-event-btn");

    if (openBtn) openBtn.onclick = () => modal.style.display = "block";
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = e => { if (e.target === modal) modal.style.display = "none"; }

    if (saveBtn) saveBtn.onclick = () => {
        const nameInput = document.getElementById("event-name");
        const dateInput = document.getElementById("event-date");
        const descInput = document.getElementById("event-description");

        const name = nameInput ? nameInput.value.trim() : '';
        const date = dateInput ? dateInput.value : '';
        const description = descInput ? descInput.value.trim() : '';

        if (name && date) {
            eventData.push({ name, date, description });
            modal.style.display = "none";
            generateCalendar(currentMonth, currentYear);
            if (nameInput) nameInput.value = "";
            if (dateInput) dateInput.value = "";
            if (descInput) descInput.value = "";
        } else {
            alert("Please fill in the name and date.");
        }
    };
});

window.changeMonth = changeMonth;