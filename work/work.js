// ===== PAGE LOAD PROGRESS BAR =====
(function () {
    const bar = document.createElement('div');
    bar.id = 'page-progress-bar';
    document.body.prepend(bar);
    let width = 0;
    const step = () => {
        if (width < 80) { width += (80 - width) * 0.08 + 0.4; bar.style.width = width + '%'; requestAnimationFrame(step); }
    };
    requestAnimationFrame(step);
    window.addEventListener('load', () => { bar.style.width = '100%'; setTimeout(() => bar.classList.add('done'), 600); });
})();

// ===== CUSTOM CURSOR =====
(function () {
    if (window.matchMedia('(hover: none)').matches || window.innerWidth <= 1024) return;
    const dot = document.createElement('div');
    dot.id = 'cursor-dot';
    document.body.appendChild(dot);
    let mx = 0, my = 0, dx = 0, dy = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.classList.add('visible'); });
    document.addEventListener('mouseleave', () => dot.classList.remove('visible'));
    (function tick() { dx += (mx - dx) * 0.18; dy += (my - dy) * 0.18; dot.style.left = dx + 'px'; dot.style.top = dy + 'px'; requestAnimationFrame(tick); })();
    document.addEventListener('mouseover', e => { if (e.target.closest('a, button, .wp-card')) dot.classList.add('hovering'); });
    document.addEventListener('mouseout',  e => { if (e.target.closest('a, button, .wp-card')) dot.classList.remove('hovering'); });
})();

// ===== NAV SCROLL BEHAVIOUR =====
const nav = document.querySelector('.nav');
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const current = window.scrollY;
    nav.style.transform = (current > lastScroll && current > 80) ? 'translateY(-100%)' : 'translateY(0)';
    if (current > 100) {
        nav.style.backgroundColor = 'rgba(240, 237, 230, 0.92)';
        nav.style.backdropFilter = 'blur(12px)';
        nav.style.borderBottom = '1px solid var(--border)';
    } else {
        nav.style.backgroundColor = 'transparent';
        nav.style.backdropFilter = 'none';
        nav.style.borderBottom = 'none';
    }
    lastScroll = current <= 0 ? 0 : current;
});

// ===== STAT COUNTERS =====
(function () {
    function animateCount(el, target) {
        const start = performance.now();
        const update = (now) => {
            const p = Math.min((now - start) / 1000, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(eased * target);
            if (p < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const val = parseInt(el.dataset.count, 10);
            if (!isNaN(val)) { obs.unobserve(el); animateCount(el, val); }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.wph-stat-num[data-count]').forEach(el => obs.observe(el));
})();
(function () {
    const title = document.querySelector('.wph-title');
    if (!title) return;
    function wrapWords(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (!text.trim()) return;
            const frag = document.createDocumentFragment();
            text.split(/(\s+)/).forEach(part => {
                if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); }
                else if (part.length > 0) { const s = document.createElement('span'); s.className = 'hero-word'; s.textContent = part; frag.appendChild(s); }
            });
            node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'BR') {
            Array.from(node.childNodes).forEach(wrapWords);
        }
    }
    wrapWords(title);
    title.querySelectorAll('.hero-word').forEach((w, i) => setTimeout(() => w.classList.add('word-visible'), 120 + i * 70));
})();

// ===== SCROLL REVEAL =====
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

document.querySelectorAll('.wp-item, .cta-inner, .footer').forEach(el => {
    if (!el.classList.contains('wp-item')) el.classList.add('reveal');
    observer.observe(el);
});

// ===== FILTER =====
const filterBtns = document.querySelectorAll('.filter-btn');
const items      = document.querySelectorAll('.wp-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        items.forEach(item => {
            const tags = item.dataset.tags || '';
            item.classList.toggle('hidden', filter !== 'all' && !tags.includes(filter));
        });
    });
});

// ===== CLICKABLE ROWS =====
items.forEach(item => {
    item.addEventListener('click', (e) => {
        // Don't redirect if clicking on a link
        if (e.target.closest('.wp-item-link')) return;
        
        const url = item.dataset.url;
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    });
    
    // Add cursor pointer
    item.style.cursor = 'pointer';
});

