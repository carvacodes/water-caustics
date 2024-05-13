/////////////////////
//     Globals     //
/////////////////////

let minSize = 132;   // minimum size of elements;
let cSpacing = 132;  // spacing of the elements
let cStrength = 4;   // implemented as border-radius
let cAlphaAdjust = 0.2;  // the max amount less than 1 that a caustic's alpha value can be
let minTime = 3;     // minimum amount of time a rotation takes
let minRippleTime = 60; // the minimum amount of time between InteractiveCaustic animations (ripples)
let rippleDelay = performance.now(); // grab the current time; this variable will space out ripples formed by clicks/taps or movement
let _w = window.innerWidth;
let _h = window.innerHeight;
let interactiveCaustics = [];

/////////////////////
//     Classes     //
/////////////////////

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
    this.el.style.animationDuration = `${(randFactor) * 10 + minTime}s`;
    if (randFactor < 0.5) { this.el.style.animationDirection = 'reverse'; }
    this.el.style.opacity = 1 - Math.round((Math.random() * cAlphaAdjust * 100)) / 100;
    this.el.className = 'caustic';
    causticContainer.appendChild(this.el);
  }
}

class InteractiveCaustic {
  constructor() {
    this.positionalContainer = document.createElement('DIV');
    this.positionalContainer.style.width = '1px';
    this.positionalContainer.style.height = '1px';
    this.x = 0;
    this.y = 0;
    this.el = document.createElement('DIV');
    this.el.classList.add('interactive-caustic');
    this.animating = false;

    this.el.addEventListener('animationend', ()=>{
      this.el.style.opacity = '0';
      this.el.classList.remove('animating-ripple');
      this.animating = false;
    });

    this.positionalContainer.appendChild(this.el)
    causticContainer.appendChild(this.positionalContainer);
  }

  jumpTo(x,y) {
    this.positionalContainer.style.transform = `translateX(${x}px) translateY(${y}px)`;
  }

  animate() {
    this.el.style.opacity = '1';
    this.el.classList.add('animating-ripple');
    this.animating = true;
  }
}

/////////////////
//     DOM     //
/////////////////

// control elements
let menuToggle = document.getElementById('menuToggle');
let controlMenu = document.getElementById('controlMenu');
let rangeControls = controlMenu.querySelectorAll('input[type="range"]');

// ID'd containers
let backgroundContainer = document.getElementById('backgroundContainer');
let causticContainer = document.getElementById('causticContainer');

// inputs whose values target a single container or parent element
let backgroundBrightnessInput = document.getElementById('backgroundBrightness');
let backgroundContrastInput = document.getElementById('backgroundContrast');
let backgroundOpacityInput = document.getElementById('backgroundOpacity');
let backgroundBgColorCompiledInput = document.getElementById('backgroundBgColorCompiledInput');
let backgroundBgColorHueInput = document.getElementById('backgroundBgColorHue');
let backgroundBgColorSatInput = document.getElementById('backgroundBgColorSat');
let backgroundBgColorLitInput = document.getElementById('backgroundBgColorLit');
let causticBlurInput = document.getElementById('causticBlur');

// inputs whose values target a class
let causticColorCompiledInput = document.getElementById('causticColorCompiledInput');
let causticStrengthInput = document.getElementById('causticStrength');
let causticColorHueInput = document.getElementById('causticColorHue');
let causticColorSatInput = document.getElementById('causticColorSat');
let causticColorLitInput = document.getElementById('causticColorLit');
let rippleStrengthInput = document.getElementById('rippleStrength');
let rippleColorCompiledInput = document.getElementById('rippleColorCompiledInput');
let rippleColorHueInput = document.getElementById('rippleColorHue');
let rippleColorSatInput = document.getElementById('rippleColorSat');
let rippleColorLitInput = document.getElementById('rippleColorLit');
let rippleColorAlphaInput = document.getElementById('rippleColorAlpha');

// buttons
let resetToDefaultsButton = document.getElementById('resetToDefaults');

////////////////////////////////////
//     Listeners and Handlers     //
////////////////////////////////////


