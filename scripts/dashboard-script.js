function showTab(tabId) {
  var contents = document.getElementsByClassName("tab-content");
  for (var i = 0; i < contents.length; i++) {
    contents[i].classList.remove("active");
  }

  var tabs = document.querySelectorAll(".sidebar nav ul li");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove("active");
  }

  document.getElementById(tabId + "-tab").classList.add("active");

  var clickedTab = document.querySelector('[data-tab="' + tabId + '"]');
  if (clickedTab) {
    clickedTab.classList.add("active");
  }

  // Removed redirectToCalculator and return
}
