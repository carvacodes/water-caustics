let sizeFactor = Math.max(30 - (Math.max(innerWidth, innerHeight) / 100), 12);  // ties the size and spacing together nicely
let minSize = Math.round(Math.min(innerWidth, innerHeight) / 110) * sizeFactor;   // minimum size of elements;
let cSpacing = Math.round(Math.min(innerWidth, innerHeight) / 95) * sizeFactor;  // spacing of the elements
let cStrength = 11; // implemented as border-radius
let minAlpha = 0.75; // implemented as alpha value in hsla
let minTime = 6;    // minimum amount of time a rotation takes
let container = document.getElementsByClassName('container')[0];  // our container element
let rippleDelay = Date.now(); // grab the current time; this variable will space out ripples formed by clicks/taps or movement

// Even though we only touch these elements once (on instantiation), this makes it way easier to create them initially
class Caustic {
  constructor(x, y, randFactor) {
    this.el = document.createElement('DIV');

    let size = Math.ceil(randFactor * 120) + minSize;
    this.el.style.width = `${size}px`;
    this.el.style.height = `${size * 1.5}px`;
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
    this.el.style.animationDelay = `${Math.floor(-5 * randFactor) - 5}s`;
    this.el.style.animationDuration = `${Math.ceil((randFactor) * 12) + minTime}s`;
    if (randFactor < 0.5) { this.el.style.animationDirection = 'reverse'; }
    this.el.style.border = `${cStrength}px solid hsla(270, 100%, 85%, ${(randFactor * (0.9 - minAlpha)) + minAlpha})`;
    this.el.className = 'caustic';
    container.appendChild(this.el);
  }
}

class InteractiveCaustic {
  constructor(x, y) {
    this.el = document.createElement('DIV');
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
    this.el.style.border = `${cStrength + 6}px solid hsla(270, 100%, 85%, 1)`;
    this.el.style.filter = `blur(${blur - 1}px)`;
    this.el.className = 'interactive-caustic';

    this.el.addEventListener('animationend', ()=>{ this.el.remove() });

    container.appendChild(this.el);
  }
}

function init() {
  for (let x = cSpacing * -1; x < innerWidth; x += cSpacing) {
    for (let y = cSpacing * -1; y < innerHeight; y += cSpacing) {
      let r = Math.random();
      let c = new Caustic(x, y, r);
    }
  }
};

function createInteractiveCaustic(event) {
  let i = new InteractiveCaustic(event.clientX - 20, event.clientY - 20);
}

function handleMove(event) {
  event.preventDefault();
  if (event.changedTouches) {
    event = event.touches[0];
  }
  let now = Date.now();
  if (now - rippleDelay < 60) { return; }
  rippleDelay = now;
  createInteractiveCaustic(event);
}

window.addEventListener('load', init);
window.addEventListener('orientationchange', init);
window.addEventListener('click', createInteractiveCaustic);
window.addEventListener('mousemove', handleMove)
window.addEventListener('touchmove', handleMove, {passive: false})
window.addEventListener('orientationchange', ()=>{ location.reload(); })