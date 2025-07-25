fetch('laws.json')
  .then(response => response.json())
  .then(laws => {
    const container = document.getElementById('lawContainer');
    const searchBox = document.getElementById('searchBoxLaw');

    function displayLaws(filtered) {
      container.innerHTML = '';
      filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'law-card';
        card.innerHTML = `
          <h3>${item.article}: ${item.title}</h3>
          <p>${item.text}</p>
          ${item.breach_tags?.length ? `<p><strong>Breaches:</strong> ${item.breach_tags.join(', ')}</p>` : ''}
        `;
        container.appendChild(card);
      });
    }

    searchBox.addEventListener('input', () => {
      const term = searchBox.value.toLowerCase();
      const filtered = laws.filter(
        law =>
          law.article.toLowerCase().includes(term) ||
          law.title.toLowerCase().includes(term) ||
          law.text.toLowerCase().includes(term)
      );
      displayLaws(filtered);
    });

    displayLaws(laws);
  })
  .catch(err => {
    console.error('Error loading laws.json:', err);
    document.getElementById('lawContainer').innerHTML = '<p>Error loading law data.</p>';
  });
