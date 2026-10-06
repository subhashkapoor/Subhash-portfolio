(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav highlight */
  const links = [...document.querySelectorAll('.pill a')];
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.dataset.s.split(' ').includes(e.target.id))); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => a.dataset.s.split(' ').forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); }));

  /* hero parallax */
  const person = document.getElementById('person'), ghost = document.getElementById('ghost');
  const isMobile = () => innerWidth <= 720;
  if (!reduce) addEventListener('pointermove', e => {
    if (isMobile() || scrollY > innerHeight) return;
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    person.style.transform = `translateX(calc(-50% + ${x * -18}px)) translateY(${y * -6}px)`;
    ghost.style.translate = `${x * 30}px ${y * 10}px`;
  });

  /* hero video: colour on the left half, matte on the right, composited in WebGL */
  const vid = document.getElementById('vid'), cv = document.getElementById('stage'), soundBtn = document.getElementById('sound');
  (function () {
    const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true });
    if (!gl) return;
    const mk = (t, src) => { const sh = gl.createShader(t); gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
    const pr = gl.createProgram();
    gl.attachShader(pr, mk(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec2 v;uniform sampler2D t;void main(){vec3 c=texture2D(t,vec2(v.x*.5,v.y)).rgb;float a=texture2D(t,vec2(.5+v.x*.5,v.y)).r;gl_FragColor=vec4(min(c,vec3(a)),a);}'));
    gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
    gl.clearColor(0, 0, 0, 0);
    let live = false;
    const draw = () => {
      if (vid.readyState >= 2) {
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, vid);
          gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          if (!live) { live = true; cv.parentElement.classList.add('live'); }
        } catch (e) { return; }
      }
      if (vid.requestVideoFrameCallback) vid.requestVideoFrameCallback(draw); else requestAnimationFrame(draw);
    };
    const label = () => {
      const on = !vid.paused && !vid.muted && !vid.ended;   /* voice is playing right now */
      soundBtn.querySelector('span').textContent = on ? 'Mute' : (vid.ended ? 'Play again with sound' : 'Hear me say hi');
      soundBtn.setAttribute('aria-label', on ? 'Mute video' : 'Play with sound');
      soundBtn.classList.toggle('attn', !on);
    };
    ['play', 'pause', 'volumechange'].forEach(t => vid.addEventListener(t, label));
    vid.addEventListener('ended', () => { draw(); label(); });
    const start = () => {
      /* play once, with the voice. If the browser blocks sound until a gesture, wait on the first frame instead of playing muted. */
      vid.muted = false; vid.volume = 1;
      const pl = vid.play();
      if (pl && pl.catch) pl.catch(() => { vid.pause(); vid.currentTime = 0; draw(); label(); });
      draw(); label();
    };
    vid.addEventListener('loadeddata', start, { once: true });
    if (vid.readyState >= 2) start();
    soundBtn.hidden = false;
    const setSound = on => {
      vid.muted = !on; vid.volume = 1;
      if (on) vid.currentTime = 0;
      const q = vid.play(); if (q && q.catch) q.catch(() => { vid.muted = true; const r = vid.play(); if (r && r.catch) r.catch(() => {}); label(); });
      label();
    };
    soundBtn.addEventListener('click', e => { e.stopPropagation(); setSound(vid.muted || vid.paused || vid.ended); });
    /* the first tap, click or key press anywhere starts the voice if the browser held it back */
    let armed = true;
    const arm = e => {
      if (!armed || soundBtn.contains(e.target)) return;
      armed = false;
      if (!vid.ended && (vid.paused || vid.muted) && scrollY < innerHeight * .8) setSound(true);
    };
    ['pointerdown', 'keydown', 'touchend'].forEach(t => addEventListener(t, arm, { passive: true }));
    let wasPlaying = false;
    document.addEventListener('visibilitychange', () => { if (document.hidden) { wasPlaying = !vid.paused; vid.pause(); } else if (wasPlaying && !vid.ended) vid.play().catch(() => {}); });
  })();

  /* id card tilt */
  const card = document.getElementById('idcard');
  if (!reduce) {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `rotateY(${x * 22}deg) rotateX(${y * -18}deg)`;
      card.style.setProperty('--sheen', `${x * 120}%`);
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; card.style.setProperty('--sheen', '-60%'); });
  }

  /* periodic table */
  const G = { research: 'Research', craft: 'Craft', lead: 'Leadership', tools: 'Tools & process', ai: 'AI' };
  const C = { research: '#24304F', craft: '#8A5A36', lead: '#4A5B4C', tools: '#6E6578', ai: '#2F6F75' };
  const els = [
    ['Ur', 'User Research', 'research', 'Interviews, contextual inquiry and synthesis that turn into roadmaps. My research at AlphaSense led to 3 major feature launches.'],
    ['Us', 'Usability', 'research', 'Moderated usability testing on clickable prototypes. Used to validate the FedEx customs flows before build.'],
    ['Dt', 'Design Thinking', 'research', 'Framing problems before solving them. My design-thinking workshops surfaced 20+ use cases for an enterprise AI platform.'],
    ['Uf', 'User-focused Design', 'research', 'Users first, always. Every decision traces back to a real person and a real task.'],
    ['Ws', 'Workshops', 'research', 'Requirement and research workshops run across Singapore, Europe and ANZ.'],
    ['Cp', 'Creative Problem Solving', 'research', 'Finding the simplest route through complex enterprise and logistics problems.'],
    ['Wf', 'Wireframing', 'craft', 'Fast, low-fidelity structure to agree on flow and hierarchy before pixels.'],
    ['Pr', 'Prototyping', 'craft', 'Clickable prototypes that let stakeholders and users feel the product early.'],
    ['Ds', 'Design Systems', 'craft', "Creator of AlphaSense's Orion system, which cut design–dev iterations by 40%."],
    ['Ty', 'Typography', 'craft', 'Certified in typography for product. Type is the backbone of every interface I ship.'],
    ['Ia', 'Information Architecture', 'craft', 'Senior IA on the FedEx customs clearance system: structure that cut task time for 80% of users.'],
    ['Vd', 'Visual Delivery', 'craft', 'Taking work through to polished final visuals and implementation support.'],
    ['Tm', 'Team Building', 'lead', 'Scaled a design practice from 2 to 40+ designers at Quovantis.'],
    ['Mt', 'Mentorship', 'lead', 'Mentored 10+ designers from junior to mid-level at AlphaSense, and more at Sapient.'],
    ['St', 'Strategic Thinking', 'lead', 'UX strategy roadmaps aligned with business goals and measurable success metrics.'],
    ['Cr', 'Design Critique', 'lead', 'Facilitating critique that raises the quality bar without slowing the team down.'],
    ['Tc', 'Team Collaboration', 'lead', 'Close work with founders, PMs, engineers and brokers to ship validated solutions.'],
    ['Do', 'Design Ops', 'lead', 'Setting up the tools, methods and rituals that let large design teams scale.'],
    ['Fg', 'Figma', 'tools', 'Home base for design, prototyping and system libraries.'],
    ['Mi', 'Miro / FigJam', 'tools', 'Remote workshops, journey maps and synthesis boards.'],
    ['Ji', 'JIRA', 'tools', 'Keeping design work visible and in step with engineering sprints.'],
    ['Ag', 'Agile', 'tools', 'Balancing product deadlines with UX quality in fast-moving Agile teams.'],
    ['Ai', 'AI in UX', 'ai', 'Designing AI products and using AI in the design process, from enterprise intelligence platforms to research synthesis.'],
    ['Ip', 'AI Platforms', 'ai', 'Led an AI intelligence platform that made enterprise decision workflows 30% faster.'],
  ];
  /* skill icons (Lucide, ISC licence) */
  const IC = {
    Ur: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
    Us: '<path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/>',
    Dt: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    Uf: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/><path d="m18 15-2-2"/><path d="m15 18-2-2"/>',
    Ws: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
    Cp: '<path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>',
    Wf: '<rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="5" height="7" x="16" y="14" rx="1"/>',
    Pr: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/>',
    Ds: '<path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/><path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"/><path d="M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"/><path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/>',
    Ty: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
    Ia: '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
    Vd: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    Tm: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    Mt: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    St: '<path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/>',
    Cr: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="1"/><path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0"/>',
    Tc: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
    Do: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    Fg: '<path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/><path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/><path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/><path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/><path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/>',
    Mi: '<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/>',
    Ji: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/>',
    Ag: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    Ai: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    Ip: '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M9 13a4.5 4.5 0 0 0 3-4"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M12 13h4"/><path d="M12 18h6a2 2 0 0 1 2 2v1"/><path d="M12 8h8"/><path d="M16 8V5a2 2 0 0 1 2-2"/><circle cx="16" cy="13" r=".5"/><circle cx="18" cy="3" r=".5"/><circle cx="20" cy="21" r=".5"/><circle cx="20" cy="8" r=".5"/>',
  };
  const ico = s => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[s]}</svg>`;
  const pt = document.getElementById('ptable');
  const dBig = document.getElementById('dBig'), dN = document.getElementById('dN'), dS = document.getElementById('dS'),
        dName = document.getElementById('dName'), dGrp = document.getElementById('dGrp'), dText = document.getElementById('dText'), dI = document.getElementById('dI');
  const show = (btn, i) => {
    const [s, n, g, t] = els[i];
    pt.querySelectorAll('.el').forEach(b => b.classList.toggle('sel', b === btn));
    dN.textContent = String(i + 1).padStart(2, '0'); dS.textContent = s; dName.textContent = n; dGrp.textContent = G[g]; dText.textContent = t; dI.innerHTML = ico(s);
    dBig.style.setProperty('--dc', C[g]);
  };
  els.forEach(([s, n, g], i) => {
    const b = document.createElement('button');
    b.className = 'el g-' + g; b.dataset.g = g; b.type = 'button';
    b.setAttribute('aria-label', `${n}, ${G[g]}`);
    b.innerHTML = `<span class="el-top"><span class="n">${String(i + 1).padStart(2, '0')}</span>${ico(s)}</span><span class="s">${s}</span><span class="nm">${n}</span>`;
    b.addEventListener('mouseenter', () => show(b, i));
    b.addEventListener('focus', () => show(b, i));
    b.addEventListener('click', () => show(b, i));
    pt.appendChild(b);
  });
  show(pt.firstChild, 0);
  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === c));
    const g = c.dataset.g;
    pt.querySelectorAll('.el').forEach(b => b.classList.toggle('dim', g !== 'all' && b.dataset.g !== g));
    const first = pt.querySelector(g === 'all' ? '.el' : `.el[data-g="${g}"]`);
    show(first, [...pt.children].indexOf(first));
  }));

  /* work accordion + dials */
  const cases = [...document.querySelectorAll('.case')];
  const R = 2 * Math.PI * 34;
  const setDial = (c, on) => {
    const v = c.querySelector('.vl'); v.style.strokeDasharray = R;
    v.style.strokeDashoffset = on ? R * (1 - (+c.dataset.pct / +c.dataset.max)) : R;
  };
  const open = c => { cases.forEach(x => { x.classList.toggle('open', x === c); setDial(x, x === c); x.setAttribute('aria-expanded', x === c); }); };
  cases.forEach(c => {
    c.addEventListener('click', () => { if (!c.classList.contains('open')) open(c); });
    c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(c); } });
  });
  cases.forEach(c => setDial(c, c.classList.contains('open')));

  /* timeline progress */
  const tl = document.getElementById('tl'), fill = document.getElementById('tlFill');
  const tlUpdate = () => {
    const r = tl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / r.height));
    fill.style.setProperty('--p', (p * 100).toFixed(1) + '%');
  };
  addEventListener('scroll', tlUpdate, { passive: true }); tlUpdate();

  /* count up (final values are in the HTML; animate only when seen) */
  if (!reduce) {
    const cio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, t0 = performance.now(), d = 1400;
      const tick = t => { const k = Math.min(1, (t - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }), { threshold: .6 });
    document.querySelectorAll('[data-count]').forEach(n => cio.observe(n));
  }

  /* copy email */
  const copy = document.getElementById('copy');
  copy.addEventListener('click', async () => {
    const txt = document.getElementById('email').textContent;
    try { await navigator.clipboard.writeText(txt); copy.textContent = 'Copied'; }
    catch { const s = getSelection(), r = document.createRange(); r.selectNodeContents(document.getElementById('email')); s.removeAllRanges(); s.addRange(r); copy.textContent = 'Selected, press ⌘C'; }
    setTimeout(() => copy.textContent = 'Copy email', 2000);
  });
})();
