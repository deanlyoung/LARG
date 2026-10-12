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

const feedbackLoop = document.querySelector('[data-feedback-loop]');
if (feedbackLoop) {
  const stages = [...feedbackLoop.querySelectorAll('[data-feedback-stage]')];
  const panels = [...feedbackLoop.querySelectorAll('[data-feedback-panel]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeStage = 0;
  let cycleTimer;
  let pointerInside = false;

  const isKeyboardActive = () => feedbackLoop.contains(document.activeElement);
  const setPausedState = () => {
    feedbackLoop.dataset.paused = String(pointerInside || isKeyboardActive() || reduceMotion);
  };

  const showStage = (index) => {
    activeStage = (index + stages.length) % stages.length;
    stages.forEach((stage, stageIndex) => stage.setAttribute('aria-pressed', String(stageIndex === activeStage)));
    panels.forEach((panel, panelIndex) => {
      const isActive = panelIndex === activeStage;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-hidden', String(!isActive));
    });
  };

  const scheduleCycle = () => {
    window.clearTimeout(cycleTimer);
    setPausedState();
    if (!reduceMotion && !pointerInside && !isKeyboardActive()) {
      cycleTimer = window.setTimeout(() => {
        showStage(activeStage + 1);
        scheduleCycle();
      }, 4000);
    }
  };

  stages.forEach((stage, index) => {
    stage.addEventListener('pointerenter', () => showStage(index));
    stage.addEventListener('focus', () => showStage(index));
    stage.addEventListener('click', () => showStage(index));
  });
  feedbackLoop.addEventListener('pointerenter', () => {
    pointerInside = true;
    window.clearTimeout(cycleTimer);
    setPausedState();
  });
  feedbackLoop.addEventListener('pointerleave', () => {
    pointerInside = false;
    scheduleCycle();
  });
  feedbackLoop.addEventListener('focusin', () => {
    window.clearTimeout(cycleTimer);
    setPausedState();
  });
  feedbackLoop.addEventListener('focusout', (event) => {
    if (!feedbackLoop.contains(event.relatedTarget)) window.setTimeout(scheduleCycle, 0);
  });

  if (reduceMotion) {
    stages.forEach((stage) => stage.setAttribute('aria-pressed', 'false'));
    panels.forEach((panel) => panel.setAttribute('aria-hidden', 'false'));
    feedbackLoop.dataset.paused = 'true';
  } else {
    showStage(0);
    scheduleCycle();
  }
}

if (window.location.hash) {
  const settleAnchor = () => document.querySelector(window.location.hash)?.scrollIntoView();
  window.addEventListener('load', settleAnchor, { once: true });
  document.fonts?.ready.then(settleAnchor);
}

const deck = document.querySelector('.inquiry-deck');
if (deck && Array.isArray(window.FIELD_NOTES) && window.FIELD_NOTES.length) {
  let cards = [...deck.querySelectorAll('[data-card]')];
  const notes = window.FIELD_NOTES;
  const toggle = deck.querySelector('[data-deck-action="toggle"]');
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
  };

  const demoteCard = (card) => {
    card.dataset.position = 'back';
    card.setAttribute('aria-hidden', 'true');
    card.tabIndex = -1;
    card.removeAttribute('role');
    card.removeAttribute('aria-label');
  };

  const schedule = () => {
    window.clearTimeout(timer);
    if (!paused) timer = window.setTimeout(() => moveTo((active + 1) % notes.length), 6500);
  };

  const finishMove = (nextIndex) => {
    active = (nextIndex + notes.length) % notes.length;
    cards.forEach((card) => card.classList.remove('is-shuffling', 'is-returning', 'is-pulling'));
    renderDeck();
    moving = false;
    schedule();
  };

  const drawNext = () => {
    if (moving) return;
    moving = true;
    window.clearTimeout(timer);
    const outgoing = cards[0];
    const incoming = cards[1];
    const nextIndex = (active + 1) % notes.length;
    demoteCard(outgoing);
    outgoing.classList.add('is-shuffling');
    fillCard(incoming, nextIndex, 0);
    window.setTimeout(() => {
      cards = [incoming, cards[2], outgoing];
      finishMove(nextIndex);
    }, 900);
  };

  const pullFromDeck = (nextIndex) => {
    nextIndex = (nextIndex + notes.length) % notes.length;
    if (moving || nextIndex === active) return;
    moving = true;
    window.clearTimeout(timer);
    const outgoing = cards[0];
    const pulled = cards[2];
    demoteCard(outgoing);
    fillCard(pulled, nextIndex, 0);
    void pulled.offsetWidth;
    outgoing.classList.add('is-returning');
    pulled.classList.add('is-pulling');
    window.setTimeout(() => {
      cards = [pulled, cards[1], outgoing];
      finishMove(nextIndex);
    }, 850);
  };

  const moveTo = (nextIndex) => {
    const normalized = (nextIndex + notes.length) % notes.length;
    if (normalized === (active + 1) % notes.length) drawNext();
    else pullFromDeck(normalized);
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

  deck.addEventListener('click', (event) => {
    const card = event.target.closest('[data-card]');
    if (card?.dataset.position === '0') drawNext();
  });
  deck.addEventListener('keydown', (event) => {
    const card = event.target.closest('[data-card]');
    if (card?.dataset.position !== '0') return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      drawNext();
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
