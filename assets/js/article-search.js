(() => {
  const input = document.getElementById('guide-search');
  const form = document.getElementById('guide-search-form');
  const count = document.getElementById('guide-count');
  const empty = document.getElementById('guide-empty');
  const clear = document.getElementById('guide-search-clear');
  if (!input || !form || !count || !empty || !clear) return;

  const normalize = (text) => text.normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '').toLocaleLowerCase();
  const cards = [...document.querySelectorAll('#guide-results .library-guide')];
  const entries = cards.map((card) => ({ card, text: normalize(card.dataset.search || '') }));

  const filter = () => {
    const words = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    entries.forEach(({ card, text }) => {
      const match = words.every((word) => text.includes(word));
      card.hidden = !match;
      if (match) visible += 1;
    });
    count.textContent = `${visible} ${visible === 1 ? 'article' : 'articles'}`;
    empty.hidden = visible !== 0;
  };

  input.value = new URLSearchParams(window.location.search).get('q') || '';
  input.addEventListener('input', filter);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    filter();
  });
  clear.addEventListener('click', () => {
    input.value = '';
    filter();
    input.focus();
  });
  filter();
})();
