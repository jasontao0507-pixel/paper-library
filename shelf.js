(() => {
  'use strict';
  const list = document.getElementById('papers');
  const search = document.getElementById('paper-search');
  const sort = document.getElementById('paper-sort');
  const clear = document.getElementById('clear-search');
  const count = document.getElementById('result-count');
  const empty = document.getElementById('empty-state');
  if (!list || !search || !sort) return;

  const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase().replace(/[\u2010-\u2015\u2212]/g, '-');
  const papers = Array.from(list.children).map((element, index) => {
    const link = element.querySelector('a');
    const title = element.querySelector('.title').textContent;
    const translation = element.querySelector('.translation')?.textContent || '';
    const dates = Array.from(element.querySelectorAll('time'));
    const collected = dates.find((time) => time.textContent.startsWith('产出'))?.dateTime || '';
    return { element, index, title, collected, search: normalize(`${title} ${translation} ${link.dataset.doi || ''}`) };
  });

  function update() {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    const ordered = [...papers].sort((a, b) => sort.value === 'title'
      ? a.title.localeCompare(b.title, 'en') || a.index - b.index
      : b.collected.localeCompare(a.collected) || a.index - b.index);
    let matches = 0;
    const fragment = document.createDocumentFragment();
    ordered.forEach((paper) => {
      const visible = terms.every((term) => paper.search.includes(term));
      paper.element.hidden = !visible;
      if (visible) matches += 1;
      fragment.appendChild(paper.element);
    });
    list.appendChild(fragment);
    clear.hidden = search.value.length === 0;
    empty.hidden = matches !== 0;
    list.hidden = matches === 0;
    count.replaceChildren(document.createTextNode(terms.length ? '找到文档 ' : '全部文档 '));
    const number = document.createElement('span');
    number.textContent = terms.length ? `${matches} / ${papers.length}` : String(papers.length);
    count.appendChild(number);
  }

  function reset() {
    search.value = '';
    update();
    search.focus();
  }
  search.addEventListener('input', update);
  search.addEventListener('search', update);
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') reset();
    if (event.key === 'Enter') search.blur();
  });
  sort.addEventListener('change', update);
  clear.addEventListener('click', reset);
  document.getElementById('reset-search').addEventListener('click', reset);
  document.querySelector('.shelf-controls').hidden = false;
  update();
})();
