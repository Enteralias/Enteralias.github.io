/* blog.js */

// Config API
const BLOG_CONFIG = {
  API_URL: 'https://bblog-psi.vercel.app/api/articles',
  TIMEOUT: 10000,
  PER_PAGE: 6
};

// Sélecteurs
const container = document.getElementById('blog-articles');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('page-info');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const tagButtons = document.querySelectorAll('.tag-filter');

let allArticles = [];
let filteredArticles = [];
let currentPage = 1;
let currentTag = "all";
let currentSearch = "";

// --- Utils ---
function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

function getSlugFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('slug');
}

// --- Fetch Articles ---
async function fetchArticles() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BLOG_CONFIG.TIMEOUT);

    const response = await fetch(BLOG_CONFIG.API_URL, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Erreur API ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('Erreur de chargement:', err);
    container.innerHTML = `<p class="error">Impossible de charger les articles.</p>`;
    return [];
  }
}

// --- Filtrage ---
function applyFilters() {
  filteredArticles = allArticles.filter(article => {
    const matchesTag =
      currentTag === "all" ||
      (article.tags && article.tags.includes(currentTag));

    const matchesSearch =
      currentSearch === "" ||
      (article.title && article.title.toLowerCase().includes(currentSearch)) ||
      (article.content && article.content.toLowerCase().includes(currentSearch));

    return matchesTag && matchesSearch;
  });

  currentPage = 1;
  renderArticles(filteredArticles, currentPage);
}

// --- Rendering Liste ---
function renderArticles(articles, page = 1) {
  container.innerHTML = '';

  const start = (page - 1) * BLOG_CONFIG.PER_PAGE;
  const pageArticles = articles.slice(start, start + BLOG_CONFIG.PER_PAGE);

  if (pageArticles.length === 0) {
    container.innerHTML = `<p class="no-articles">Aucun article disponible.</p>`;
    pagination.style.display = 'none';
    return;
  }

  pageArticles.forEach(article => {
    const articleEl = document.createElement('article');
    articleEl.className = 'blog-card';
    articleEl.innerHTML = `
      <h3>${sanitizeHTML(article.title)}</h3>
      <div class="meta">${sanitizeHTML(article.date || '')}</div>
      <p>${sanitizeHTML(article.summary || article.content.substring(0, 200) + '...')}</p>
      <a href="blog.html?slug=${encodeURIComponent(article.slug)}" class="btn-read">Lire la suite →</a>
    `;
    container.appendChild(articleEl);
  });

  // Pagination
  const totalPages = Math.ceil(articles.length / BLOG_CONFIG.PER_PAGE);
  if (totalPages > 1) {
    pagination.style.display = 'flex';
    pageInfo.textContent = `Page ${page} sur ${totalPages}`;
    prevBtn.disabled = page === 1;
    nextBtn.disabled = page === totalPages;
  } else {
    pagination.style.display = 'none';
  }
}

// --- Rendering Article unique ---
function renderSingleArticle(article) {
  container.innerHTML = `
    <article class="blog-full">
      <h2>${sanitizeHTML(article.title)}</h2>
      <div class="meta">${sanitizeHTML(article.date || '')}</div>
      <div class="content">${article.content}</div>
      <p><a href="blog.html" class="back-link">← Retour au blog</a></p>
    </article>
  `;
  pagination.style.display = 'none';
}

// --- Init ---
(async function initBlog() {
  allArticles = await fetchArticles();

  const slug = getSlugFromURL();
  if (slug) {
    const article = allArticles.find(a => a.slug === slug);
    if (article) {
      renderSingleArticle(article);
    } else {
      container.innerHTML = `<p class="error">Article introuvable.</p>`;
    }
  } else {
    // Mode liste
    applyFilters();

    // --- Events ---
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderArticles(filteredArticles, currentPage);
      }
    });

    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredArticles.length / BLOG_CONFIG.PER_PAGE);
      if (currentPage < totalPages) {
        currentPage++;
        renderArticles(filteredArticles, currentPage);
      }
    });

    searchBtn.addEventListener('click', () => {
      currentSearch = searchInput.value.toLowerCase();
      applyFilters();
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        currentSearch = searchInput.value.toLowerCase();
        applyFilters();
      }
    });

    tagButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tagButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTag = btn.dataset.tag;
        applyFilters();
      });
    });
  }
})();
