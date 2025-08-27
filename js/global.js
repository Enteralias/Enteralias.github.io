/* global.js - Version nettoyée sans le blog */

// Menu mobile
function menuMobile() {
    const btn = document.querySelector('.burger');
    const header = document.querySelector('.header');
    const links = document.querySelectorAll('.navbar a');

    if (!btn || !header) return;

    btn.addEventListener('click', () => {
        header.classList.toggle('show-nav');
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            header.classList.remove('show-nav');  
        });
    });
}

// Filtres portfolio (réalisations)
function tabsFilters() {
    const tabs = document.querySelectorAll('.portfolio__filters a');
    const projets = document.querySelectorAll('.portfolio .card');

    if (tabs.length === 0 || projets.length === 0) return;

    const resetLinks = () => {
        tabs.forEach(elem => {
            elem.classList.remove('active');
        });
    }

    const showProjets = (filterValue) => {
        console.log('Filtre sélectionné:', filterValue);
        
        projets.forEach(projet => {
            const filter = projet.getAttribute('data-category');

            if (filterValue === 'all') {
                projet.parentNode.classList.remove('hide');
            } else {
                if (filter !== filterValue) {
                    projet.parentNode.classList.add('hide');
                } else {
                    projet.parentNode.classList.remove('hide');
                }
            }
        });
    }

    tabs.forEach(elem => {
        elem.addEventListener('click', (event) => {
            event.preventDefault();
            const filter = elem.getAttribute('data-filter');
            showProjets(filter);
            resetLinks();
            elem.classList.add('active');
        });
    });
}

// Détails des projets (modal)
function showProjetsDetails() {
    const links = document.querySelectorAll('.card__link');
    
    if (links.length === 0) return;
            
    links.forEach(elem => {
        elem.addEventListener('click', (event) => {
            event.preventDefault();
            const targetModal = document.querySelector(`[id=${elem.dataset.id}]`);
            if (targetModal) {
                targetModal.classList.toggle('show');
            }
        });
    });

    // Fermer les modals en cliquant ailleurs
    document.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            if (!modal.contains(event.target) && !event.target.closest('.card__link')) {
                modal.classList.remove('show');
            }
        });
    });
}

// Fonction pour les compétences (si vous la réactivez plus tard)
/*
function showCompetencies() {
    const openImageBtn = document.getElementById('open');
    const modal = document.getElementById('Modal');
    const closeBtn = document.getElementById('closeBtn');
    
    if (!openImageBtn || !modal || !closeBtn) {
        console.log('Élément modal désactivé');
        return;
    }
    
    // Ouvrir l'image au clic du bouton
    openImageBtn.onclick = function() {
        modal.style.display = 'flex';
    };

    // Fermer le modal au clic sur la croix ou sur le fond sombre
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };

    // Fermer le modal si on clique en dehors de l'image
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

function zoomCompetencies() {
    let scale = 1; 
    const modalImage = document.getElementById('modalImage');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');

    if (!modalImage || !zoomInBtn || !zoomOutBtn) return;

    zoomInBtn.onclick = function() {
        scale *= 1.1;
        modalImage.style.transform = `scale(${scale})`;
    };

    zoomOutBtn.onclick = function() {
        scale /= 1.1;
        modalImage.style.transform = `scale(${scale})`;
    };
}
*/

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation global.js');
    
    // Menu mobile
    menuMobile();
    
    // Portfolio (si présent sur la page)
    tabsFilters();
    showProjetsDetails();
    
    // Compétences (décommenté si nécessaire)
    // showCompetencies();
    // zoomCompetencies();
});