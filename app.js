(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav highlight */
  const links = [...document.querySelectorAll('.pill a')];
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.dataset.s === e.target.id)); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = document.getElementById(a.dataset.s); if (s) io.observe(s); });

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
  const pt = document.getElementById('ptable');
  const dBig = document.getElementById('dBig'), dN = document.getElementById('dN'), dS = document.getElementById('dS'),
        dName = document.getElementById('dName'), dGrp = document.getElementById('dGrp'), dText = document.getElementById('dText');
  const show = (btn, i) => {
    const [s, n, g, t] = els[i];
    pt.querySelectorAll('.el').forEach(b => b.classList.toggle('sel', b === btn));
    dN.textContent = String(i + 1).padStart(2, '0'); dS.textContent = s; dName.textContent = n; dGrp.textContent = G[g]; dText.textContent = t;
    dBig.style.setProperty('--dc', C[g]);
  };
  els.forEach(([s, n, g], i) => {
    const b = document.createElement('button');
    b.className = 'el g-' + g; b.dataset.g = g; b.type = 'button';
    b.setAttribute('aria-label', `${n}, ${G[g]}`);
    b.innerHTML = `<span class="n">${String(i + 1).padStart(2, '0')}</span><span class="s">${s}</span><span class="nm">${n}</span>`;
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