//////////////////////////////
//     Global Listeners     //
//////////////////////////////

window.addEventListener('load', init);
window.addEventListener('click', (event) => {
  let t = event.target;
  if (t.classList.contains('control-group') || t.tagName == 'P' || t.tagName == 'INPUT') {
    event.preventDefault();
    if (t.tagName == 'LABEL' || t.tagName == 'INPUT') {
      return;
    }
    if (t.id == 'menuToggle') {
      let selectingElement = t.parentElement.querySelector('.selecting');
      if (selectingElement) {
        t.parentElement.querySelector('.selecting').classList.remove('selecting');
      }
    } else if (t.classList.contains('control-group') && !t.classList.contains('selecting')) {
      t.classList.toggle('selecting');
    } else if (t.tagName == 'P') {
      t.parentElement.classList.toggle('selecting');
    }
    menuToggle.classList.toggle('collapsed');
    menuToggle.classList.toggle('expanded');
  } else {
    menuToggle.classList.remove('expanded');
    menuToggle.classList.add('collapsed');
    let selecting = controlMenu.querySelector('.selecting');
    if (selecting) { selecting.classList.remove('selecting'); }
    animateInteractiveCaustic(event);
  }
});
window.addEventListener('mousemove', handleMove)
window.addEventListener('touchmove', handleMove, {passive: false})
window.addEventListener('orientationchange', ()=>{
  location.reload();
})

/////////////////////////////////////////////////////
//     Element-Specific Listeners and Handlers     //
/////////////////////////////////////////////////////

backgroundBgColorHueInput.addEventListener('change', recalculateBgColor);
backgroundBgColorSatInput.addEventListener('change', recalculateBgColor);
backgroundBgColorLitInput.addEventListener('change', recalculateBgColor);

function recalculateBgColor() {
  let h = backgroundBgColorHueInput.value;
  let s = backgroundBgColorSatInput.value;
  let l = backgroundBgColorLitInput.value;
  let colorString = `hsla(${h}, ${s}%, ${l}%, 1)`;
  backgroundBgColorCompiledInput.value = colorString;
  backgroundContainer.style.backgroundColor = colorString;
}

backgroundBrightnessInput.addEventListener('change', recalculateBgFilters);
backgroundContrastInput.addEventListener('change', recalculateBgFilters);

function recalculateBgFilters() {
  let b = backgroundBrightnessInput.value;
  let c = backgroundContrastInput.value;
  let filterString = `brightness(${b}) contrast(${c})`;
  backgroundContainer.style.filter = filterString;
}

backgroundOpacityInput.addEventListener('change', recalculateBgOpacity);

function recalculateBgOpacity() {
  let o = backgroundOpacityInput.value;
  backgroundContainer.style.opacity = o;
}

causticBlurInput.addEventListener('change', recalculateCausticBlur)

function recalculateCausticBlur() {
  let b = causticBlurInput.value;
  causticContainer.style.filter = `blur(${b}px)`;
}

causticColorHueInput.addEventListener('change', recalculateCausticColor);
causticColorSatInput.addEventListener('change', recalculateCausticColor);
causticColorLitInput.addEventListener('change', recalculateCausticColor);

function recalculateCausticColor() {
  let h = causticColorHueInput.value;
  let s = causticColorSatInput.value;
  let l = causticColorLitInput.value;
  let colorString = `hsla(${h}, ${s}%, ${l}%, 1)`;
  causticColorCompiledInput.value = colorString;
  // need to get this into the DOM <style> tag as border-color
  setCausticDomStyles();
}

causticStrengthInput.addEventListener('change', setCausticDomStyles);

function setCausticDomStyles() {
  let s = document.head.querySelector('style');
  let color = `border-color: ${causticColorCompiledInput.value}`;
  let borderWidth = `border-width: ${causticStrengthInput.value}px`;
  let newRule = `.caustic { ${borderWidth}; ${color}; }`;
  let regex = /\.caustic.*/;
  s.innerHTML = s.innerHTML.replace(regex, newRule);
}

