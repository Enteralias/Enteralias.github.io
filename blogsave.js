/* Blog.js – dédié à blog.html */

// Configuration
const BLOG_CONFIG = {
  API_URL: 'https://bblog-psi.vercel.app/api/articles',
  TIMEOUT: 10000,
  PER_PAGE: 5 // nombre d’articles par page
};

// État global
let allArticles = [];
let filteredArticles = [];
let currentPage = 1;

// Sanitize
function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Validation
function validateArticle(article) {
  return article &&
         typeof article.title === 'string' &&
         typeof article.slug === 'string' &&
         typeof article.content === 'string' &&
         article.title.length > 0 &&
         article.slug.length > 0;
}

// Charger tous les articles
async function loadAllArticles() {
  const container = document.getElementById('blog-articles');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BLOG_CONFIG.TIMEOUT);

    const response = await fetch(BLOG_CONFIG.API_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Erreur serveur (${response.status})`);

    const articles = await response.json();
    if (!Array.isArray(articles)) throw new Error("Format invalide");

    allArticles = articles.filter(validateArticle);
    filteredArticles = [...allArticles];

    if (filteredArticles.length === 0) {
      container.innerHTML = '<p class="no-articles">Aucun article disponible.</p>';
      return;
    }

    renderPage(1);

  } catch (err) {
    console.error("Erreur blog:", err.message);
    container.innerHTML = `
      <div class="error-message">
        <p>Impossible de charger les articles.</p>
        <button onclick="loadAllArticles()" class="retry-btn">Réessayer</button>
      </div>
    `;
  }
}

// Rendu paginé
function renderPage(page) {
  const container = document.getElementById('blog-articles');
  const pagination = document.getElementById('pagination');
  currentPage = page;

  const start = (page - 1) * BLOG_CONFIG.PER_PAGE;
  const end = start + BLOG_CONFIG.PER_PAGE;
  const pageArticles = filteredArticles.slice(start, end);

  const html = pageArticles.map(article => `
    <article class="blog-article">
      <h3 class="article-title">${sanitizeHTML(article.title)}</h3>
      <div class="article-meta">
        <span class="article-date">${sanitizeHTML(article.date || '')}</span>
      </div>
      <div class="article-summary">
        ${sanitizeHTML(article.summary || article.content.substring(0, 200) + '...')}
      </div>
      <a href="#" class="article-link" data-slug="${sanitizeHTML(article.slug)}">Lire la suite →</a>
    </article>
  `).join('');

  container.innerHTML = html;
  addArticleEventListeners();

  // pagination
  const totalPages = Math.ceil(filteredArticles.length / BLOG_CONFIG.PER_PAGE);
  pagination.style.display = totalPages > 1 ? "flex" : "none";
  document.getElementById('page-info').textContent = `Page ${page} sur ${totalPages}`;
  document.getElementById('prev-btn').disabled = page <= 1;
  document.getElementById('next-btn').disabled = page >= totalPages;
}

// Navigation pagination
document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentPage > 1) renderPage(currentPage - 1);
});
document.getElementById('next-btn').addEventListener('click', () => {
  const totalPages = Math.ceil(filteredArticles.length / BLOG_CONFIG.PER_PAGE);
  if (currentPage < totalPages) renderPage(currentPage + 1);
});

// Recherche
document.getElementById('search-btn').addEventListener('click', applyFilters);
document.getElementById('search-input').addEventListener('keyup', (e) => {
  if (e.key === "Enter") applyFilters();
});

// Filtres par tags
document.querySelectorAll('.tag-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tag-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  });
});

// Appliquer recherche + tag
function applyFilters() {
  const searchText = document.getElementById('search-input').value.toLowerCase();
  const activeTag = document.querySelector('.tag-filter.active').dataset.tag;

  filteredArticles = allArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchText) ||
                          (article.content && article.content.toLowerCase().includes(searchText));
    const matchesTag = (activeTag === "all") || 
                       (article.tags && article.tags.includes(activeTag));
    return matchesSearch && matchesTag;
  });

  renderPage(1);
}

// Liens "Lire la suite"
function addArticleEventListeners() {
  document.querySelectorAll('.article-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const slug = this.dataset.slug;
      if (slug && /^[a-zA-Z0-9-_]+$/.test(slug)) openArticleModal(slug);
    });
  });
}

// Modal article complet
async function openArticleModal(slug) {
  const modal = document.getElementById('article-modal');
  const modalContent = document.getElementById('modal-article-content');
  const closeBtn = modal.querySelector('.close');

  modal.style.display = "block";
  modalContent.innerHTML = '<div class="loading">Chargement...</div>';

  // 👉 Remplace ici le fetch par la recherche locale
  const article = allArticles.find(a => a.slug === slug);
  if (!article) {
    modalContent.innerHTML = `<p class="error-message">Article introuvable.</p>`;
    return;
  }

  modalContent.innerHTML = `
    <h2>${sanitizeHTML(article.title)}</h2>
    <div class="article-date">${sanitizeHTML(article.date || '')}</div>
    <div class="article-content">${sanitizeHTML(article.content)}</div>
  `;

  closeBtn.onclick = () => modal.style.display = "none";
  window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('blog-articles')) {
    loadAllArticles();
  }
});
