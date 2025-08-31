/* blog.js - Version corrigée selon vos spécifications */

// Config API
const BLOG_CONFIG = {
  API_URL: 'https://bblog-psi.vercel.app/api/articles',
  TIMEOUT: 10000,
  PER_PAGE: 12, // Plus d'articles par page
  PREVIEW_COUNT: 3, // Pour index.html
  MAX_ARTICLES: 1000, // Limiter le nombre d'articles
  MAX_CONTENT_LENGTH: 100000, // Limiter la taille du contenu
  MAX_SEARCH_LENGTH: 100 // Limiter la recherche
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
  
  // Échapper les caractères dangereux
  const div = document.createElement('div');
  div.textContent = html;
  let safe = div.innerHTML;
  
  // Supprimer les caractères de contrôle et scripts potentiels
  safe = safe.replace(/[\x00-\x1F\x7F]/g, ''); // Caractères de contrôle
  safe = safe.replace(/javascript:/gi, ''); // URLs javascript
  safe = safe.replace(/data:/gi, ''); // URLs data
  safe = safe.replace(/vbscript:/gi, ''); // VBScript
  
  return safe;
}

function getSlugFromURL() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  
  // Validation stricte du slug
  if (!slug || typeof slug !== 'string') return null;
  
  // Nettoyer le slug - ne garder que lettres, chiffres, tirets et underscores
  const cleanSlug = slug.replace(/[^a-zA-Z0-9-_]/g, '');
  
  // Vérifier la longueur
  if (cleanSlug.length === 0 || cleanSlug.length > 100) return null;
  
  return cleanSlug;
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
    // Vérifier que l'origine est correcte
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      throw new Error('Connexion non sécurisée détectée');
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BLOG_CONFIG.TIMEOUT);

    const response = await fetch(BLOG_CONFIG.API_URL, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Protection CSRF
      },
      signal: controller.signal,
      mode: 'cors', // Explicite
      credentials: 'omit' // Pas de cookies
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
    const safeMessage = err.name === 'AbortError' ? 
      'Délai de connexion dépassé' : 
      'Erreur de chargement des articles';
    
    console.error('Erreur de chargement:', err);
    showErrorMessage(safeMessage);
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
    
    // Debug pour voir le contenu
    console.log('Article:', article.title, 'Summary:', article.summary, 'Content length:', article.content?.length);
    
    let summary = '';
    if (article.summary && article.summary.trim() && article.summary !== 'empty') {
      summary = article.summary;
    } else if (article.content && article.content.trim() && article.content !== 'empty') {
      summary = article.content.substring(0, 200) + '...';
    } else {
      summary = 'Résumé non disponible';
    }
    
  articleEl.innerHTML = `
    <div class="article-header">
      <h3>${sanitizeHTML(article.title)}</h3>
      <button class="btn-expand" onclick="toggleArticle('${article.slug}'); return false;" aria-label="Développer l'article">
          <span class="expand-icon">+</span>
      </button>
    </div>
    <div class="meta">${sanitizeHTML(article.date || '')}</div>
    <div class="article-preview">
      <p>${sanitizeHTML(summary)}</p>
    </div>
    <div class="article-content" id="content-${article.slug}" style="display: none;">
      <div class="full-content">${article.content || 'Contenu non disponible'}</div>
        ${article.tags && article.tags.length > 0 ? 
          `<div class="tags">Tags: ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}</div>` : ''
        }
    </div>
`;

    container.appendChild(articleEl);
  });

  updatePagination(articles, page);

      // Vérifier si un article spécifique doit être ouvert (depuis index.html)
  const slugToOpen = getSlugFromURL();
  if (slugToOpen) {
      // Attendre un peu que le DOM soit mis à jour
      setTimeout(() => {
        openSpecificArticle(slugToOpen);
      }, 100);
  }
}

// --- Fonction accordéon (version simplifiée) ---
  function toggleArticle(slug) {
    const content = document.getElementById(`content-${slug}`);
    const card = document.querySelector(`[data-slug="${slug}"]`);
    const expandBtn = card?.querySelector('.btn-expand .expand-icon');
      
    if (!content || !card || !expandBtn) return;
      
    const isCurrentlyOpen = content.style.display === 'block';
    
  // Fermer tous les autres articles et remettre leurs boutons à "+"
  document.querySelectorAll('.article-content').forEach(otherContent => {
    if (otherContent !== content && otherContent.style.display === 'block') {
      otherContent.style.display = 'none';
      const otherSlug = otherContent.id.replace('content-', '');
      const otherCard = document.querySelector(`[data-slug="${otherSlug}"]`);
      const otherBtn = otherCard?.querySelector('.expand-icon');
      const otherPreview = otherCard?.querySelector('.article-preview');
      if (otherBtn) otherBtn.textContent = '+';
      if (otherPreview) otherPreview.style.display = 'block'; // Réafficher l'aperçu des autres
    }
  });
    
  // Toggle l'article actuel
  const preview = card.querySelector('.article-preview');

  if (isCurrentlyOpen) {
    content.style.display = 'none';
    if (preview) preview.style.display = 'block'; // Réafficher l'aperçu
    expandBtn.textContent = '+';
    // Remettre l'URL à blog.html sans paramètre
    if (window.location.search) {
        window.history.replaceState({}, document.title, 'blog.html');
    }
  } else {
    content.style.display = 'block';
    if (preview) preview.style.display = 'none'; // Masquer l'aperçu
    expandBtn.textContent = '−'; // Caractère minus
    // Mettre à jour l'URL avec le slug
    window.history.replaceState({}, document.title, `blog.html?slug=${slug}`);
    // Scroller vers l'article en tenant compte du header sticky
    const headerHeight = document.querySelector('header')?.offsetHeight || 80;
    const cardTop = card.offsetTop - headerHeight - 20;
    window.scrollTo({ 
        top: cardTop, 
        behavior: 'smooth' 
    });
  }
}

// --- Fonction pour ouvrir un article spécifique ---
  function openSpecificArticle(slug) {
    const card = document.querySelector(`[data-slug="${slug}"]`);
    if (card) {
      // Ouvrir l'article
        toggleArticle(slug);
      // Scroller vers l'article après un délai pour être sûr que l'animation soit terminée
        setTimeout(() => {
          const headerHeight = document.querySelector('header')?.offsetHeight || 80;
          const cardTop = card.offsetTop - headerHeight - 20;
          window.scrollTo({ 
              top: cardTop, 
              behavior: 'smooth' 
          });
        }, 200);
    } else {
      console.warn(`Article avec le slug "${slug}" non trouvé sur cette page`);
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
    // Debug pour index.html aussi
    console.log('Preview article:', article.title, 'Summary:', article.summary);
    
    let summary = '';
    if (article.summary && article.summary.trim() && article.summary !== 'empty') {
      summary = article.summary;
    } else if (article.content && article.content.trim() && article.content !== 'empty') {
      summary = article.content.substring(0, 150) + '...';
    } else {
      summary = 'Aperçu non disponible';
    }
      
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

// --- Démarrage ---
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, initialisation...');
    initBlog();
  });