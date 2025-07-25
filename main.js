document.addEventListener("DOMContentLoaded", () => {
  fetch('laws.json')
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById('lawsContainer');

      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = "<p>No laws found in the repository.</p>";
        return;
      }

      data.forEach((law, index) => {
        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
          <h2>${law.title}</h2>
          <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
          <p><strong>Year:</strong> ${law.year}</p>
          <p><strong>Citation:</strong> ${law.citation}</p>
          <p><strong>Source:</strong> ${law.source}</p>
          <p><strong>Legal Principle:</strong><br/> ${law.legal_principle}</p>
          <p><strong>Full Text:</strong><br/><pre>${law.full_text}</pre></p>
          <p><strong>Breach Tags:</strong> ${law.breach_tags.join(', ')}</p>
        `;

        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Error loading laws.json:", err);
      document.getElementById('lawsContainer').innerHTML = "<p>Failed to load laws.</p>";
    });
});
