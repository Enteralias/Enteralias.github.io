/* blog.js - Version corrigée et unifiée */

// Config API
const BLOG_CONFIG = {
  API_URL: 'https://bblog-psi.vercel.app/api/articles',
  TIMEOUT: 10000,
  PER_PAGE: 6
};

// Variables globales
let allArticles = [];
let filteredArticles = [];
let currentPage = 1;
let currentTag = "all";
let currentSearch = "";

// --- Utils ---
function sanitizeHTML(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

function getSlugFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('slug');
}

function validateArticle(article) {
  return article && 
         typeof article.title === 'string' && 
         typeof article.slug === 'string' && 
         article.title.length > 0 &&
         article.slug.length > 0;
}

// --- Fetch Articles ---
async function fetchArticles() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BLOG_CONFIG.TIMEOUT);

    const response = await fetch(BLOG_CONFIG.API_URL, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Erreur API ${response.status}: ${response.statusText}`);
    }
    
    const articles = await response.json();
    
    // Validation des données
    if (!Array.isArray(articles)) {
      throw new Error('Format de données invalide');
    }
    
    return articles.filter(validateArticle);
    
  } catch (err) {
    console.error('Erreur de chargement:', err);
    showErrorMessage(err.message);
    return [];
  }
}

// --- Gestion des erreurs ---
function showErrorMessage(message) {
  const containers = [
    document.getElementById('blog-articles'),
    document.getElementById('articles-preview')
  ];
  
  const errorHTML = `
    <div class="error-message">
      <p>Les articles ne sont pas disponibles pour le moment.</p>
      <button onclick="window.location.reload()" class="retry-btn">Réessayer</button>
    </div>
  `;
  
  containers.forEach(container => {
    if (container) {
      container.innerHTML = errorHTML;
    }
  });
}

// --- Filtrage ---
function applyFilters() {
  filteredArticles = allArticles.filter(article => {
    const matchesTag = currentTag === "all" || 
      (article.tags && article.tags.includes(currentTag));

    const searchTerm = currentSearch.toLowerCase();
    const matchesSearch = currentSearch === "" || 
      (article.title && article.title.toLowerCase().includes(searchTerm)) ||
      (article.content && article.content.toLowerCase().includes(searchTerm)) ||
      (article.summary && article.summary.toLowerCase().includes(searchTerm));

    return matchesTag && matchesSearch;
  });

  currentPage = 1;
  renderArticles(filteredArticles, currentPage);
}

// --- Rendering Liste complète (blog.html) ---
function renderArticles(articles, page = 1) {
  const container = document.getElementById('blog-articles');
  if (!container) return;
  
  container.innerHTML = '';

  const start = (page - 1) * BLOG_CONFIG.PER_PAGE;
  const pageArticles = articles.slice(start, start + BLOG_CONFIG.PER_PAGE);

  if (pageArticles.length === 0) {
    container.innerHTML = `<p class="no-articles">Aucun article disponible.</p>`;
    hidePagination();
    return;
  }

  pageArticles.forEach(article => {
    const articleEl = document.createElement('article');
    articleEl.className = 'blog-card';
    
    const summary = article.summary || 
      (article.content ? article.content.substring(0, 200) + '...' : '');
    
    articleEl.innerHTML = `
      <h3>${sanitizeHTML(article.title)}</h3>
      <div class="meta">${sanitizeHTML(article.date || '')}</div>
      <p>${sanitizeHTML(summary)}</p>
      <a href="blog.html?slug=${encodeURIComponent(article.slug)}" class="btn-read">Lire la suite →</a>
    `;
    container.appendChild(articleEl);
  });

  updatePagination(articles, page);
}

// --- Pagination ---
function updatePagination(articles, page) {
  const pagination = document.getElementById('pagination');
  const pageInfo = document.getElementById('page-info');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (!pagination) return;
  
  const totalPages = Math.ceil(articles.length / BLOG_CONFIG.PER_PAGE);
  
  if (totalPages > 1) {
    pagination.style.display = 'flex';
    if (pageInfo) pageInfo.textContent = `Page ${page} sur ${totalPages}`;
    if (prevBtn) prevBtn.disabled = page === 1;
    if (nextBtn) nextBtn.disabled = page === totalPages;
  } else {
    hidePagination();
  }
}

function hidePagination() {
  const pagination = document.getElementById('pagination');
  if (pagination) pagination.style.display = 'none';
}

// --- Rendering Article unique ---
function renderSingleArticle(article) {
  const container = document.getElementById('blog-articles');
  if (!container) return;
  
  container.innerHTML = `
    <article class="blog-full">
      <h2>${sanitizeHTML(article.title)}</h2>
      <div class="meta">${sanitizeHTML(article.date || '')}</div>
      <div class="content">${article.content || ''}</div>
      <p><a href="blog.html" class="back-link">← Retour au blog</a></p>
    </article>
  `;
  
  hidePagination();
}

// --- Aperçu articles (index.html) ---
function renderArticlePreview(articles) {
  const container = document.getElementById('articles-preview');
  if (!container) return;
  
  const previewArticles = articles.slice(0, 3);
  
  if (previewArticles.length === 0) {
    container.innerHTML = '<p class="no-articles">Aucun article disponible pour le moment.</p>';
    return;
  }
  
  const articlesHTML = previewArticles.map(article => {
    const summary = article.summary || 
      (article.content ? article.content.substring(0, 150) + '...' : '');
      
    return `
      <article class="blog-article">
        <h3 class="article-title">${sanitizeHTML(article.title)}</h3>
        <div class="article-meta">
          <span class="article-date">${sanitizeHTML(article.date || '')}</span>
        </div>
        <div class="article-summary">
          ${sanitizeHTML(summary)}
        </div>
        <a class="article-link" href="blog.html?slug=${encodeURIComponent(article.slug)}">
          Lire la suite →
        </a>
      </article>
    `;
  }).join('');
  
  container.innerHTML = articlesHTML;
}

// --- Event Listeners ---
function setupEventListeners() {
  // Pagination
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderArticles(filteredArticles, currentPage);
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredArticles.length / BLOG_CONFIG.PER_PAGE);
      if (currentPage < totalPages) {
        currentPage++;
        renderArticles(filteredArticles, currentPage);
      }
    });
  }

  // Recherche
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      currentSearch = searchInput ? searchInput.value.toLowerCase() : '';
      applyFilters();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        currentSearch = searchInput.value.toLowerCase();
        applyFilters();
      }
    });
  }

  // Filtres par tags
  const tagButtons = document.querySelectorAll('.tag-filter');
  tagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tagButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTag = btn.dataset.tag;
      applyFilters();
    });
  });
}

// --- Initialisation ---
async function initBlog() {
  // Chargement des articles
  allArticles = await fetchArticles();
  
  if (allArticles.length === 0) {
    return; // L'erreur est déjà affichée par showErrorMessage
  }

  const slug = getSlugFromURL();
  
  if (slug) {
    // Mode article unique (blog.html avec ?slug=...)
    const article = allArticles.find(a => a.slug === slug);
    if (article) {
      renderSingleArticle(article);
    } else {
      const container = document.getElementById('blog-articles');
      if (container) {
        container.innerHTML = `<p class="error">Article introuvable.</p>`;
      }
    }
  } else {
    // Déterminer le mode selon la page
    const blogContainer = document.getElementById('blog-articles');
    const previewContainer = document.getElementById('articles-preview');
    
    if (blogContainer) {
      // Mode liste complète (blog.html)
      filteredArticles = [...allArticles];
      renderArticles(filteredArticles, 1);
      setupEventListeners();
    } else if (previewContainer) {
      // Mode aperçu (index.html)
      renderArticlePreview(allArticles);
    }
  }
}

// --- Démarrage ---
document.addEventListener('DOMContentLoaded', initBlog);