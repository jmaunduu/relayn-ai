/**
 * Shader Iframe sizing logic.
 * Keeps window aspect capped at 1422x800 base and adjusts custom CSS variable scale.
 */
function resizeShader() {
  const iframe = document.querySelector('.shader-iframe');
  if (!iframe) return;

  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const aspect = winW / winH;

  let width, height;
  const baseWidth = 1422;
  const baseHeight = 800;
  const baseAspect = baseWidth / baseHeight;

  if (aspect >= baseAspect) {
    width = baseWidth;
    height = baseWidth / aspect;
  } else {
    height = baseHeight;
    width = baseHeight * aspect;
  }

  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;

  // Scale computation to cover full window plus offset
  const scale = Math.max(winW / width, (winH + 110) / height);
  document.documentElement.style.setProperty('--shader-scale', scale);
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Attach listeners
const debouncedResize = debounce(resizeShader, 180);
window.addEventListener('resize', debouncedResize);

window.addEventListener('DOMContentLoaded', () => {
  resizeShader();
});

// ── Audio demo ───────────────────────────────────────────────
const CLIPS=[{label:'After-hours emergency — 1:42',duration:102},{label:'Mid-job call — 0:58',duration:58},{label:'Repeat customer — 1:15',duration:75}];
const waveformEl=document.getElementById('waveform'),playBtn=document.getElementById('playBtn'),audioTimeEl=document.getElementById('audioTime'),audioTitleEl=document.getElementById('audioTitle'),audioTabs=document.querySelectorAll('.audio-tab');
const NUM_BARS=40;

if (waveformEl) {
  for(let i=0;i<NUM_BARS;i++){
    const b=document.createElement('div');
    b.className='waveform-bar';
    b.style.setProperty('--bar-h',(0.15+Math.random()*.85).toFixed(2));
    b.style.setProperty('--bar-dur',(0.5+Math.random()*.7).toFixed(2)+'s');
    b.style.setProperty('--bar-delay',(i*.02).toFixed(2)+'s');
    waveformEl.appendChild(b);
  }
}

const bars=waveformEl ? waveformEl.querySelectorAll('.waveform-bar') : [];
let clip=0,playing=false,elapsed=0,ticker=null;
const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

function setClip(i){
  clip=i;
  elapsed=0;
  playing=false;
  clearInterval(ticker);
  if (playBtn) playBtn.classList.remove('is-playing');
  if (waveformEl) waveformEl.classList.remove('is-playing');
  if (audioTitleEl) audioTitleEl.textContent=CLIPS[i].label;
  if (audioTimeEl) audioTimeEl.textContent='0:00';
  bars.forEach(b=>b.classList.remove('is-played'));
  audioTabs.forEach((t,j)=>t.classList.toggle('is-active',j===i));
}

if (playBtn) {
  playBtn.addEventListener('click',()=>{
    playing=!playing;
    playBtn.classList.toggle('is-playing',playing);
    if (waveformEl) waveformEl.classList.toggle('is-playing',playing);
    if(playing){
      ticker=setInterval(()=>{
        elapsed++;
        if (audioTimeEl) audioTimeEl.textContent=fmt(elapsed);
        const filled=Math.floor((elapsed/CLIPS[clip].duration)*NUM_BARS);
        bars.forEach((b,i)=>b.classList.toggle('is-played',i<filled));
        if(elapsed>=CLIPS[clip].duration){
          clearInterval(ticker);
          playing=false;
          playBtn.classList.remove('is-playing');
          if (waveformEl) waveformEl.classList.remove('is-playing');
        }
      },1000);
    } else {
      clearInterval(ticker);
    }
  });
}

audioTabs.forEach((t,i)=>t.addEventListener('click',()=>setClip(i)));
if (audioTabs.length > 0) {
  setClip(0);
}

// ── Live demo form + call widget ─────────────────────────────
const demoCard    = document.getElementById('demoCard');
const demoForm    = document.getElementById('demoForm');
const callerLabel = document.getElementById('callerLabel');
const endedMsg    = document.getElementById('endedMsg');
const hangupBtn   = document.getElementById('callHangup');
let demoTimer = null;

if (demoForm) {
  demoForm.addEventListener('submit', e => {
    e.preventDefault();
    const first = demoForm.first.value.trim();
    const last  = demoForm.last.value.trim();
    const phone = demoForm.phone.value.trim();
    const email = demoForm.email.value.trim();

    // Basic validation — highlight empty fields
    let valid = true;
    [demoForm.first, demoForm.last, demoForm.phone, demoForm.email].forEach(input => {
      if (!input.value.trim()) { input.classList.add('is-invalid'); valid = false; }
      else input.classList.remove('is-invalid');
    });
    if (!valid) return;

    if (callerLabel) callerLabel.textContent = `Calling ${first}…`;
    if (endedMsg) endedMsg.textContent    = `Thanks ${first}. Check your phone — we'll follow up.`;
    if (demoCard) demoCard.dataset.state  = 'ringing';
    demoTimer = setTimeout(() => { if (demoCard) demoCard.dataset.state = 'live'; }, 2200);
  });

  demoForm.querySelectorAll('.demo-input').forEach(input => {
    input.addEventListener('input', () => input.classList.remove('is-invalid'));
  });
}

hangupBtn?.addEventListener('click', () => {
  clearTimeout(demoTimer);
  if (demoCard) demoCard.dataset.state = 'ended';
  setTimeout(() => { 
    if (demoCard) demoCard.dataset.state = 'form'; 
    if (demoForm) demoForm.reset(); 
  }, 4000);
});

// ── Problem stack ────────────────────────────────────────────
const pPanels = document.querySelectorAll('.problem-panel');
const problemStack = document.querySelector('.problem-stack');

function updateProblemStack() {
  if (!problemStack) return;
  // CRITICAL: do NOT use panel.offsetTop here — once a panel becomes sticky,
  // offsetTop reports the displaced (stuck) position, not the natural layout
  // offset, which collapses the math. Each panel is exactly 100svh tall, so
  // panel i's natural top within the stack = i * innerHeight.
  const stackAbsTop = problemStack.getBoundingClientRect().top + window.scrollY;
  const vh = window.innerHeight;
  pPanels.forEach((panel, i) => {
    const card = panel.querySelector('.problem-card');
    if (!card) return;
    const panelAbsTop = stackAbsTop + i * vh;
    const s = (window.scrollY - panelAbsTop) / vh;
    card.style.setProperty('--enter-t', i === 0 ? '1' : Math.min(Math.max(s, 0), 1));
    card.style.setProperty('--exit-t', Math.min(Math.max(s - 1, 0), 1));
  });
}

let psRaf = false;
if (pPanels.length > 0) {
  window.addEventListener('scroll', () => {
    if (!psRaf) {
      psRaf = true;
      requestAnimationFrame(() => { updateProblemStack(); psRaf = false; });
    }
  }, { passive: true });
  updateProblemStack();
}

// ── How It Works ─────────────────────────────────────────────
const hiwSteps=document.querySelectorAll('.hiw-step');
const hiwPanels=document.querySelectorAll('.hiw-panel');
hiwSteps.forEach(step=>step.addEventListener('click',()=>{
  const i=step.dataset.step;
  hiwSteps.forEach(s=>s.classList.remove('is-active'));
  hiwPanels.forEach(p=>p.classList.remove('is-active'));
  step.classList.add('is-active');
  document.querySelector(`.hiw-panel[data-panel="${i}"]`)?.classList.add('is-active');
}));

// ── FAQ accordion ────────────────────────────────────────────
document.querySelectorAll('.faq-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const item=btn.closest('.faq-item'),isOpen=item.classList.contains('is-open');
    document.querySelectorAll('.faq-item').forEach(i=>{
      i.classList.remove('is-open');
      i.querySelector('.faq-btn').setAttribute('aria-expanded','false');
    });
    if(!isOpen){
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded','true');
    }
  });
});

