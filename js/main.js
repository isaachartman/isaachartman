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
     Each [data-lightbox] thumbnail opens a full-size viewer. Its
     data-type picks the media:
       image (default)  data-full = image URL (falls back to the thumbnail)
       video            data-full = video file (the thumbnail is its poster)
       model            data-full = .stl or .obj file, shown as a rotatable
                        3D view (three.js, loaded only when first opened)
     Optional text for the details box under the media:
       data-title, data-caption, and data-details — lines separated by |,
       where "Label: value" gets a styled label.
     Arrow buttons, ← / → keys and swipes step through the set; Escape
     and a click on the backdrop close it (shared modal handlers above).
  ----------------------------------------------------- */
  var lightbox = document.getElementById('lightbox');
  var lbThumbs = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));

  if (lightbox && lbThumbs.length) {
    var lbImage = document.getElementById('lightboxImage');
    var lbVideo = document.getElementById('lightboxVideo');
    var lbModel = document.getElementById('lightboxModel');
    var lbCount = document.getElementById('lightboxCount');
    var lbInfo = document.getElementById('lightboxInfo');
    var lbTitle = document.getElementById('lightboxTitle');
    var lbCaption = document.getElementById('lightboxCaption');
    var lbDetails = document.getElementById('lightboxDetails');
    var lbIndex = 0;
    var lbToken = 0;       // bumped on every show, so late async work can tell it is stale
    var lbModelView = null; // the live three.js scene, kept so it can be torn down

    var lbType = function (el) { return el.getAttribute('data-type') || 'image'; };
    var lbSrc = function (i) {
      var el = lbThumbs[i];
      return el.getAttribute('data-full') || el.querySelector('img').src;
    };

    /* ---- 3D models (three.js is fetched the first time one is opened) ---- */
    var lbThree = null;
    var lbLoadThree = function () {
      if (!lbThree) {
        lbThree = Promise.all([
          import('three'),
          import('three/addons/controls/OrbitControls.js'),
          import('three/addons/loaders/STLLoader.js'),
          import('three/addons/loaders/OBJLoader.js')
        ]).then(function (m) {
          return { THREE: m[0], OrbitControls: m[1].OrbitControls, STLLoader: m[2].STLLoader, OBJLoader: m[3].OBJLoader };
        });
        lbThree.catch(function () { lbThree = null; }); // allow a retry after a network failure
      }
      return lbThree;
    };

    var lbStopModel = function () {
      if (!lbModelView) return;
      var v = lbModelView;
      lbModelView = null;
      cancelAnimationFrame(v.raf);
      v.observer.disconnect();
      v.controls.dispose();
      v.scene.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach(function (m) { m.dispose(); });
      });
      v.renderer.dispose();
      v.renderer.domElement.remove();
    };

    var lbStartModel = function (el, token) {
      var url = el.getAttribute('data-full');
      var format = (el.getAttribute('data-format') || url.split('?')[0].split('.').pop()).toLowerCase();
      lbModel.setAttribute('data-status', 'loading');

      var fail = function () {
        if (token === lbToken) lbModel.setAttribute('data-status', 'error');
      };

      lbLoadThree().then(function (lib) {
        var THREE = lib.THREE;
        var Loader = format === 'obj' ? lib.OBJLoader : lib.STLLoader;
        new Loader().load(url, function (data) {
          if (token !== lbToken) return; // the viewer moved on while this was loading
          try {
            var material = new THREE.MeshStandardMaterial({
              color: el.getAttribute('data-color') || '#d9d8d4',
              roughness: 0.55,
              metalness: 0.1,
              side: THREE.DoubleSide // open or inverted meshes still read as solid
            });
            var object;
            if (format === 'obj') {
              object = data;
              object.traverse(function (o) {
                if (!o.isMesh) return;
                o.material = material;
                if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
              });
            } else {
              if (!data.attributes.normal) data.computeVertexNormals();
              object = new THREE.Mesh(data, material);
            }

            // STL files are usually Z-up (CAD); OBJ files usually Y-up. data-up overrides.
            var zUp = (el.getAttribute('data-up') || (format === 'stl' ? 'z' : 'y')) === 'z';
            var group = new THREE.Group();
            group.add(object);
            if (zUp) group.rotation.x = -Math.PI / 2;
            group.updateMatrixWorld(true);

            // Centre the model on the origin and frame it.
            var box = new THREE.Box3().setFromObject(group);
            var size = box.getSize(new THREE.Vector3());
            group.position.sub(box.getCenter(new THREE.Vector3()));
            var radius = Math.max(size.x, size.y, size.z) || 1;

            var scene = new THREE.Scene();
            scene.add(group);
            scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a38, 1.4));
            var key = new THREE.DirectionalLight(0xffffff, 2.4);
            key.position.set(radius, radius * 1.5, radius);
            scene.add(key);
            var fill = new THREE.DirectionalLight(0xffffff, 0.9);
            fill.position.set(-radius, radius * 0.4, -radius);
            scene.add(fill);

            var camera = new THREE.PerspectiveCamera(38, 1, radius / 100, radius * 100);
            var dist = (radius / 2) / Math.tan(THREE.MathUtils.degToRad(19)) * 1.4;
            camera.position.set(dist * 0.6, dist * 0.45, dist);

            var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            lbModel.appendChild(renderer.domElement);

            var controls = new lib.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.autoRotate = !reduceMotion;
            controls.autoRotateSpeed = 1.4;
            controls.addEventListener('start', function () { controls.autoRotate = false; });

            var resize = function () {
              var w = lbModel.clientWidth, h = lbModel.clientHeight;
              if (!w || !h) return;
              renderer.setSize(w, h);
              camera.aspect = w / h;
              camera.updateProjectionMatrix();
            };
            var observer = new ResizeObserver(resize);
            observer.observe(lbModel);
            resize();

            var view = { scene: scene, renderer: renderer, controls: controls, observer: observer, raf: 0 };
            var tick = function () {
              view.raf = requestAnimationFrame(tick);
              controls.update();
              renderer.render(scene, camera);
            };
            lbModelView = view;
            tick();
            lbModel.setAttribute('data-status', '');
          } catch (err) {
            fail();
          }
        }, undefined, fail);
      }).catch(fail);
    };

    /* ---- Showing an item ---- */
    var lbFillInfo = function (el) {
      var title = el.getAttribute('data-title') || '';
      var caption = el.getAttribute('data-caption') || '';
      var lines = (el.getAttribute('data-details') || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);

      lbTitle.textContent = title;
      lbTitle.hidden = !title;
      lbCaption.textContent = caption;
      lbCaption.hidden = !caption;
      lbDetails.innerHTML = '';
      lines.forEach(function (line) {
        var li = document.createElement('li');
        var colon = line.indexOf(':');
        if (colon > 0 && colon < 24) {
          var label = document.createElement('span');
          label.className = 'lightbox-label';
          label.textContent = line.slice(0, colon);
          li.appendChild(label);
          li.appendChild(document.createTextNode(line.slice(colon + 1).trim()));
        } else {
          li.textContent = line;
        }
        lbDetails.appendChild(li);
      });
      lbDetails.hidden = !lines.length;
      lbInfo.hidden = !(title || caption || lines.length);
    };

    var lbStopMedia = function () {
      lbToken++;
      lbStopModel();
      lbVideo.pause();
      if (lbVideo.getAttribute('src')) { lbVideo.removeAttribute('src'); lbVideo.load(); } // stop buffering
    };

    var lbShow = function (i) {
      lbIndex = (i + lbThumbs.length) % lbThumbs.length;
      var el = lbThumbs[lbIndex];
      var type = lbType(el);
      lbStopMedia();
      var token = lbToken;

      lbImage.hidden = type !== 'image';
      lbVideo.hidden = type !== 'video';
      lbModel.hidden = type !== 'model';
      lbModel.setAttribute('data-status', '');

      if (type === 'video') {
        lbVideo.poster = el.querySelector('img').src;
        lbVideo.src = lbSrc(lbIndex);
      } else if (type === 'model') {
        lbStartModel(el, token);
      } else {
        lbImage.classList.add('is-loading');
        lbImage.src = lbSrc(lbIndex);
        lbImage.alt = el.getAttribute('data-title') || el.querySelector('img').alt || ('Exploration ' + (lbIndex + 1));
        // Warm the neighbouring images so stepping through feels instant.
        [lbIndex - 1, lbIndex + 1].forEach(function (n) {
          var j = (n + lbThumbs.length) % lbThumbs.length;
          if (lbType(lbThumbs[j]) === 'image') new Image().src = lbSrc(j);
        });
      }

      lbFillInfo(el);
      lbCount.textContent = (lbIndex + 1) + ' / ' + lbThumbs.length;
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

    // Closing by any route (button, Escape, backdrop) stops video and frees the 3D scene.
    new MutationObserver(function () {
      if (!lightbox.classList.contains('is-open')) lbStopMedia();
    }).observe(lightbox, { attributes: true, attributeFilter: ['class'] });

    document.getElementById('lightboxClose').addEventListener('click', function () { closeModal(lightbox); });
    document.getElementById('lightboxPrev').addEventListener('click', function () { lbShow(lbIndex - 1); });
    document.getElementById('lightboxNext').addEventListener('click', function () { lbShow(lbIndex + 1); });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.target === lbVideo) return; // arrows seek inside a focused video
      if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
      if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
    });

    // Swipe left / right on touch screens (not when the touch starts on a video or 3D view).
    var lbTouchX = null;
    lightbox.addEventListener('touchstart', function (e) {
      lbTouchX = e.target.closest('.lightbox-model, video') ? null : e.changedTouches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      if (lbTouchX === null) return;
      var dx = e.changedTouches[0].clientX - lbTouchX;
      lbTouchX = null;
      if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

})();
