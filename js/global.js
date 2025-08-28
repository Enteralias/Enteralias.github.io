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