document.addEventListener("DOMContentLoaded", () => {
  fetch("laws.json")
    .then((response) => response.json())
    .then((laws) => {
      const listContainer = document.querySelector(".law-list");
      const detailContainer = document.querySelector(".law-detail");

      laws.forEach((law) => {
        const lawItem = document.createElement("li");
        lawItem.textContent = `${law.name}`;
        lawItem.classList.add("law-entry");

        lawItem.addEventListener("click", () => {
          detailContainer.innerHTML = `
            <h3>${law.name} (${law.year})</h3>
            <p><strong>Jurisdiction:</strong> ${law.jurisdiction}</p>
            <p><strong>Reference:</strong> ${law.reference}</p>
            <p><strong>Source:</strong> <a href="${law.source}" target="_blank">${law.source}</a></p>
            <p><strong>Breaches:</strong> ${law.breaches.join(", ")}</p>
            <pre class="law-text">Loading full text...</pre>
          `;

          const textEl = detailContainer.querySelector(".law-text");

          // Fetch the full law text
          fetch(law.full_text_file)
            .then((res) => res.text())
            .then((text) => {
              textEl.textContent = text;
            })
            .catch((error) => {
              textEl.textContent = "[Failed to load text]";
              console.error("Error loading law text:", error);
            });
        });

        listContainer.appendChild(lawItem);
      });
    })
    .catch((err) => {
      console.error("Failed to load laws.json:", err);
    });
});
