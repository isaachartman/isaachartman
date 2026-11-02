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
     CURSOR DOT — tracks the pointer 1:1. A short chain of
     smaller, fainter dots eases along behind it as a fading
     trail; each follows the one ahead, and the loop stops once
     they have all caught up.
  ----------------------------------------------------- */
  var hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (hasFinePointer) {
    var TRAIL_COUNT = 4;
    var TRAIL_EASE = 0.32;
    var trail = [];
    var pointer = { x: 0, y: 0, seen: false };
    var overImage = false;
    var trailRunning = false;

    if (!reduceMotion) {
      for (var i = 0; i < TRAIL_COUNT; i++) {
        var dot = document.createElement('span');
        dot.className = 'cursor-trail-dot';
        dot.setAttribute('aria-hidden', 'true');
        document.body.insertBefore(dot, cursorDot);
        trail.push({ el: dot, x: 0, y: 0 });
      }
    }

    function drawTrail(t, i) {
      var fade = 1 - (i + 1) / (TRAIL_COUNT + 1);
      t.el.style.transform = 'translate(' + t.x + 'px, ' + t.y + 'px) scale(' + (0.35 + fade * 0.55) + ')';
      t.el.style.opacity = overImage ? (fade * 0.4).toFixed(3) : 0;
    }

    function stepTrail() {
      var lead = pointer;
      var moving = false;
      trail.forEach(function (t, i) {
        t.x += (lead.x - t.x) * TRAIL_EASE;
        t.y += (lead.y - t.y) * TRAIL_EASE;
        if (Math.abs(lead.x - t.x) > 0.2 || Math.abs(lead.y - t.y) > 0.2) moving = true;
        drawTrail(t, i);
        lead = t;
      });
      if (moving) {
        requestAnimationFrame(stepTrail);
      } else {
        trailRunning = false;
      }
    }

    window.addEventListener('mousemove', function (e) {
      cursorDot.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px)';
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!trail.length) return;
      if (!pointer.seen) {
        pointer.seen = true;
        trail.forEach(function (t) { t.x = e.clientX; t.y = e.clientY; });
      }
      if (!trailRunning) {
        trailRunning = true;
        requestAnimationFrame(stepTrail);
      }
    });

    document.querySelectorAll('.hover-img').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        overImage = true;
        cursorDot.classList.add('active');
        // Snap the trail to the pointer so it doesn't streak in from where it last rested.
        trail.forEach(function (t) { t.x = pointer.x; t.y = pointer.y; });
      });
      el.addEventListener('mouseleave', function () {
        overImage = false;
        cursorDot.classList.remove('active');
        trail.forEach(drawTrail);
      });
    });
  }

  /* -----------------------------------------------------
     TOUCH: color on scroll
     With no hover on touch screens, an image goes from black
     and white to color while it crosses the middle band of the
     viewport, and back again as it scrolls away.
  ----------------------------------------------------- */
  if (window.matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
    var focusObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('in-view', entry.isIntersecting);
      });
    }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });

    document.querySelectorAll('.hover-img').forEach(function (el) {
      focusObserver.observe(el);
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
  var pmMedia = pmImage.parentNode;
  var pmLink = document.getElementById('pmLink');
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
      // Optional data-images: a comma-separated list stacked in the media column
      // (data-img stays the single image / cover for projects without a gallery).
      var images = (card.getAttribute('data-images') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      var title = card.getAttribute('data-title') || '';
      pmMedia.querySelectorAll('.pm-extra').forEach(function (img) { img.remove(); });
      pmImage.src = images.length ? images[0] : (card.getAttribute('data-img') || '');
      pmImage.alt = title;
      images.slice(1).forEach(function (src, i) {
        var img = document.createElement('img');
        img.className = 'pm-extra';
        img.src = src;
        img.alt = title + ' — view ' + (i + 2);
        pmMedia.appendChild(img);
      });
      pmMedia.classList.toggle('has-gallery', images.length > 0);
      projectModal.querySelector('.modal').scrollTop = 0;
      pmDate.textContent = card.getAttribute('data-date') || '';
      pmCategory.textContent = card.getAttribute('data-category') || '';
      pmDescription.textContent = card.getAttribute('data-description') || '';
      // Optional data-url: a "Visit website" link, hidden for projects without one.
      var url = card.getAttribute('data-url') || '';
      pmLink.hidden = !url;
      pmLink.href = url || '#';

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

  /* -----------------------------------------------------
     EXPLORATIONS LIGHTBOX
     Each [data-lightbox] thumbnail opens a full-size viewer
     (data-full, falling back to the thumbnail's own src).
     Arrow buttons, ← / → keys and swipes step through the
     set; Escape and a click on the backdrop close it (shared
     modal handlers above).
  ----------------------------------------------------- */
  var lightbox = document.getElementById('lightbox');
  var lbThumbs = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));

  if (lightbox && lbThumbs.length) {
    var lbImage = document.getElementById('lightboxImage');
    var lbCount = document.getElementById('lightboxCount');
    var lbIndex = 0;

    var lbSrc = function (i) {
      var el = lbThumbs[i];
      return el.getAttribute('data-full') || el.querySelector('img').src;
    };

    var lbShow = function (i) {
      lbIndex = (i + lbThumbs.length) % lbThumbs.length;
      lbImage.classList.add('is-loading');
      lbImage.src = lbSrc(lbIndex);
      lbImage.alt = lbThumbs[lbIndex].querySelector('img').alt || ('Exploration ' + (lbIndex + 1));
      lbCount.textContent = (lbIndex + 1) + ' / ' + lbThumbs.length;
      // Warm the neighbours so stepping through feels instant.
      [lbIndex - 1, lbIndex + 1].forEach(function (n) {
        new Image().src = lbSrc((n + lbThumbs.length) % lbThumbs.length);
      });
    };

    lbImage.addEventListener('load', function () { lbImage.classList.remove('is-loading'); });

    lbThumbs.forEach(function (el, i) {
      var open = function () {
        lbShow(i);
        openModal(lightbox);
      };
      el.addEventListener('click', open);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });

    document.getElementById('lightboxClose').addEventListener('click', function () { closeModal(lightbox); });
    document.getElementById('lightboxPrev').addEventListener('click', function () { lbShow(lbIndex - 1); });
    document.getElementById('lightboxNext').addEventListener('click', function () { lbShow(lbIndex + 1); });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
      if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
    });

    // Swipe left / right on touch screens.
    var lbTouchX = null;
    lightbox.addEventListener('touchstart', function (e) { lbTouchX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      if (lbTouchX === null) return;
      var dx = e.changedTouches[0].clientX - lbTouchX;
      lbTouchX = null;
      if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

})();
