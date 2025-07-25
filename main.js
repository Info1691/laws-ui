let laws = [];

function loadLaws() {
  fetch('laws.json')
    .then(response => response.json())
    .then(data => {
      laws = Array.isArray(data) ? data : [data];
      renderLawList();
    })
    .catch(error => console.error("Failed to load laws:", error));
}

function renderLawList() {
  const list = document.getElementById("lawList");
  list.innerHTML = '';

  if (!laws.length) {
    list.innerHTML = "<li>No laws available.</li>";
    return;
  }

  laws.forEach((law) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${law.title || 'Untitled Law'} (${law.year || 'N/A'})</strong><br/>
      <em>Jurisdiction:</em> ${law.jurisdiction || 'Unknown'}<br/>
      <em>Reference:</em> ${law.reference || 'N/A'}<br/>
      <em>Source:</em> <a href="${law.source}" target="_blank">${law.source}</a><br/>
      <em>Applies To:</em> ${law.applies_to || ''}<br/>
      <em>Key Provisions:</em> ${law.key_provisions || ''}<br/>
      <em>Breaches:</em> ${law.breaches?.join(', ') || ''}<br/>
      <em>Summary:</em> ${law.summary || ''}<br/>
    `;
    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", loadLaws);
