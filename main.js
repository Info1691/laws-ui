document.addEventListener('DOMContentLoaded', () => {
  const lawListEl = document.getElementById('lawList');
  const lawDetailsEl = document.getElementById('lawDetails');
  const searchBar = document.getElementById('searchBar');

  let allLaws = [];

  fetch('laws.json')
    .then(res => res.json())
    .then(data => {
      allLaws = data;
      renderLawList(allLaws);
    });

  function renderLawList(laws) {
    lawListEl.innerHTML = '';
    laws.forEach((law, index) => {
      const li = document.createElement('li');
      li.textContent = `${law.title} (${law.year})`;
      li.addEventListener('click', () => showLawDetails(law));
      lawListEl.appendChild(li);
    });
  }

  function showLawDetails(law) {
    lawDetailsEl.innerHTML = `
      <h2>${law.title} (${law.year})</h2>
      <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
      <p><strong>Reference:</strong> ${law.reference}</p>
      <p><strong>Source:</strong> <a href="${law.source}" target="_blank">${law.source}</a></p>
      <pre>${law.full_text}</pre>
    `;
  }

  searchBar.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allLaws.filter(law =>
      law.title.toLowerCase().includes(query) ||
      law.jurisdiction.toLowerCase().includes(query)
    );
    renderLawList(filtered);
  });
});
