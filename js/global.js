/* Menu mobile */

function menuMobile() {
    const btn = document.querySelector('.burger');
    const header = document.querySelector('.header');
    const links = document.querySelectorAll('.navbar a');

    btn.addEventListener('click', () => {
        header.classList.toggle('show-nav');
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            header.classList.remove('show-nav');  
        });
    });
}

menuMobile();


/* Actions Compétences */
function showCompetencies() {
    const openImageBtn = document.getElementById('open');
    const modal = document.getElementById('Modal');
    const closeBtn = document.getElementById('closeBtn');

// Ouvrir l'image au clic du bouton
    openImageBtn.onclick = function() {
        modal.style.display = 'flex'; // Afficher le modal
    };

// Fermer le modal au clic sur la croix ou sur le fond sombre
    closeBtn.onclick = function() {
        modal.style.display = 'none'; // Cacher le modal
    };

// Fermer le modal si on clique en dehors de l'image
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none'; // Cacher le modal si on clique en dehors
        }
    };
}

showCompetencies();


function zoomCompetencies() {
    let scale = 1; 
    const modalImage = document.getElementById('modalImage');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');

    zoomInBtn.onclick = function() {
        scale *= 1.1;
        modalImage.style.transform = `scale(${scale})`;
    };

    zoomOutBtn.onclick = function() {
        scale /= 1.1;
        modalImage.style.transform = `scale(${scale})`;
    };
}

zoomCompetencies();


/* Réalisations */

function tabsFilters() {
    const tabs = document.querySelectorAll('.portfolio__filters a');
    const projets = document.querySelectorAll('.portfolio .card');

    const resetLinks = () => {
        tabs.forEach(elem => {
            elem.classList.remove('active');
        });
    }
    const showProjets = (elem) => {
        console.log(elem);
        projets.forEach(projet => {

            let filter = projet.getAttribute('data-category');

            if (elem == 'all') {
                projet.parentNode.classList.remove('hide');
                return
            }

            console.log('test');
            /*if (filter !== elem) {
                projet.parentNode.classList.add('hide');
            } else {
                projet.parentNode.classList.remove('hide');
            }*/

            filter !== elem ? projet.parentNode.classList.add('hide') : projet.parentNode.classList.remove('hide');
        });
    }

    tabs.forEach(elem => {
        elem.addEventListener('click', (event) => {
            event.preventDefault();
            let filter = elem.getAttribute('data-filter');
            showProjets(filter)
            resetLinks();
            elem.classList.add('active');
        });
    });
}

tabsFilters();


function showProjetsDetails() {
    const links = document.querySelectorAll('.card__link');
            
    links.forEach(elem => {
        elem.addEventListener('click', (event) => {
            event.preventDefault();
            document.querySelector(`[id=${elem.dataset.id}]`).classList.toggle('show');
        });
    });
}


showProjetsDetails();

/* Réalisations */
// Configuration sécurisée
const BLOG_CONFIG = {
  API_URL: 'https://bblog-psi.vercel.app/api/articles',
  TIMEOUT: 10000, // 10 secondes max
  MAX_RETRIES: 2
};

// Fonction pour nettoyer/sécuriser le contenu HTML
function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html; // Échappe automatiquement le HTML
  return div.innerHTML;
}

// Fonction pour valider les données reçues
function validateArticle(article) {
  return article && 
         typeof article.title === 'string' && 
         typeof article.slug === 'string' && 
         typeof article.content === 'string' &&
         article.title.length > 0 &&
         article.slug.length > 0;
}

// Fonction principale pour charger les articles
async function loadBlogArticles() {
  const container = document.getElementById('articles-container');
  
  try {
    // Configuration sécurisée de fetch
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
    
    // Vérification de la réponse
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const articles = await response.json();
    
    // Validation des données
    if (!Array.isArray(articles)) {
      throw new Error('Format de données invalide');
    }
    
    // Filtrer et valider chaque article
    const validArticles = articles.filter(validateArticle);
    
    if (validArticles.length === 0) {
      container.innerHTML = '<p class="no-articles">Aucun article disponible pour le moment.</p>';
      return;
    }
    
    // Affichage sécurisé des articles
    displayArticles(validArticles, container);
    
  } catch (error) {
    console.error('Erreur lors du chargement des articles:', error.message);
    
    // Message d'erreur user-friendly (sans détails techniques)
    container.innerHTML = `
      <div class="error-message">
        <p>Impossible de charger les articles actuellement.</p>
        <button onclick="loadBlogArticles()" class="retry-btn">Réessayer</button>
      </div>
    `;
  }
}

// Fonction pour afficher les articles de manière sécurisée
function displayArticles(articles, container) {
  const articlesHTML = articles.map(article => `
    <article class="blog-article">
      <h3 class="article-title">${sanitizeHTML(article.title)}</h3>
      <div class="article-meta">
        <span class="article-date">${sanitizeHTML(article.date || '')}</span>
      </div>
      <div class="article-summary">
        ${sanitizeHTML(article.summary || article.content.substring(0, 150) + '...')}
      </div>
      <a href="#" class="article-link" data-slug="${sanitizeHTML(article.slug)}">
        Lire la suite →
      </a>
    </article>
  `).join('');
  
  container.innerHTML = articlesHTML;
  
  // Ajout des event listeners sécurisés
  addArticleEventListeners();
}

// Gestion sécurisée des clics sur les articles
function addArticleEventListeners() {
  document.querySelectorAll('.article-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const slug = this.dataset.slug;
      
      // Validation du slug
      if (slug && /^[a-zA-Z0-9-_]+$/.test(slug)) {
        openArticleModal(slug);
      } else {
        console.error('Slug invalide:', slug);
      }
    });
  });
}

// Fonction pour ouvrir l'article complet (modal ou page)
function openArticleModal(slug) {
  // À implémenter : affichage de l'article complet
  console.log('Ouverture article:', slug);
  // TODO: Modal avec contenu complet sécurisé
}

// Chargement automatique au démarrage
document.addEventListener('DOMContentLoaded', function() {
  // Vérifier que la section blog existe
  if (document.getElementById('articles-container')) {
    loadBlogArticles();
  }
});

