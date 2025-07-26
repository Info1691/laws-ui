document.addEventListener('DOMContentLoaded', () => {
  fetch('laws.json')
    .then(response => response.json())
    .then(data => {
      window.lawsData = data;
      renderLawList(data);
    });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = window.lawsData.filter(law =>
      law.title.toLowerCase().includes(searchTerm) ||
      law.jurisdiction.toLowerCase().includes(searchTerm)
    );
    renderLawList(filtered);
  });
});

function renderLawList(data) {
  const list = document.getElementById('lawList');
  list.innerHTML = '';
  data.forEach((law, index) => {
    const item = document.createElement('li');
    item.textContent = law.title;
    item.addEventListener('click', () => showLawDetails(law));
    list.appendChild(item);
  });
}

function showLawDetails(law) {
  const section = document.getElementById('lawDetails');
  section.innerHTML = `
    <h2>${law.title}</h2>
    <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
    <p><strong>Reference:</strong> ${law.reference}</p>
    <p><strong>Source:</strong> <a href="${law.source}" target="_blank">${law.source}</a></p>
    <pre>${law.full_text}</pre>
  `;
}
