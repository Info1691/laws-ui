fetch('laws.json')
  .then(response => response.json())
  .then(data => {
    const lawList = document.getElementById('lawList');
    const lawTitle = document.getElementById('lawTitle');
    const lawText = document.getElementById('lawText');

    data.forEach(law => {
      const li = document.createElement('li');
      li.textContent = law.name;
      li.className = 'law-list-item';
      li.addEventListener('click', () => {
        lawTitle.innerHTML = `
          <h2>${law.name}</h2>
          <p><strong>Year:</strong> ${law.year}</p>
          <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
          <p><strong>Reference:</strong> ${law.reference}</p>
          <p><strong>Source:</strong> <a href="${law.source}" target="_blank">${law.source}</a></p>
          <h3>Breaches:</h3>
          <ul>${law.breaches.map(b => `<li>${b}</li>`).join('')}</ul>
        `;

        lawText.textContent = law.full_text;
      });
      lawList.appendChild(li);
    });
  })
  .catch(error => {
    console.error('Error loading laws:', error);
  });
