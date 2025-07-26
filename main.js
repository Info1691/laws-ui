document.addEventListener("DOMContentLoaded", () => {
  const lawList = document.getElementById("lawList");
  const lawDetails = document.getElementById("lawDetails");
  const searchInput = document.getElementById("searchInput");

  let lawsData = [];

  // Fetch the law list
  fetch("laws.json")
    .then((res) => res.json())
    .then((data) => {
      lawsData = data;
      renderLawList(data);
    });

  function renderLawList(laws) {
    lawList.innerHTML = "";
    laws.forEach((law, index) => {
      const li = document.createElement("li");
      li.textContent = law.title;
      li.dataset.index = index;
      li.addEventListener("click", () => {
        document.querySelectorAll("#lawList li").forEach(el => el.classList.remove("active"));
        li.classList.add("active");
        displayLawDetails(law);
      });
      lawList.appendChild(li);
    });
  }

  function displayLawDetails(law) {
    lawDetails.innerHTML = `
      <h2>${law.title}</h2>
      <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
      <p><strong>Reference:</strong> ${law.reference}</p>
      <p><strong>Source:</strong> <a href="${law.source}" target="_blank">${law.source}</a></p>
      <div id="lawText"><pre>Loading full text…</pre></div>
    `;

    // Fetch full text from separate file
    fetch(law.text_file)
      .then(res => res.text())
      .then(text => {
        document.getElementById("lawText").innerHTML = `<pre>${text}</pre>`;
      })
      .catch(err => {
        document.getElementById("lawText").innerHTML = `<pre style="color:red;">Failed to load full text.</pre>`;
      });
  }

  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = lawsData.filter(law =>
      law.title.toLowerCase().includes(term) ||
      law.jurisdiction.toLowerCase().includes(term)
    );
    renderLawList(filtered);
  });
});
