document.addEventListener("DOMContentLoaded", function () {
  fetch("laws.json")
    .then(response => response.json())
    .then(data => {
      const lawList = document.getElementById("law-list");
      const lawDetails = document.getElementById("law-details");

      data.forEach(law => {
        const li = document.createElement("li");
        li.textContent = `${law.name} (${law.year})`;
        li.addEventListener("click", () => {
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
        });
        lawList.appendChild(li);
      });
    });
});
