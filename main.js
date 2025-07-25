// Load laws from laws.json
fetch('laws.json')
  .then(response => response.json())
  .then(data => renderLaws(data))
  .catch(error => console.error('Error loading laws:', error));

function renderLaws(laws) {
  const container = document.getElementById('lawsContainer');
  container.innerHTML = '';

  laws.forEach((law, index) => {
    const card = document.createElement('div');
    card.className = 'law-card';

    card.innerHTML = `
      <div class="law-header"><strong>${law.title}</strong> (${law.year})</div>
      <div class="law-meta">
        <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
        <p><strong>Reference:</strong> ${law.reference}</p>
        <p><strong>Source:</strong> ${law.source}</p>
        <p><strong>Applies To:</strong> ${law.applies_to}</p>
      </div>
      <div class="law-body">
        <p><strong>Summary:</strong> ${law.summary}</p>
        <p><strong>Key Provisions:</strong> ${law.key_provisions}</p>
        <p><strong>Associated Breaches:</strong> ${law.breaches.join(', ')}</p>
      </div>
    `;

    container.appendChild(card);
  });
}
