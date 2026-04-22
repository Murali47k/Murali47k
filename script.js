document.addEventListener('DOMContentLoaded', () => {

  /* ────────────────────────────────
     NAV — scroll state + burger
  ──────────────────────────────── */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  // Close mobile menu on link click
  document.querySelectorAll('.mm-link').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  // Close mobile menu on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
    }
  });


  /* ────────────────────────────────
     SCROLL REVEAL
  ──────────────────────────────── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


  /* ────────────────────────────────
     CAROUSEL
     - 2 cards visible on desktop
     - 1 card on mobile
     - Dot indicators
     - Touch / drag swipe
  ──────────────────────────────── */
  class Carousel {
    constructor(trackId, dotContainerId) {
      this.track = document.getElementById(trackId);
      this.dotContainer = document.getElementById(dotContainerId);
      if (!this.track) return;

      this.cards = Array.from(this.track.children);
      this.total = this.cards.length;
      this.index = 0;
      this.dragging = false;
      this.startX = 0;
      this.startTranslate = 0;
      this.currentTranslate = 0;

      this.buildDots();
      this.bindButtons();
      this.bindDrag();
      this.bindResize();
      this.go(0, false);
    }

    /* how many cards are visible based on viewport */
    perView() {
      return window.innerWidth <= 900 ? 1 : 2;
    }

    /* max index we can scroll to */
    maxIndex() {
      return Math.max(0, this.total - this.perView());
    }

    /* pixel offset for a given index */
    offsetFor(i) {
      const pv = this.perView();
      const gap = 24; // matches 1.5rem
      const cardWidth = (this.track.parentElement.offsetWidth - gap * (pv - 1)) / pv;
      return i * (cardWidth + gap);
    }

    go(newIndex, animate = true) {
      this.index = Math.max(0, Math.min(newIndex, this.maxIndex()));
      this.currentTranslate = -this.offsetFor(this.index);

      this.track.style.transition = animate
        ? 'transform 0.45s cubic-bezier(0.4,0,0.2,1)'
        : 'none';
      this.track.style.transform = `translateX(${this.currentTranslate}px)`;

      this.updateDots();
      this.updateButtons();
    }

    buildDots() {
      if (!this.dotContainer) return;
      this.dotContainer.innerHTML = '';
      // One dot per "page"
      const pages = this.maxIndex() + 1;
      for (let i = 0; i < pages; i++) {
        const d = document.createElement('div');
        d.className = 'car-dot' + (i === 0 ? ' active' : '');
        d.addEventListener('click', () => this.go(i));
        this.dotContainer.appendChild(d);
      }
    }

    updateDots() {
      if (!this.dotContainer) return;
      this.dotContainer.querySelectorAll('.car-dot').forEach((d, i) => {
        d.classList.toggle('active', i === this.index);
      });
    }

    updateButtons() {
      // Find sibling prev/next buttons
      const controls = this.track.closest('.carousel-wrap').querySelector('.carousel-controls');
      if (!controls) return;
      const [prevBtn, , nextBtn] = controls.querySelectorAll('.car-btn');
      if (prevBtn) prevBtn.disabled = this.index === 0;
      if (nextBtn) nextBtn.disabled = this.index >= this.maxIndex();
    }

    bindButtons() {
      const controls = this.track.closest('.carousel-wrap').querySelector('.carousel-controls');
      if (!controls) return;
      controls.querySelectorAll('.car-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const dir = parseInt(btn.dataset.dir);
          this.go(this.index + dir);
        });
      });
    }

    bindResize() {
      let timer;
      window.addEventListener('resize', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          this.buildDots();
          this.go(Math.min(this.index, this.maxIndex()), false);
        }, 120);
      });
    }

    /* Touch / mouse drag */
    bindDrag() {
      const el = this.track;

      const getX = e => e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;

      const onStart = (e) => {
        this.dragging = true;
        this.startX = getX(e);
        this.startTranslate = this.currentTranslate;
        el.style.transition = 'none';
        el.style.cursor = 'grabbing';
      };

      const onMove = (e) => {
        if (!this.dragging) return;
        const dx = getX(e) - this.startX;
        el.style.transform = `translateX(${this.startTranslate + dx}px)`;
      };

      const onEnd = (e) => {
        if (!this.dragging) return;
        this.dragging = false;
        el.style.cursor = '';

        const dx = (e.type.includes('mouse') ? e.pageX : e.changedTouches[0].clientX) - this.startX;
        const threshold = this.track.parentElement.offsetWidth * 0.18;

        if (dx < -threshold) {
          this.go(this.index + 1);
        } else if (dx > threshold) {
          this.go(this.index - 1);
        } else {
          this.go(this.index);
        }
      };

      // Mouse
      el.addEventListener('mousedown', onStart);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);

      // Touch
      el.addEventListener('touchstart', onStart, { passive: true });
      el.addEventListener('touchmove', onMove, { passive: true });
      el.addEventListener('touchend', onEnd);

      // Prevent link drags from firing
      el.querySelectorAll('a').forEach(a => {
        a.addEventListener('dragstart', e => e.preventDefault());
      });
    }
  }

  /* Initialise all carousels */
  new Carousel('track-research', 'dots-research');
  new Carousel('track-course',   'dots-course');
  new Carousel('track-personal', 'dots-personal');


  /* ────────────────────────────────
     SMOOTH ACTIVE NAV HIGHLIGHT
     (optional — highlights current section)
  ──────────────────────────────── */
  const sections = document.querySelectorAll('section[id], div[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navAnchors.forEach(a => {
          a.style.color = a.getAttribute('href') === '#' + entry.target.id
            ? 'var(--text)' : '';
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => sectionObserver.observe(s));

});
