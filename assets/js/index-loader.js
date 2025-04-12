// Use js-yaml for parsing front matter. Make sure to include it via CDN.

document.addEventListener("DOMContentLoaded", async () => {
  const previewsContainer = document.getElementById("blog-previews"); // Ensure this container exists in index.html
  const maxPreviews = 3; // Maximum number of previews to show

  if (!previewsContainer) {
    console.error("Error: Blog previews container element not found.");
    return;
  }

  // Clear the initial loading message/spinner
  previewsContainer.innerHTML = "";

  try {
    const response = await fetch("/utils/list-articles");
    console.log("Fetch status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const articles = await response.json();
    console.log("Fetched articles:", articles);

    if (!Array.isArray(articles) || articles.length === 0) {
      previewsContainer.innerHTML = "<div class='col-12 text-center'><p>No articles found.</p></div>";
      return;
    }

    let previewsLoaded = 0;
    for (const article of articles) {
      if (previewsLoaded >= maxPreviews) break;

      const { slug, title, description, date } = article;
      const articleUrl = `/article.html#${slug}`;

      const cardHtml = `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100" style="background: rgba(0, 20, 40, 0.8); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); border: none;">
            <div class="card-body d-flex flex-column p-4">
              <h5 class="card-title mb-3" style="color: #f8f9fa; font-family: 'Space Grotesk', sans-serif;">${title}</h5>
              ${date ? `<small class="text-muted mb-2 d-block">${date}</small>` : ""}
              <p class="card-text flex-grow-1" style="color: #e9ecef; font-family: 'Red Hat Display', sans-serif;">${description}</p>
              <a href="${articleUrl}" class="btn btn-sm btn-outline-light mt-auto align-self-start">Read More</a>
            </div>
          </div>
        </div>`;
      previewsContainer.insertAdjacentHTML("beforeend", cardHtml);
      previewsLoaded++;
    }

    if (previewsLoaded === 0) {
      previewsContainer.innerHTML = "<div class='col-12 text-center'><p>No article previews available.</p></div>";
    }
  } catch (error) {
    console.error("Error fetching or rendering articles:", error);
    previewsContainer.innerHTML = "<div class='col-12 text-center'><p>Error loading articles.</p></div>";
  }
});
