async function loadLaws() {
  const response = await fetch("laws.json");
  const laws = await response.json();
  const lawList = document.getElementById("lawList");

  laws.forEach((law, index) => {
    const li = document.createElement("li");
    li.textContent = `${law.name} (${law.year})`;
    li.addEventListener("click", () => displayLawDetails(law));
    lawList.appendChild(li);
  });
}

async function displayLawDetails(law) {
  const response = await fetch(law.full_text_file);
  const fullText = await response.text();

  const lawDetails = document.getElementById("lawDetails");
  lawDetails.innerHTML = `
    <h2>${law.name} (${law.year})</h2>
    <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
    <p><strong>Reference:</strong> ${law.reference}</p>
    <p><strong>Source:</strong> <a href="${law.source}" target="_blank">${law.source}</a></p>
    <pre>${fullText}</pre>
  `;
}

function searchLaws() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const listItems = document.querySelectorAll("#lawList li");

  listItems.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(input) ? "block" : "none";
  });
}

loadLaws();
