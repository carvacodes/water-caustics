/////////////////////
//                 //
//     Globals     //
//                 //
/////////////////////

let minSize = 132;                    // minimum size of elements;
let cSpacing = 132;                   // spacing of the caustics (overall, controls caustic density)
let cStrength = 4;                    // implemented as border-radius, this controls the overall effect of a caustic's presence on the end visual
let cAlphaAdjust = 0.2;               // the max amount less than 1 that a caustic's alpha value can be
let minTime = 3;                      // minimum amount of time a caustic's rotation takes (controls the speed of the overall water surface ripple effect)
let minRippleTime = 60;               // the minimum amount of time between InteractiveCaustic animations (ripples)
let rippleDelay = performance.now();  // grab the current time; this variable will space out ripples formed by clicks/taps or movement
let _w = window.innerWidth;           // unlike with canvas animations, no need to adjust width/height by device pixel ratio
let _h = window.innerHeight;          // unlike with canvas animations, no need to adjust width/height by device pixel ratio
let interactiveCaustics = [];         // holds the total set of interactive caustics

/////////////////////
//                 //
//     Classes     //
//                 //
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
    this.positionalContainer = document.createElement('DIV');   // an interactive caustic's positionalContainer is the 1x1 px div that holds the caustic
    this.positionalContainer.style.width = '1px';               // using this makes it easier to center the caustic on the user, since the containing
    this.positionalContainer.style.height = '1px';              // div element's position doesn't change while its internal caustic animates
    this.x = 0;
    this.y = 0;
    this.el = document.createElement('DIV');
    this.el.classList.add('interactive-caustic');
    this.animating = false;

    // at the end of an interactive caustic's animation, remove its .animating-ripple class and set its opacity to 0 (to ensure that elements that have completed animating don't hang around the page).
    // this will allow the animation to restart when the class is added back.
    // this listener is set here in the object constructor to ensure it's properly attached
    this.el.addEventListener('animationend', ()=>{
      this.el.style.opacity = '0';
      this.el.classList.remove('animating-ripple');
      this.animating = false;
    });

    this.positionalContainer.appendChild(this.el)
    causticContainer.appendChild(this.positionalContainer);
  }

  // center the caustic on the user's interaction position. the value of 50 here is derived from the .interactive-caustic class width of 100px; this can be obtained by getting computed styles for a class member from the window, but hard-coding that here skips that step for convenience.
  jumpTo(x,y) {
    this.positionalContainer.style.transform = `translateX(${x - 50}px) translateY(${y - 50}px)`;
  }

  // on an animation call, immediately set the element to full opacity and add back the .animating-ripple class
  animate() {
    this.el.style.opacity = '1';
    this.el.classList.add('animating-ripple');
    this.animating = true;
  }
}

/////////////////
//             //
//     DOM     //
//             //
/////////////////

// control elements
let menuToggle = document.getElementById('menuToggle');
let controlMenu = document.getElementById('controlMenu');
let rangeControls = controlMenu.querySelectorAll('input[type="range"]');

// containers with IDs
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

// buttons
let resetToDefaultsButton = document.getElementById('resetToDefaults');

////////////////////////////////////
//                                //
//     Listeners and Handlers     //
//                                //
////////////////////////////////////


//////////////////////////////
//     Global Listeners     //
//////////////////////////////

window.addEventListener('load', init);
window.addEventListener('click', (event) => {
  let t = event.target;
  let tp = t.parentElement;
  if (t.id == 'menuToggle' || tp.id == 'menuToggle') {
    event.preventDefault();
    toggleMenu();
  }
});
window.addEventListener('mousemove', handleMove)
window.addEventListener('touchmove', handleMove, {passive: false})
window.addEventListener('resize', ()=>{
  window.location.reload();
})

/*
Input listeners and handlers (below) in this project were an interesting case. Each input changes a CSS style rule for one or more elements. It's exceptionally inefficient to set the same style on (potentially very) many elements, but it's also impossible to edit class-wide CSS on the fly (the external stylesheet, style.css in this case, can't be directly modified).

The compromise is to dynamically create or update new style rules for each input value that are defined in the document's <head> <style> tag. Using regular expressions, the same style can be edited multiple times without adding an extreme amount of bloat to the CSS stylesheet or per-element (essentially inline) style definitions.
*/

/////////////////////////////////////////////////
//     Background Input Listeners/Handlers     //
/////////////////////////////////////////////////

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


//////////////////////////////////////////////
//     Caustic Input Listeners/Handlers     //
//////////////////////////////////////////////

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
  let causticColor = `border-color: ${causticColorCompiledInput.value}`;
  let causticBorderWidth = `border-width: ${causticStrengthInput.value}px`;
  let intCausticBorderWidth = `border-width: ${Math.min(40, causticStrengthInput.value * 2)}px`;
  let causticNewRule = `.caustic { ${causticBorderWidth}; ${causticColor}; }`;
  let causticRegex = /\.caustic.*/;
  s.innerHTML = s.innerHTML.replace(causticRegex, causticNewRule);

  let intCausticNewRule = `.interactive-caustic { ${intCausticBorderWidth}; ${causticColor}; }`;
  let intCausticRegex = /\.interactive-caustic.*/;
  s.innerHTML = s.innerHTML.replace(intCausticRegex, intCausticNewRule);
}


//////////////////////////////////////////
//     Reset Button Listener/Handler    //
//////////////////////////////////////////

resetToDefaultsButton.addEventListener('click', resetToDefaults);

function resetToDefaults() {
  for (let i = 0; i < rangeControls.length; i++) {
    let r = rangeControls[i];
    r.value = r.getAttribute('data-default-value');
    r.dispatchEvent(new Event("change"));
  }
}

// for mouse and touch movement:
// 1. create an interactive caustic (a ripple) centered at the user's interaction position if they touched the main page
// 2. toggle the menu open/closed if the user tapped on the main menu bar
// 3. adjust scene styles in real time as the user drags an input
function handleMove(event) {
  if (event.target.classList.contains('control-group') || event.target.tagName == 'INPUT') {
    let e = new InputEvent('change', {
      view: window,
      bubbles: false,
      cancelable: true
    });
    event.target.dispatchEvent(e);
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

// a helper function to toggle the menu open/closed
function toggleMenu() {
  if (menuToggle.classList.contains('expanded')) {
    menuToggle.classList.remove('expanded');
    menuToggle.classList.add('collapsed');
  } else {
    menuToggle.classList.remove('collapsed');
    menuToggle.classList.add('expanded');
  }
}


///////////////////////
//                   //
//     Functions     //
//                   //
///////////////////////

function init() {
  // populate the interactive caustics array with 20 elements (more are created as needed, but this should be enough)
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
    // if we've reached the end of the array and the final item is animating, create a new one
    if (intC.animating && i == interactiveCaustics.length - 1) {
      let newIntC = new InteractiveCaustic();
      interactiveCaustics.push(newIntC);
      newIntC.jumpTo(event.clientX, event.clientY);
      newIntC.animate();
      break;    // animate no more caustics on a loop where a new one was created
    } else if (intC.animating) {
      continue; // this item is already animating and we're not at the end of the array; keep looking
    } else {
      // found a non-animating interactive caustic; center it on the user's interaction position and animate it
      intC.jumpTo(event.clientX, event.clientY);
      intC.animate();
      break;
    }
  }
}
