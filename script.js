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

const deck = document.querySelector('.inquiry-deck');
if (deck) {
  const cards = [...deck.querySelectorAll('[data-card]')];
  const toggle = deck.querySelector('.deck-toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = 0;
  let timer;
  let paused = reduceMotion;

  const renderDeck = () => {
    cards.forEach((card, index) => {
      const position = (index - active + cards.length) % cards.length;
      card.dataset.position = position < 3 ? String(position) : 'back';
      card.setAttribute('aria-hidden', position === 0 ? 'false' : 'true');
    });
  };

  const schedule = () => {
    window.clearTimeout(timer);
    if (!paused) timer = window.setTimeout(shuffle, 6000);
  };

  const shuffle = () => {
    const outgoing = cards[active];
    outgoing.classList.add('is-shuffling');
    window.setTimeout(() => {
      outgoing.classList.remove('is-shuffling');
      active = (active + 1) % cards.length;
      renderDeck();
      schedule();
    }, 900);
  };

  const setPaused = (value) => {
    paused = value;
    toggle.setAttribute('aria-pressed', String(value));
    toggle.textContent = value ? 'Play deck' : 'Pause deck';
    schedule();
  };

  toggle.addEventListener('click', () => setPaused(!paused));
  deck.addEventListener('mouseenter', () => { if (!toggle.matches('[aria-pressed="true"]')) window.clearTimeout(timer); });
  deck.addEventListener('mouseleave', schedule);
  deck.addEventListener('focusin', () => window.clearTimeout(timer));
  deck.addEventListener('focusout', schedule);

  renderDeck();
  setPaused(paused);
}
