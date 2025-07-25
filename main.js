fetch('laws.json')
  .then(response => response.json())
  .then(data => {
    const lawList = document.getElementById('lawList');
    const lawTitle = document.getElementById('lawTitle');
    const lawText = document.getElementById('lawText');

    data.forEach(law => {
      const li = document.createElement('li');
      li.textContent = law.name || 'Unnamed Law';
      li.className = 'law-list-title';

      li.addEventListener('click', () => {
        lawTitle.textContent = `${law.name} (${law.year})`;
        if (law.full_text_file) {
          fetch(law.full_text_file)
            .then(response => response.text())
            .then(text => {
              lawText.textContent = text;
            })
            .catch(err => {
              lawText.textContent = '[Failed to load full text]';
              console.error(err);
            });
        } else {
          lawText.textContent = '[No full text provided]';
        }
      });

      lawList.appendChild(li);
    });
  })
  .catch(error => {
    console.error("Error loading laws:", error);
    document.getElementById('lawList').innerHTML =
      '<li style="color:red;">Failed to load laws.json</li>';
  });
