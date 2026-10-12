const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
document.getElementById('year').textContent = new Date().getFullYear();

if (window.location.hash) {
  const settleAnchor = () => document.querySelector(window.location.hash)?.scrollIntoView();
  window.addEventListener('load', settleAnchor, { once: true });
  document.fonts?.ready.then(settleAnchor);
}

const deck = document.querySelector('.inquiry-deck');
if (deck && Array.isArray(window.FIELD_NOTES) && window.FIELD_NOTES.length) {
  const cards = [...deck.querySelectorAll('[data-card]')];
  const notes = window.FIELD_NOTES;
  const toggle = deck.querySelector('[data-deck-action="toggle"]');
  const counter = deck.querySelector('.deck-counter');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = 0;
  let timer;
  let paused = reduceMotion;
  let moving = false;

  const formatNumber = (number) => String(number).padStart(3, '0');

  const fillCard = (card, noteIndex, position) => {
    const note = notes[noteIndex];
    card.querySelector('[data-note-number]').textContent = `№ ${formatNumber(noteIndex + 1)}`;
    card.querySelector('[data-note-prompt]').textContent = `“${note.prompt}”`;
    card.querySelector('[data-note-label]').textContent = note.label;
    card.dataset.position = String(position);
    card.setAttribute('aria-hidden', position === 0 ? 'false' : 'true');
    card.tabIndex = position === 0 ? 0 : -1;
    if (position === 0) {
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Field note ${formatNumber(noteIndex + 1)}: ${note.prompt} Draw the next card.`);
    } else {
      card.removeAttribute('role');
      card.removeAttribute('aria-label');
    }
  };

  const renderDeck = () => {
    cards.forEach((card, position) => fillCard(card, (active + position) % notes.length, position));
    counter.value = `${formatNumber(active + 1)} / ${notes.length}`;
  };

  const schedule = () => {
    window.clearTimeout(timer);
    if (!paused) timer = window.setTimeout(() => moveTo((active + 1) % notes.length), 6500);
  };

  const moveTo = (nextIndex) => {
    if (moving || nextIndex === active) return;
    moving = true;
    window.clearTimeout(timer);
    const outgoing = cards[0];
    outgoing.classList.add('is-shuffling');
    window.setTimeout(() => {
      outgoing.classList.remove('is-shuffling');
      active = (nextIndex + notes.length) % notes.length;
      renderDeck();
      moving = false;
      schedule();
    }, 900);
  };

  const setPaused = (value) => {
    paused = value;
    toggle.setAttribute('aria-pressed', String(value));
    toggle.setAttribute('aria-label', value ? 'Play automatic shuffling' : 'Pause automatic shuffling');
    toggle.dataset.tooltip = value ? 'Play' : 'Pause';
    schedule();
  };

  toggle.addEventListener('click', () => setPaused(!paused));
  deck.querySelector('[data-deck-action="previous"]').addEventListener('click', () => moveTo(active - 1));
  deck.querySelector('[data-deck-action="next"]').addEventListener('click', () => moveTo(active + 1));
  deck.querySelector('[data-deck-action="shuffle"]').addEventListener('click', () => {
    let randomIndex = active;
    while (randomIndex === active) randomIndex = Math.floor(Math.random() * notes.length);
    moveTo(randomIndex);
  });

  cards[0].addEventListener('click', () => moveTo(active + 1));
  cards[0].addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      moveTo(active + 1);
    }
  });

  deck.addEventListener('pointermove', (event) => {
    const bounds = deck.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    deck.style.setProperty('--pointer-x', `${x * 100}%`);
    deck.style.setProperty('--pointer-y', `${y * 100}%`);
    deck.style.setProperty('--tilt-x', `${(0.5 - y) * 5}deg`);
    deck.style.setProperty('--tilt-y', `${(x - 0.5) * 6}deg`);
  });
  deck.addEventListener('pointerleave', () => {
    deck.style.setProperty('--pointer-x', '50%');
    deck.style.setProperty('--pointer-y', '50%');
    deck.style.setProperty('--tilt-x', '0deg');
    deck.style.setProperty('--tilt-y', '0deg');
  });

  deck.addEventListener('mouseenter', () => window.clearTimeout(timer));
  deck.addEventListener('mouseleave', schedule);
  deck.addEventListener('focusin', () => window.clearTimeout(timer));
  deck.addEventListener('focusout', (event) => {
    if (!deck.contains(event.relatedTarget)) schedule();
  });

  renderDeck();
  setPaused(paused);
}
