fetch('laws.json')
  .then(response => response.json())
  .then(data => {
    const lawList = document.getElementById('lawList');
    const lawDetails = document.getElementById('lawDetails');
    const searchBar = document.getElementById('searchBar');

    function displayLaw(law) {
      lawDetails.innerHTML = `
        <h2>${law.name}</h2>
        <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
        <p><strong>Reference:</strong> ${law.reference}</p>
        <p><strong>Source:</strong> <a href="${law.source}" target="_blank">${law.source}</a></p>
        <pre>${law.text}</pre>
      `;
    }

    function renderLawList(filteredLaws) {
      lawList.innerHTML = '';
      filteredLaws.forEach((law, index) => {
        const li = document.createElement('li');
        li.textContent = law.name;
        li.onclick = () => displayLaw(law);
        lawList.appendChild(li);
      });
    }

    searchBar.addEventListener('input', () => {
      const query = searchBar.value.toLowerCase();
      const filtered = data.filter(law =>
        law.name.toLowerCase().includes(query) ||
        law.jurisdiction.toLowerCase().includes(query)
      );
      renderLawList(filtered);
    });

    renderLawList(data); // Initial load
  })
  .catch(error => {
    console.error('Error loading laws:', error);
  });