// ===== CTA CANVAS (antigravity) =====
(function () {
    const canvas = document.getElementById('cta-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const COUNT = 300, MAGNET_RADIUS = 120, RING_RADIUS = 60;
    const WAVE_SPEED = 0.4, WAVE_AMP = 1, LERP_SPEED = 0.1;
    const PARTICLE_SIZE = 3.5, PARTICLE_VAR = 1, PULSE_SPEED = 3;
    const FIELD_STRENGTH = 10, ROTATION_SPEED = 0, INK = '26,26,24';
    let W, H, t = 0;
    const mouse = { x: -9999, y: -9999 };
    const vMouse = { x: 0, y: 0 };

    function resize() {
        const r = canvas.parentElement.getBoundingClientRect();
        W = canvas.width  = Math.round(r.width);
        H = canvas.height = Math.round(r.height);
        if (particles.length) particles.forEach(p => p.init());
    }

    function Particle() { this.init(); }
    Particle.prototype.init = function () {
        this.mx = Math.random() * (W || 800); this.my = Math.random() * (H || 400);
        this.cx = this.mx; this.cy = this.my;
        this.t = Math.random() * 100; this.speed = 0.01 + Math.random() / 200;
        this.rOff = (Math.random() - 0.5) * 2;
        this.size = PARTICLE_SIZE * (0.5 + Math.random() * PARTICLE_VAR * 0.5);
    };
    Particle.prototype.update = function (tx, ty) {
        this.t += this.speed / 2;
        const dx = this.mx - tx, dy = this.my - ty;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let destX = this.mx, destY = this.my;
        if (dist < MAGNET_RADIUS) {
            const angle = Math.atan2(dy, dx);
            const wave = Math.sin(this.t * WAVE_SPEED + angle) * (0.5 * WAVE_AMP);
            const rr = RING_RADIUS + wave + this.rOff * (5 / (FIELD_STRENGTH + 0.1));
            destX = tx + rr * Math.cos(angle); destY = ty + rr * Math.sin(angle);
        }
        this.cx += (destX - this.cx) * LERP_SPEED;
        this.cy += (destY - this.cy) * LERP_SPEED;
        const curDist = Math.sqrt((this.cx - tx) ** 2 + (this.cy - ty) ** 2);
        const scale = Math.max(0.3, Math.min(1, 1 - Math.abs(curDist - RING_RADIUS) / 20));
        this.drawSize = scale * (0.8 + Math.sin(this.t * PULSE_SPEED) * 0.2) * this.size;
        this.angle = Math.atan2(ty - this.cy, tx - this.cx) + Math.PI / 2;
    };
    Particle.prototype.draw = function () {
        const r = this.drawSize * 0.5, len = this.drawSize * 1.8;
        ctx.fillStyle = `rgba(${INK},0.55)`;
        ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.angle);
        ctx.beginPath(); ctx.arc(0, -len / 2, r, Math.PI, 0); ctx.arc(0, len / 2, r, 0, Math.PI);
        ctx.closePath(); ctx.fill(); ctx.restore();
    };

    let particles = [];
    function init() { resize(); particles = Array.from({ length: COUNT }, () => new Particle()); }
    function loop() {
        t += 0.016; ctx.clearRect(0, 0, W, H);
        const active = canvas.classList.contains('active');
        vMouse.x += ((active ? mouse.x : -9999) - vMouse.x) * 0.05;
        vMouse.y += ((active ? mouse.y : -9999) - vMouse.y) * 0.05;
        particles.forEach(p => { p.update(vMouse.x, vMouse.y); p.draw(); });
        requestAnimationFrame(loop);
    }

    const section = canvas.parentElement;
    section.addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
        canvas.classList.add('active');
    });
    section.addEventListener('mouseleave', () => canvas.classList.remove('active'));
    window.addEventListener('resize', () => { resize(); particles.forEach(p => p.init()); });
    requestAnimationFrame(() => { init(); loop(); });
})();
