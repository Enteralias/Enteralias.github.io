/* blog.js - Version corrigée selon vos spécifications */

// Config API
const BLOG_CONFIG = {
  API_URL: 'https://bblog-psi.vercel.app/api/articles',
  TIMEOUT: 10000,
  PER_PAGE: 12, // Plus d'articles par page
  PREVIEW_COUNT: 3 // Pour index.html
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

    console.log('Chargement des articles depuis:', BLOG_CONFIG.API_URL);

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
    console.log('Articles reçus:', articles.length);
    
    // Validation des données
    if (!Array.isArray(articles)) {
      throw new Error('Format de données invalide');
    }
    
    const validArticles = articles.filter(validateArticle);
    console.log('Articles valides:', validArticles.length);
    
    return validArticles;
    
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
      <p class="error-detail">${message}</p>
      <button onclick="window.location.reload()" class="retry-btn">Réessayer</button>
    </div>
  `;
  
  containers.forEach(container => {
    if (container) {
      container.innerHTML = errorHTML;
    }
  });
}

// --- Filtrage (sur TOUS les articles) ---
function applyFilters() {
  console.log('Application des filtres - Tag:', currentTag, 'Recherche:', currentSearch);
  
  filteredArticles = allArticles.filter(article => {
    const matchesTag = currentTag === "all" || 
      (article.tags && article.tags.some(tag => tag.includes(currentTag)));

    const searchTerm = currentSearch.toLowerCase();
    const matchesSearch = currentSearch === "" || 
      (article.title && article.title.toLowerCase().includes(searchTerm)) ||
      (article.content && article.content.toLowerCase().includes(searchTerm)) ||
      (article.summary && article.summary.toLowerCase().includes(searchTerm));

    return matchesTag && matchesSearch;
  });

  console.log('Articles filtrés:', filteredArticles.length);
  currentPage = 1;
  renderArticles(filteredArticles, currentPage);
}

// --- Rendering Liste complète avec accordéon (blog.html) ---
function renderArticles(articles, page = 1) {
  const container = document.getElementById('blog-articles');
  if (!container) return;
  
  container.innerHTML = '';

  const start = (page - 1) * BLOG_CONFIG.PER_PAGE;
  const pageArticles = articles.slice(start, start + BLOG_CONFIG.PER_PAGE);

  if (pageArticles.length === 0) {
    container.innerHTML = `<p class="no-articles">Aucun article trouvé pour cette recherche.</p>`;
    hidePagination();
    return;
  }

  pageArticles.forEach(article => {
    const articleEl = document.createElement('article');
    articleEl.className = 'blog-card';
    articleEl.dataset.slug = article.slug;
    
    const summary = article.summary || 
      (article.content ? article.content.substring(0, 200) + '...' : '');
    
    articleEl.innerHTML = `
      <div class="article-header" onclick="toggleArticle('${article.slug}')">
        <h3>${sanitizeHTML(article.title)}</h3>
        <div class="meta">${sanitizeHTML(article.date || '')}</div>
        <p class="summary">${sanitizeHTML(summary)}</p>
        <span class="toggle-icon">+</span>
      </div>
      <div class="article-content" id="content-${article.slug}" style="display: none;">
        <div class="full-content">${article.content || ''}</div>
        ${article.tags && article.tags.length > 0 ? 
          `<div class="tags">Tags: ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}</div>` 
          : ''}
      </div>
    `;
    container.appendChild(articleEl);
  });

  updatePagination(articles, page);
}

// --- Fonction accordéon ---
function toggleArticle(slug) {
  const content = document.getElementById(`content-${slug}`);
  const card = document.querySelector(`[data-slug="${slug}"]`);
  const icon = card.querySelector('.toggle-icon');
  
  if (!content) return;
  
  // Fermer tous les autres articles
  document.querySelectorAll('.article-content').forEach(otherContent => {
    if (otherContent !== content && otherContent.style.display === 'block') {
      otherContent.style.display = 'none';
      const otherCard = otherContent.closest('.blog-card');
      const otherIcon = otherCard.querySelector('.toggle-icon');
      if (otherIcon) otherIcon.textContent = '+';
      otherCard.classList.remove('expanded');
    }
  });
  
  // Toggle l'article actuel
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '−';
    card.classList.add('expanded');
  } else {
    content.style.display = 'none';
    icon.textContent = '+';
    card.classList.remove('expanded');
  }
}

// Rendre la fonction globale pour onclick
window.toggleArticle = toggleArticle;

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
    if (pageInfo) pageInfo.textContent = `Page ${page} sur ${totalPages} (${articles.length} articles)`;
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

// --- Rendering Article unique (si slug dans URL) ---
function renderSingleArticle(article) {
  const container = document.getElementById('blog-articles');
  if (!container) return;
  
  container.innerHTML = `
    <article class="blog-full">
      <h2>${sanitizeHTML(article.title)}</h2>
      <div class="meta">${sanitizeHTML(article.date || '')}</div>
      <div class="content">${article.content || ''}</div>
      ${article.tags && article.tags.length > 0 ? 
        `<div class="tags">Tags: ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}</div>` 
        : ''}
      <p><a href="blog.html" class="back-link">← Retour au blog</a></p>
    </article>
  `;
  
  hidePagination();
}

// --- Aperçu articles pour index.html ---
function renderArticlePreview(articles) {
  const container = document.getElementById('articles-preview');
  if (!container) {
    console.log('Container articles-preview non trouvé');
    return;
  }
  
  console.log('Rendu des articles de prévisualisation:', articles.length);
  
  const previewArticles = articles.slice(0, BLOG_CONFIG.PREVIEW_COUNT);
  
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
  console.log('Articles de prévisualisation affichés');
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
        window.scrollTo(0, 0);
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredArticles.length / BLOG_CONFIG.PER_PAGE);
      if (currentPage < totalPages) {
        currentPage++;
        renderArticles(filteredArticles, currentPage);
        window.scrollTo(0, 0);
      }
    });
  }

  // Recherche
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      currentSearch = searchInput ? searchInput.value.toLowerCase().trim() : '';
      console.log('Recherche:', currentSearch);
      applyFilters();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        currentSearch = searchInput.value.toLowerCase().trim();
        console.log('Recherche (Enter):', currentSearch);
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
      console.log('Tag sélectionné:', currentTag);
      applyFilters();
    });
  });
}

// --- Initialisation ---
async function initBlog() {
  console.log('Initialisation du blog...');
  
  // Chargement des articles
  allArticles = await fetchArticles();
  
  if (allArticles.length === 0) {
    console.log('Aucun article chargé');
    return;
  }

  console.log('Articles chargés:', allArticles.length);

  const slug = getSlugFromURL();
  
  if (slug) {
    console.log('Mode article unique:', slug);
    // Mode article unique (blog.html avec ?slug=...)
    const article = allArticles.find(a => a.slug === slug);
    if (article) {
      renderSingleArticle(article);
    } else {
      const container = document.getElementById('blog-articles');
      if (container) {
        container.innerHTML = `<p class="error">Article "${slug}" introuvable.</p>`;
      }
    }
  } else {
    // Déterminer le mode selon la page
    const blogContainer = document.getElementById('blog-articles');
    const previewContainer = document.getElementById('articles-preview');
    
    if (blogContainer) {
      console.log('Mode liste complète (blog.html)');
      // Mode liste complète (blog.html)
      filteredArticles = [...allArticles];
      renderArticles(filteredArticles, 1);
      setupEventListeners();
    } else if (previewContainer) {
      console.log('Mode aperçu (index.html)');
      // Mode aperçu (index.html)
      renderArticlePreview(allArticles);
    } else {
      console.log('Aucun container trouvé');
    }
  }
}

// --- Démarrage ---
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM chargé, initialisation...');
  initBlog();
});