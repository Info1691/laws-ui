fetch('laws.json')
  .then(response => response.json())
  .then(data => {
    const lawList = document.getElementById('lawList');
    const lawTitle = document.getElementById('lawTitle');
    const lawText = document.getElementById('lawText');

    data.forEach(law => {
      const li = document.createElement('li');
      li.textContent = law.name;
      li.className = 'law-list-title';
      li.addEventListener('click', () => {
        lawTitle.innerHTML = `<h2>${law.name} (${law.year})</h2>`;

        // Fetch the full law text from the referenced file
        fetch(law.full_text_file)
          .then(res => res.text())
          .then(text => {
            lawText.innerHTML = `
              <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
              <p><strong>Reference:</strong> ${law.reference}</p>
              <p><strong>Source:</strong> <a href="${law.source}" target="_blank">${law.source}</a></p>
              <h3>Full Text:</h3>
              <pre style="white-space: pre-wrap;">${text}</pre>
              <h3>Breaches:</h3>
              <ul>${law.breaches.map(b => `<li>${b}</li>`).join('')}</ul>
            `;
          })
          .catch(err => {
            lawText.innerHTML = '[Error loading text file]';
            console.error('Error loading text:', err);
          });
      });
      lawList.appendChild(li);
    });
  })
  .catch(error => {
    console.error('Error loading laws:', error);
  });
