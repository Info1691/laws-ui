fetch('./laws.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  })
  .then(data => {
    const lawList = document.getElementById('lawList');
    const lawTitle = document.getElementById('lawTitle');
    const lawText = document.getElementById('lawText');

    data.forEach(law => {
      const li = document.createElement('li');
      li.textContent = law.name || 'Untitled Law';
      li.className = 'law-list-title';

      li.addEventListener('click', () => {
        lawTitle.textContent = `${law.name} (${law.year})`;
        lawText.textContent = law.full_text || '[No text available]';
      });

      lawList.appendChild(li);
    });
  })
  .catch(error => {
    console.error("Error loading laws:", error);
    document.getElementById('lawList').innerHTML = '<li style="color:red;">Failed to load laws.json</li>';
  });
