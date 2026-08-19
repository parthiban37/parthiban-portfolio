(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============ FOOTER YEAR ============ */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============ NAVBAR SCROLL STATE + PROGRESS ============ */
  const navbar = document.getElementById('navbar');
  const scrollProgress = document.getElementById('scrollProgress');
  const scrollTopBtn = document.getElementById('scrollTop');

  function onScroll() {
    const scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', scrollY > 20);
    scrollTopBtn.classList.toggle('visible', scrollY > 500);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    scrollProgress.style.width = progress + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* ============ MOBILE NAV TOGGLE ============ */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* ============ ACTIVE NAV LINK ON SCROLL (scroll-spy) ============ */
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const navLinkEls = Array.from(document.querySelectorAll('[data-nav]'));

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.getAttribute('id');
      const link = navLinkEls.find(l => l.getAttribute('href') === '#' + id);
      if (!link) return;
      if (entry.isIntersecting) {
        navLinkEls.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(sec => spyObserver.observe(sec));

  /* ============ SCROLL REVEAL ============ */
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReducedMotion) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ============ ANIMATED COUNTERS ============ */
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.getAttribute('data-count'));
      const decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
      const duration = prefersReducedMotion ? 0 : 1400;
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = decimals > 0 ? value.toFixed(decimals) : Math.round(value);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));

  /* ============ SKILL BAR FILL ON VIEW ============ */
  const skillCards = document.querySelectorAll('.skill-card');
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelector('.skill-bar span').style.transitionDelay = '0.1s';
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  skillCards.forEach(card => skillObserver.observe(card));

  /* ============ CONTACT FORM ============ */
  const contactForm = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const formData = new FormData(contactForm);

      submitButton.disabled = true;
      formNote.textContent = 'Sending your message...';

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(formData))
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Unable to send your message.');

        contactForm.reset();
        formNote.textContent = 'Thanks. Your message has been received.';
      } catch (error) {
        formNote.textContent = error.message;
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  document.querySelectorAll('.copy-email').forEach(button => {
    button.addEventListener('click', async () => {
      const email = button.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        button.innerHTML = 'Copied <i class="fa-solid fa-check"></i>';
        setTimeout(() => {
          button.innerHTML = 'Copy email <i class="fa-solid fa-copy"></i>';
        }, 1800);
      } catch {
        button.textContent = email;
      }
    });
  });

  /* ============ HERO NAME INTERACTION ============ */
  const heroName = document.getElementById('heroName');
  if (heroName) {
    heroName.addEventListener('click', () => {
      heroName.classList.remove('is-animating');
      void heroName.offsetWidth;
      heroName.classList.add('is-animating');
    });
    heroName.addEventListener('animationend', () => {
      heroName.classList.remove('is-animating');
    });
  }

  /* ============ HERO NEURAL NETWORK CANVAS ============ */
  const canvas = document.getElementById('neuralCanvas');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let width, height, nodes;
    const hero = canvas.closest('.hero');

    const COLORS = ['#3B82F6', '#93C5FD', '#1D4ED8'];

    function resize() {
      width = canvas.width = hero.offsetWidth;
      height = canvas.height = hero.offsetHeight;
      const count = Math.max(24, Math.min(60, Math.floor((width * height) / 26000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 140;
          if (dist < maxDist) {
            ctx.strokeStyle = `rgba(150, 160, 165, ${(1 - dist / maxDist) * 0.14})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = 0.75;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      requestAnimationFrame(step);
    }

    resize();
    step();
    window.addEventListener('resize', resize);
  }

})();
