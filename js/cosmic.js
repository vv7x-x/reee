/**
 * Cosmic Living Library — Starfield, particles, parallax
 */

function createStarfield(container = document.body) {
  const canvas = document.createElement('canvas');
  canvas.id = 'cosmic-starfield';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:-3;width:100%;height:100%;pointer-events:none;';
  container.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let stars = [];
  const count = 180;
  let animationId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now() * 0.001;
    stars.forEach((s) => {
      const twinkle = Math.sin(time + s.twinkle) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 213, 163, ${s.opacity * twinkle})`;
      ctx.fill();
    });
    animationId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
  return () => {
    window.removeEventListener('resize', resize);
    cancelAnimationFrame(animationId);
  };
}

function createParticles(container = document.body, count = 25) {
  const wrap = document.createElement('div');
  wrap.className = 'cosmic-particles';
  wrap.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;';
  container.appendChild(wrap);

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 4 + 2;
    const delay = -Math.random() * 5;
    const duration = 12 + Math.random() * 10;
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(157, 126, 201, ${Math.random() * 0.4 + 0.2});
      animation: particle-float ${duration}s ease-in-out infinite;
      animation-delay: ${delay}s;
    `;
    wrap.appendChild(p);
  }

  if (!document.getElementById('particle-keyframes')) {
    const style = document.createElement('style');
    style.id = 'particle-keyframes';
    style.textContent = `
      @keyframes particle-float {
        0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
        25% { transform: translate(10px, -20px) scale(1.2); opacity: 1; }
        50% { transform: translate(-15px, -10px) scale(0.9); opacity: 0.5; }
        75% { transform: translate(5px, -30px) scale(1.1); opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
  }
}

/** Parallax: move elements slightly by mouse (optional) */
function initParallax(selector = '.book-card-3d', strength = 8) {
  const elements = document.querySelectorAll(selector);
  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    elements.forEach((el, i) => {
      const factor = 1 + (i % 3) * 0.3;
      const x = dx * strength * factor;
      const y = dy * strength * factor;
      el.style.transform = `translate(${x}px, ${y}px) rotateY(${x * 0.5}deg) rotateX(${-y * 0.5}deg)`;
    });
  });
}

/** Tilt on hover (enhance 3D book cards) */
function initTilt(selector = '.book-card-3d') {
  document.querySelectorAll(selector).forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1200px) rotateY(${-x * 12}deg) rotateX(${y * 10}deg) scale(1.05)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

if (typeof window !== 'undefined') {
  window.createStarfield = createStarfield;
  window.createParticles = createParticles;
  window.initParallax = initParallax;
  window.initTilt = initTilt;
}
