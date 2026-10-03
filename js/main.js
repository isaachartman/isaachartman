(function () {
  'use strict';

  var nav = document.getElementById('siteNav');
  var navLinksEl = document.getElementById('navLinks');
  var navToggle = document.getElementById('navToggle');
  var logoWord = document.getElementById('logoWord');
  var logoSection = document.getElementById('logoSection');
  var hero = document.getElementById('hero');
  var cursorDot = document.getElementById('cursorDot');

  /* -----------------------------------------------------
     SMOOTH SCROLL WITH EASING
     Native `scroll-behavior: smooth` has no easing control,
     so anchor clicks are driven manually with easeInOutCubic.
  ----------------------------------------------------- */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smoothScrollTo(targetY, duration) {
    var startY = window.pageYOffset;
    var distance = targetY - startY;
    var startTime = null;

    function step(timestamp) {
      if (startTime === null) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  document.querySelectorAll('[data-scroll]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#' || href.length < 2) return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var navHeight = nav.offsetHeight;
      var targetY = target.getBoundingClientRect().top + window.pageYOffset - (href === '#hero' ? 0 : navHeight + 12);
      smoothScrollTo(Math.max(targetY, 0), 900);
      closeMobileNav();
    });
  });

  /* -----------------------------------------------------
     MOBILE NAV TOGGLE
  ----------------------------------------------------- */
  function closeMobileNav() {
    navLinksEl.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  navToggle.addEventListener('click', function () {
    var isOpen = navLinksEl.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  /* -----------------------------------------------------
     NAV: glass state + logo -> section title morph
     Only wired up on pages that actually have a #hero — other
     pages (e.g. the All Projects list) just keep the plain
     wordmark and the non-transparent glass nav throughout.
  ----------------------------------------------------- */
  if (hero) {
    var heroObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          nav.classList.toggle('on-hero', entry.isIntersecting && entry.intersectionRatio > 0.6);
        });
      },
      { threshold: [0, 0.6, 1] }
    );
    heroObserver.observe(hero);

    var sections = Array.prototype.slice.call(document.querySelectorAll('.section[data-nav-title]'));
    var currentTitle = 'Home';

    var setLogoState = function (title, showSection) {
      if (showSection) {
        logoWord.classList.add('is-hidden');
        logoSection.classList.add('is-visible');
        if (logoSection.textContent !== title) logoSection.textContent = title;
      } else {
        logoWord.classList.remove('is-hidden');
        logoSection.classList.remove('is-visible');
      }
    };

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            currentTitle = entry.target.getAttribute('data-nav-title');
          }
        });
        var pastHero = window.pageYOffset > hero.offsetHeight * 0.7;
        setLogoState(currentTitle, pastHero);
      },
      { rootMargin: '-' + (84 + 40) + 'px 0px -60% 0px', threshold: 0 }
    );
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* -----------------------------------------------------
     CURSOR DOT — tracks the pointer 1:1, no lag/trail.
  ----------------------------------------------------- */
  var hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (hasFinePointer) {
    window.addEventListener('mousemove', function (e) {
      cursorDot.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px)';
    });

    document.querySelectorAll('.hover-img').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursorDot.classList.add('active'); });
      el.addEventListener('mouseleave', function () { cursorDot.classList.remove('active'); });
    });
  }

  /* -----------------------------------------------------
     HERO PARALLAX
     The background drifts at a fraction of scroll speed.
     .hero-bg is oversized in CSS (top:-8%, height:116%) so
     it has travel room without ever revealing an edge; the
     shift is clamped so it can't outrun that overscan.
  ----------------------------------------------------- */
  var heroBg = hero ? hero.querySelector('.hero-bg') : null;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroBg && !prefersReducedMotion) {
    var parallaxRate = 0.12;
    var parallaxTicking = false;

    var updateParallax = function () {
      var maxShift = hero.offsetHeight * parallaxRate;
      var shift = Math.min(window.pageYOffset * parallaxRate, maxShift);
      heroBg.style.transform = 'translate3d(0, ' + (-shift) + 'px, 0)';
      parallaxTicking = false;
    };

    window.addEventListener('scroll', function () {
      if (!parallaxTicking) {
        window.requestAnimationFrame(updateParallax);
        parallaxTicking = true;
      }
    }, { passive: true });

    updateParallax();
  }

  /* -----------------------------------------------------
     SCROLL REVEAL
     Fades + slides each .reveal element into place the first
     time it enters the viewport, then stops watching it (no
     re-triggering on scroll back up). Skipped under reduced
     motion — everything just renders in its final state.
  ----------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length) {
    if (prefersReducedMotion) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

      revealEls.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  /* -----------------------------------------------------
     MODAL HELPERS
  ----------------------------------------------------- */
  function openModal(modal) {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  }
  function closeModal(modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.is-open').forEach(closeModal);
    }
  });

  /* -----------------------------------------------------
     CONTACT MODAL
  ----------------------------------------------------- */
  var contactModal = document.getElementById('contactModal');
  document.querySelectorAll('.contact-trigger').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openModal(contactModal);
    });
  });
  document.getElementById('contactModalClose').addEventListener('click', function () {
    closeModal(contactModal);
  });
  // Cloudflare Worker that emails the message (source: contact-worker/)
  var FORM_ENDPOINT = 'https://contact-form.isaac-hartman.workers.dev';
  var contactForm = document.getElementById('contactForm');
  var formNote = document.getElementById('formNote');
  var sendBtn = contactForm.querySelector('button[type="submit"]');
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    sendBtn.disabled = true;
    formNote.textContent = 'Sending…';
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(contactForm)
    }).then(function (res) {
      if (!res.ok) throw new Error('bad response');
      contactForm.reset();
      formNote.textContent = 'Thanks — your message was sent.';
    }).catch(function () {
      formNote.textContent = 'Something went wrong. Please try again.';
    }).then(function () { sendBtn.disabled = false; });
  });

  /* -----------------------------------------------------
     PROJECT LIGHTBOX MODAL
  ----------------------------------------------------- */
  var projectModal = document.getElementById('projectModal');
  var pmImage = document.getElementById('pmImage');
  var pmDate = document.getElementById('pmDate');
  var pmCategory = document.getElementById('pmCategory');
  var pmDescription = document.getElementById('pmDescription');
  var pmDeliverables = document.getElementById('pmDeliverables');
  var pmDeliverablesTag = document.getElementById('pmDeliverablesTag');
  var projectModalTitle = document.getElementById('projectModalTitle');

  document.querySelectorAll('[data-project]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      projectModalTitle.textContent = card.getAttribute('data-title') || '';
      pmImage.src = card.getAttribute('data-img') || '';
      pmImage.alt = card.getAttribute('data-title') || '';
      pmDate.textContent = card.getAttribute('data-date') || '';
      pmCategory.textContent = card.getAttribute('data-category') || '';
      pmDescription.textContent = card.getAttribute('data-description') || '';

      var deliverables = (card.getAttribute('data-deliverables') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      pmDeliverables.innerHTML = '';
      if (deliverables.length) {
        pmDeliverablesTag.style.display = '';
        deliverables.forEach(function (d) {
          var li = document.createElement('li');
          li.textContent = d;
          pmDeliverables.appendChild(li);
        });
      } else {
        pmDeliverablesTag.style.display = 'none';
      }
      openModal(projectModal);
    });
  });
  document.getElementById('projectModalClose').addEventListener('click', function () {
    closeModal(projectModal);
  });

})();
