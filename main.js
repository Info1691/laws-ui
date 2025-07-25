fetch('laws/laws.json')
  .then(response => response.json())
  .then(laws => {
    const lawList = document.getElementById('lawList');
    const lawDetails = document.getElementById('lawDetails');
    const searchBar = document.getElementById('searchBar');

    function displayLaws(filteredLaws) {
      lawList.innerHTML = '';
      filteredLaws.forEach(law => {
        const li = document.createElement('li');
        li.textContent = `${law.name} (${law.year})`;
        li.addEventListener('click', () => showLawDetails(law));
        lawList.appendChild(li);
      });
    }

    function showLawDetails(law) {
      fetch(law.full_text_file)
        .then(response => response.text())
        .then(text => {
          lawDetails.innerHTML = `
            <h2>${law.name} (${law.year})</h2>
            <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
            <p><strong>Reference:</strong> ${law.reference}</p>
            <p><strong>Source:</strong> <a href="${law.source}" target="_blank">${law.source}</a></p>
            <pre>${text}</pre>
          `;
        });
    }

    searchBar.addEventListener('input', () => {
      const keyword = searchBar.value.toLowerCase();
      const filtered = laws.filter(law =>
        law.name.toLowerCase().includes(keyword) ||
        law.reference.toLowerCase().includes(keyword) ||
        law.jurisdiction.toLowerCase().includes(keyword)
      );
      displayLaws(filtered);
    });

    displayLaws(laws);
  });
