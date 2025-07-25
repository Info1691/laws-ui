document.addEventListener("DOMContentLoaded", () => {
  const listContainer = document.querySelector(".law-list");
  const detailContainer = document.querySelector(".law-detail");

  fetch("laws.json")
    .then((response) => response.json())
    .then((laws) => {
      laws.forEach((law) => {
        const listItem = document.createElement("li");
        listItem.textContent = law.name;
        listItem.addEventListener("click", () => showLawDetail(law));
        listContainer.appendChild(listItem);
      });
    })
    .catch((error) => {
      console.error("Error loading laws:", error);
      detailContainer.innerHTML = `<p>Error loading laws. Please try again later.</p>`;
    });

  function showLawDetail(law) {
    detailContainer.innerHTML = `<h2>${law.name} (${law.year})</h2><p>Loading text...</p>`;
    fetch(law.full_text_file)
      .then((response) => response.text())
      .then((text) => {
        detailContainer.innerHTML = `
          <h2>${law.name} (${law.year})</h2>
          <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
          <p><strong>Reference:</strong> ${law.reference}</p>
          <p><strong>Source:</strong> <a href="${law.source}" target="_blank">${law.source}</a></p>
          <p><strong>Breaches:</strong> ${law.breaches.join(", ")}</p>
          <pre class="law-text">${text}</pre>
        `;
      })
      .catch((error) => {
        detailContainer.innerHTML = `<p>Error loading law text: ${error.message}</p>`;
      });
  }
});
