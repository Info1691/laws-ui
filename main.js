fetch('./laws.json')
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => {
    const lawList = document.getElementById('lawList');
    const lawTitle = document.getElementById('lawTitle');
    const lawText = document.getElementById('lawText');

    data.forEach(law => {
      const li = document.createElement('li');
      li.textContent = law.name;
      li.className = 'law-list-title';

      li.addEventListener('click', () => {
        lawTitle.textContent = law.name;
        lawText.textContent = law.full_text;
      });

      lawList.appendChild(li);
    });
  })
  .catch(error => {
    console.error("Error loading laws:", error);
  });