rippleColorHueInput.addEventListener('change', recalculateRippleColor);
rippleColorSatInput.addEventListener('change', recalculateRippleColor);
rippleColorLitInput.addEventListener('change', recalculateRippleColor);
rippleColorAlphaInput.addEventListener('change', recalculateRippleColor);

function recalculateRippleColor() {
  let h = rippleColorHueInput.value;
  let s = rippleColorSatInput.value;
  let l = rippleColorLitInput.value;
  let a = rippleColorAlphaInput.value;
  let colorString = `hsla(${h}, ${s}%, ${l}%, ${a})`;
  rippleColorCompiledInput.value = colorString;
  // need to get this into the DOM <style> tag as border-color
  setRippleDomStyles();
}

rippleStrengthInput.addEventListener('change', setRippleDomStyles);

function setRippleDomStyles() {
  let s = document.head.querySelector('style');
  let color = `border-color: ${rippleColorCompiledInput.value}`;
  let borderWidth = `border-width: ${rippleStrengthInput.value}px`;
  let newRule = `.interactive-caustic { ${borderWidth}; ${color}; }`;
  let regex = /\.interactive-caustic.*/;
  s.innerHTML = s.innerHTML.replace(regex, newRule);

  animateInteractiveCaustic({clientX: _w / 2, clientY: _h / 2});
}

resetToDefaultsButton.addEventListener('click', resetToDefaults);

function resetToDefaults() {
  for (let i = 0; i < rangeControls.length; i++) {
    let r = rangeControls[i];
    r.value = r.getAttribute('data-default-value');
    r.dispatchEvent(new Event("change"));
  }
  menuToggle.classList.add('collapsed');
  menuToggle.classList.remove('expanded');
  let selectingElement = controlMenu.querySelector('.selecting');
  if (selectingElement) {
    controlMenu.querySelector('.selecting').classList.remove('selecting');
  }
}

///////////////////////
//     Functions     //
///////////////////////

function init() {
  // Based on the fact that the animation takes 1s, and the delay between ripples is 60ms, there will never be need for more than about 20 of these.
  // Thus, populate the interactive caustics array with 20 elements.
  for (let i = 0; i < (1000 / minRippleTime) + 4; i++) {
    interactiveCaustics.push(new InteractiveCaustic());
  }
  for (let x = cSpacing * -1; x < _w; x += cSpacing) {
    for (let y = cSpacing * -1; y < _h; y += cSpacing) {
      if (x < _w && y < _h) {
        let r = Math.random();
        let c = new Caustic(Math.round(x), Math.round(y), r);
      }
    }
  }

  // used for class input changes later
  let style = document.createElement('STYLE');
  style.innerHTML = '\n.caustic { }\n.interactive-caustic { }\n';
  document.head.appendChild(style);

  resetToDefaults();
}

function animateInteractiveCaustic(event) {
  // loop through the interactiveCaustics array, find one that's not animating, and animate it
  // if there are no interactiveCaustics left in the array, add one more
  for (let i = 0; i < interactiveCaustics.length; i++) {
    let intC = interactiveCaustics[i];
    if (intC.animating && i == interactiveCaustics.length - 1) {
      // create a new interactiveCaustic
      let newIntC = new InteractiveCaustic();
      interactiveCaustics.push(newIntC);
      newIntC.jumpTo(event.clientX, event.clientY);
      newIntC.animate();
      break;  // gotta break here!
    } else if (intC.animating) {
      continue; // this item is already animating; keep looking
    } else {
      intC.jumpTo(event.clientX, event.clientY);
      intC.animate();
      break;
    }
  }
}

// on mouse or touch move, check if the ripple delay timer is 0 and animate if so
function handleMove(event) {
  if (event.target.classList.contains('control-group') || event.target.tagName == 'INPUT') {
    return;
  }
  event.preventDefault();
  
  if (event.changedTouches) {
    event = event.touches[0];
  }

  let now = performance.now();
  if (now - rippleDelay < minRippleTime) { return; }
  rippleDelay = now;
  animateInteractiveCaustic(event);
}
