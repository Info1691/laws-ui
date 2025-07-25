fetch('laws.json')
  .then(response => response.json())
  .then(data => {
    const lawList = document.getElementById('lawList');
    const lawTitle = document.getElementById('lawTitle');
    const lawText = document.getElementById('lawText');

    data.forEach((law, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${law.name} (${law.year})`;
      listItem.addEventListener('click', () => {
        lawTitle.textContent = `${law.name} (${law.year})`;
        lawText.textContent = law.full_text;
      });
      lawList.appendChild(listItem);
    });
  })
  .catch(error => {
    console.error('Error loading laws:', error);
  });
