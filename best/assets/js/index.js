/**
 * PDA Index Page — index.js
 * GSAP animations and interactive behavior
 */

/* Guard: if GSAP didn't load, bail silently */
if (typeof gsap === 'undefined') {
  console.warn('GSAP not loaded, showing content without animations');
  document.getElementById('loader').style.display = 'none';
} else {

  gsap.registerPlugin(ScrollTrigger);

  /* ── LOADER ── */
  const loaderEl = document.getElementById('loader');
  if (loaderEl) {
    gsap.timeline()
      .to('#loader-bar', { width: '100%', duration: 1.2, ease: 'power2.inOut' })
      .to(loaderEl, { opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: () => { loaderEl.style.display = 'none'; } }, '>');
    gsap.fromTo('#loader .loader-logo', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' });
  }

  /* ── CURSOR ── */
  const dot = document.getElementById('cursor-dot'), ring = document.getElementById('cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  gsap.ticker.add(() => {
    gsap.set(dot, { x: mx, y: my });
    rx += (mx - rx) * .1;
    ry += (my - ry) * .1;
    gsap.set(ring, { x: rx, y: ry });
  });

  /* ── NAV SCROLL ── */
  ScrollTrigger.create({
    start: 'top -60px',
    onUpdate: (s) => {
      document.getElementById('main-nav').classList.toggle('scrolled', s.direction > 0 || s.progress > 0);
    }
  });

  /* ── WAVE CANVAS ── */
  (function () {
    const c = document.getElementById('hero-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    let w, h, t = 0;

    function resize() {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(181,255,217,${0.012 + i * 0.003})`;
        ctx.lineWidth = 0.8;
        for (let x = 0; x <= w; x += 3) {
          const y = h * .28 + h * .44 * (i / 16)
            + Math.sin(x * .006 + t * .5 + i * .4) * 28
            + Math.sin(x * .012 - t * .3 + i * .2) * 16
            + Math.cos(x * .004 + t * .2) * 20;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      t += 0.01;
      requestAnimationFrame(draw);
    }
    draw();
  })();

  /* ── HERO REVEAL ── */
  const heroDelay = loaderEl ? 1.6 : 0.2;
  gsap.fromTo('.hero-stat',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, stagger: .07, duration: .7, ease: 'power3.out', delay: heroDelay }
  );
  gsap.fromTo('#hero-title .word',
    { yPercent: 110, opacity: 0 },
    { yPercent: 0, opacity: 1, stagger: .06, duration: .9, ease: 'power4.out', delay: heroDelay + .2 }
  );
  gsap.fromTo('.hero-bottom .body-text',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: .7, delay: heroDelay + .6, ease: 'power3.out' }
  );
  gsap.fromTo('.hero-cta',
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: .6, delay: heroDelay + .7, ease: 'power3.out' }
  );
  gsap.fromTo('.hero-scroll',
    { opacity: 0 },
    { opacity: 1, duration: .6, delay: heroDelay + 1 }
  );

  /* ── SCROLL TRIGGERS ── */
  gsap.utils.toArray('.g-up').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: .85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' }
      }
    );
  });

  gsap.utils.toArray('.g-left').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, x: -40 },
      {
        opacity: 1, x: 0, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      }
    );
  });

  gsap.utils.toArray('.g-right').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, x: 40 },
      {
        opacity: 1, x: 0, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      }
    );
  });

  gsap.utils.toArray('.g-scale').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, scale: .94 },
      {
        opacity: 1, scale: 1, duration: .85, ease: 'back.out(1.2)',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      }
    );
  });

  /* ── STAGGER GROUPS ── */
  gsap.fromTo('.how-step',
    { opacity: 0, y: 50 },
    {
      opacity: 1, y: 0, stagger: .12, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: '.how-steps', start: 'top 85%' }
    }
  );

  gsap.fromTo('.lang-card',
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0, stagger: .09, duration: .75, ease: 'power3.out',
      scrollTrigger: { trigger: '.lang-examples', start: 'top 85%' }
    }
  );

  gsap.fromTo('.hier-item',
    { opacity: 0, x: -24 },
    {
      opacity: 1, x: 0, stagger: .09, duration: .65, ease: 'power3.out',
      scrollTrigger: { trigger: '.hierarchy', start: 'top 85%' }
    }
  );

  gsap.fromTo('.pump-step',
    { opacity: 0, x: -16 },
    {
      opacity: 1, x: 0, stagger: .09, duration: .55, ease: 'power3.out',
      scrollTrigger: { trigger: '.pump-steps', start: 'top 85%' }
    }
  );

  gsap.fromTo('.app-card',
    { opacity: 0, y: 36 },
    {
      opacity: 1, y: 0, stagger: .07, duration: .65, ease: 'power3.out',
      scrollTrigger: { trigger: '.apps-grid', start: 'top 85%' }
    }
  );

  /* ── PARALLAX BG NUMBERS ── */
  gsap.utils.toArray('.bg-number').forEach(el => {
    gsap.to(el, {
      y: '-12%', ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ── MARQUEE ── */
  document.querySelector('.marquee-wrap').addEventListener('mouseenter', () => {
    document.querySelector('.marquee-track').style.animationPlayState = 'paused';
  });
  document.querySelector('.marquee-wrap').addEventListener('mouseleave', () => {
    document.querySelector('.marquee-track').style.animationPlayState = 'running';
  });

  /* ── LANG CARD NAV ── */
  document.querySelectorAll('.lang-card-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      gsap.to('body', { opacity: 0, duration: .3, ease: 'power2.in', onComplete: () => window.location.href = btn.href });
    });
  });

} /* end gsap guard */
