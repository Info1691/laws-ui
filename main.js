fetch('laws.json')
  .then(response => response.json())
  .then(data => {
    const lawList = document.getElementById('lawList');
    const lawDetails = document.getElementById('lawDetails');
    const searchBar = document.getElementById('searchBar');

    let currentLaws = data;

    function renderLawList(laws) {
      lawList.innerHTML = '';
      laws.forEach((law, index) => {
        const li = document.createElement('li');
        li.textContent = law.title;
        li.addEventListener('click', () => {
          document.querySelectorAll('#lawList li').forEach(el => el.classList.remove('active'));
          li.classList.add('active');
          renderLawDetails(law);
        });
        lawList.appendChild(li);
      });
    }

    function renderLawDetails(law) {
      lawDetails.innerHTML = `
        <h2>${law.title}</h2>
        <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
        <p><strong>Reference:</strong> ${law.reference}</p>
        <p><strong>Source:</strong> <a href="${law.source}" target="_blank">${law.source}</a></p>
        <pre>${law.full_text}</pre>
      `;
    }

    searchBar.addEventListener('input', () => {
      const query = searchBar.value.toLowerCase();
      const filtered = currentLaws.filter(law =>
        law.title.toLowerCase().includes(query) ||
        law.jurisdiction.toLowerCase().includes(query)
      );
      renderLawList(filtered);
    });

    renderLawList(currentLaws);
  })
  .catch(error => {
    document.getElementById('lawDetails').innerHTML = `<p>Error loading laws: ${error.message}</p>`;
  });
