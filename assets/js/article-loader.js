// Use js-yaml for parsing front matter. Make sure to include it via CDN.
// Use marked.js for Markdown conversion. Make sure to include it via CDN.
// Use highlight.js for syntax highlighting. Make sure to include it via CDN and a CSS theme.

document.addEventListener("DOMContentLoaded", () => {
  const articleContentElement = document.getElementById("article-content");
  const articleTitleElement = document.getElementById("article-title"); // Targets the H1 tag

  // Check if essential elements exist
  if (!articleContentElement || !articleTitleElement) {
    console.error("Error: Article title or content element not found.");
    if (articleTitleElement) {
      articleTitleElement.innerHTML = `<div class="not-found-placeholder">Page structure error.</div>`;
    }
    return;
  }

  const loadArticle = async () => {
    const slug = window.location.hash.substring(1);

    // Initial loading state in title
    articleTitleElement.innerHTML = `<div class="loading-placeholder">Loading Article...</div>`;
    articleContentElement.innerHTML = ''; // Clear content area

    if (!slug) {
      articleTitleElement.innerHTML = `<div class="not-found-placeholder">No article specified.</div>`;
      return;
    }

    try {
      // Fetch article list from Worker
      const listResp = await fetch("https://whio.digital/utils/list-articles");
      if (!listResp.ok) throw new Error(`HTTP error: ${listResp.status}`);
      const articles = await listResp.json();

      const articleMeta = articles.find(a => a.slug === slug);
      if (!articleMeta) {
        throw new Error(`Article "${slug}" not found.`);
      }

      // Fetch raw markdown content
      const mdResp = await fetch(articleMeta.url);
      if (!mdResp.ok) throw new Error(`Failed to fetch article content.`);
      const rawMarkdown = await mdResp.text();

      // Parse YAML front matter
      let frontMatter = {};
      let mainContentMarkdown = rawMarkdown;
      const match = /^---\s*([\s\S]*?)\s*---/.exec(rawMarkdown);
      if (match) {
        try {
          frontMatter = jsyaml.load(match[1]) || {};
          mainContentMarkdown = rawMarkdown.slice(match[0].length).trim();
        } catch (e) {
          console.warn("YAML parse error:", e);
        }
      }

      // Set article title and browser tab title
      const title = frontMatter.title || articleMeta.title || "Untitled Article";
      articleTitleElement.textContent = title; // Set H1 content
      document.title = `${title} - whiodigital`; // Update browser tab title

      // Convert Markdown to HTML using marked.js
      // Make sure marked is available (included in HTML)
      if (typeof marked === 'undefined') {
        throw new Error("marked.js library not found. Please include it in the HTML.");
      }
      const htmlContent = marked.parse(mainContentMarkdown);
      articleContentElement.innerHTML = htmlContent;

      // Apply syntax highlighting if highlight.js is included
      if (typeof hljs !== 'undefined') {
        articleContentElement.querySelectorAll('pre code').forEach((block) => {
          try {
            hljs.highlightElement(block);
          } catch (e) {
            console.warn("Highlight.js error:", e);
          }
        });
      } else {
        console.warn("highlight.js library not found, skipping syntax highlighting.");
      }
    } catch (error) {
      console.error("Error loading article:", error);
      // Display error message in the title area for visibility
      articleTitleElement.innerHTML = `<div class="not-found-placeholder">Error Loading Article</div>`;
      // Provide more details in the content area
      articleContentElement.innerHTML = `<p style="color: #e53e3e;">Sorry, the article could not be loaded.</p><p><strong>Details:</strong> ${error.message || 'Unknown error'}</p>`;
    }
  };

  // Load article on initial page load and on hash change
  loadArticle();
  window.addEventListener("hashchange", loadArticle);
});
