fetch('laws.json')
  .then(response => response.json())
  .then(data => {
    const lawList = document.getElementById('lawList');
    const lawDetails = document.getElementById('lawDetails');

    data.forEach(law => {
      const li = document.createElement('li');
      li.textContent = law.name;
      li.className = 'law-list-item';
      li.addEventListener('click', () => {
        lawDetails.innerHTML = `
          <h2>${law.name}</h2>
          <p><strong>Year:</strong> ${law.year}</p>
          <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
          <p><strong>Reference:</strong> ${law.reference}</p>
          <p><strong>Source:</strong> <a href="${law.source}" target="_blank">${law.source}</a></p>
          <h3>Full Text:</h3>
          <pre style="white-space: pre-wrap;">${law.full_text}</pre>
          <h3>Breaches:</h3>
          <ul>${law.breaches.map(b => `<li>${b}</li>`).join('')}</ul>
        `;
      });
      lawList.appendChild(li);
    });
  })
  .catch(error => {
    console.error('Error loading laws:', error);
  });
