let laws = [];

function loadLaws() {
  fetch('laws.json')
    .then(response => response.json())
    .then(data => {
      laws = data;
      renderLawList();
    })
    .catch(error => {
      console.error("Failed to load laws:", error);
    });
}

function renderLawList() {
  const list = document.getElementById("lawList");
  list.innerHTML = '';

  if (!laws.length) {
    const empty = document.createElement("li");
    empty.textContent = "No laws currently stored.";
    list.appendChild(empty);
    return;
  }

  laws.forEach((law, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${law.name || 'Unnamed Law'} (${law.year || 'N/A'})</strong><br>${law.full_text || 'No content available.'}`;
    list.appendChild(li);
  });
}

function uploadLaw() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a file first.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const newLaw = JSON.parse(e.target.result);
      if (!newLaw.full_text) {
        alert("Invalid law file: missing full_text.");
        return;
      }
      laws.push(newLaw);
      renderLawList();
      alert("Law uploaded locally. Remember to save manually to GitHub.");
    } catch (err) {
      alert("Failed to parse JSON.");
    }
  };
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", loadLaws);