// ── Navigation ───────────────────────────────────────────────
const hamburger = document.getElementById('navHamburger');
const drawer    = document.getElementById('navDrawer');

hamburger?.addEventListener('click', () => {
  const open = drawer.classList.toggle('is-open');
  hamburger.setAttribute('aria-expanded', open);
  drawer.setAttribute('aria-hidden', !open);
  // Toggle hamburger → X
  const spans = hamburger.querySelectorAll('span');
  if (open) {
    spans[0].style.transform = 'translateY(6px) rotate(45deg)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'translateY(-6px) rotate(-45deg)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

// Close drawer on link click
drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  drawer.classList.remove('is-open');
  hamburger?.setAttribute('aria-expanded', 'false');
  const spans = hamburger?.querySelectorAll('span');
  spans?.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
}));

// ── Scroll Reveal (IntersectionObserver) ─────────────────────
// Adds .is-visible to any element with .reveal once it enters viewport.
// Children with .reveal-child get staggered delays via data-delay attribute.
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length > 0 && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  revealEls.forEach(el => revealObserver.observe(el));
}

// Active nav link on scroll
const navSections = ['how','cases','demo','faq'];
const navLinks    = document.querySelectorAll('.nav-link');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${entry.target.id}`));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
navSections.forEach(id => { const el = document.getElementById(id); if(el) observer.observe(el); });

