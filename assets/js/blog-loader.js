document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("blog-articles");
  const pagination = document.getElementById("pagination");
  const searchInput = document.getElementById("search-input");
  const yearFilter = document.getElementById("year-filter");

  const pageSize = 6;
  let articles = [];
  let filteredArticles = [];
  let currentPage = 1;

  async function fetchArticles() {
    try {
      const resp = await fetch("/utils/list-articles");
      console.log("Fetch status:", resp.status);

      if (!resp.ok) throw new Error(`HTTP error: ${resp.status}`);

      articles = await resp.json();
      console.log("Fetched articles:", articles);

      filteredArticles = articles.slice();
      populateYearFilter();
      render();
    } catch (e) {
      console.error("Error fetching articles:", e);
      container.innerHTML = "<p>Error loading articles.</p>";
    }
  }

  function populateYearFilter() {
    const years = new Set();
    articles.forEach(a => {
      if (a.date) {
        const y = new Date(a.date).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    yearFilter.innerHTML = '<option value="">All Years</option>' + sortedYears.map(y => `<option value="${y}">${y}</option>`).join('');
  }

  function render() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageArticles = filteredArticles.slice(start, end);

    container.innerHTML = "";

    if (pageArticles.length === 0) {
      container.innerHTML = "<p>No articles found.</p>";
      pagination.innerHTML = "";
      return;
    }

    for (const { slug, title, description, date } of pageArticles) {
      const articleUrl = `/article.html#${slug}`;
      container.insertAdjacentHTML("beforeend", `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100" style="background: rgba(0, 20, 40, 0.8); backdrop-filter: blur(5px); border: none;">
            <div class="card-body d-flex flex-column p-4">
              <h5 class="card-title mb-3" style="color: #f8f9fa;">${title}</h5>
              ${date ? `<small class="text-muted mb-2 d-block">${date}</small>` : ""}
              <p class="card-text flex-grow-1" style="color: #e9ecef;">${description}</p>
              <a href="${articleUrl}" class="btn btn-sm btn-outline-light mt-auto align-self-start">Read More</a>
            </div>
          </div>
        </div>
      `);
    }

    renderPagination();
  }

  function renderPagination() {
    const totalPages = Math.ceil(filteredArticles.length / pageSize);
    let html = "";

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
               <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
             </li>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                 <a class="page-link" href="#" data-page="${i}">${i}</a>
               </li>`;
    }

    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
               <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
             </li>`;

    pagination.innerHTML = html;
  }

  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const year = yearFilter.value;

    filteredArticles = articles.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchTerm) || a.description.toLowerCase().includes(searchTerm);
      const matchesYear = year ? (new Date(a.date).getFullYear().toString() === year) : true;
      return matchesSearch && matchesYear;
    });

    currentPage = 1;
    render();
  }

  pagination.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      e.preventDefault();
      const page = parseInt(e.target.dataset.page);
      if (!isNaN(page) && page >= 1 && page <= Math.ceil(filteredArticles.length / pageSize)) {
        currentPage = page;
        render();
      }
    }
  });

  searchInput.addEventListener("input", applyFilters);
  yearFilter.addEventListener("change", applyFilters);

  fetchArticles();
}); 