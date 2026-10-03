/* Progressive enhancement for the existing article formats; no paper text is rewritten. */
(() => {
  'use strict';
  const root = document.documentElement;
  if (root.hasAttribute('data-reader')) return;
  root.setAttribute('data-reader', 'mobile-v2');
  const storageKey = 'paper-library.reader-font';
  const fontSizes = { small: '17px', standard: '19px', large: '21px' };
  let selectedSize = 'standard';
  try { selectedSize = localStorage.getItem(storageKey) || 'standard'; } catch (_) { /* Private browsing may disable storage. */ }
  if (!fontSizes[selectedSize]) selectedSize = 'standard';
  root.style.setProperty('--reader-font-size', fontSizes[selectedSize]);

  // Mark the real reading surfaces rather than relying on any single legacy template.
  let surfaces = Array.from(document.querySelectorAll('main'));
  if (!surfaces.length) {
    const candidate = document.querySelector('.layout > article, body > .page, body > .container, body > .wrap');
    surfaces = [candidate || document.body];
  }
  surfaces.forEach(surface => {
    surface.classList.add('reader-content');
    let frame = surface.parentElement;
    while (frame && frame !== document.body) {
      if (frame.matches('.layout, .shell, .wrap, .page, .container, .reader')) frame.classList.add('reader-frame');
      frame = frame.parentElement;
    }
  });
  document.querySelectorAll('table').forEach(table => {
    if (table.closest('.table-wrap, .table-scroll, .table-shell, .bil-table-wrap, .reader-table-scroll')) return;
    const wrap = document.createElement('div');
    wrap.className = 'reader-table-scroll';
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', '表格，可左右滑动');
    table.before(wrap);
    wrap.append(table);
  });

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function button(text, label) {
    const node = element('button', '', text);
    node.type = 'button';
    if (label) node.setAttribute('aria-label', label);
    return node;
  }
  function icon(path) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const line = document.createElementNS(svg.namespaceURI, 'path');
    line.setAttribute('d', path);
    svg.append(line);
    return svg;
  }
  let lastFocused = null;
  function openDialog(dialog, trigger) {
    lastFocused = trigger || document.activeElement;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }
  function closeDialog(dialog) {
    if (typeof dialog.close === 'function') dialog.close();
    else { dialog.removeAttribute('open'); restoreFocus(); }
  }
  function restoreFocus() {
    document.querySelectorAll('.reader-dock [aria-expanded="true"]').forEach(node => node.setAttribute('aria-expanded', 'false'));
    if (lastFocused && lastFocused.isConnected) {
      if (lastFocused.hasAttribute('aria-expanded')) lastFocused.setAttribute('aria-expanded', 'false');
      lastFocused.focus({ preventScroll: true });
    }
  }
  function makeDialog(id, title) {
    const dialog = element('dialog', 'reader-dialog');
    dialog.id = id;
    dialog.setAttribute('aria-labelledby', id + '-title');
    const heading = element('div', 'reader-dialog-heading');
    const titleNode = element('h2', '', title);
    titleNode.id = id + '-title';
    const close = button('关闭', '关闭' + title);
    close.addEventListener('click', () => closeDialog(dialog));
    heading.append(titleNode, close);
    dialog.append(heading);
    dialog.addEventListener('close', restoreFocus);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
    document.body.append(dialog);
    return { dialog, heading, titleNode, close };
  }

  const dock = element('div', 'reader-dock');
  dock.setAttribute('role', 'navigation');
  dock.setAttribute('aria-label', '阅读工具');
  const shelf = element('a', '', '书架');
  shelf.href = '../../';
  shelf.setAttribute('aria-label', '返回论文书架');
  shelf.prepend(icon('M10 5 3 12l7 7M3 12h17'));
  const fonts = button('字号', '调整阅读字号');
  fonts.prepend(icon('M3 18 8 6l5 12M5 14h6M15 18l3-8 3 8M16 15h4'));
  const toc = button('目录', '打开论文目录');
  toc.prepend(icon('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'));
  [fonts, toc].forEach(control => { control.setAttribute('aria-haspopup', 'dialog'); control.setAttribute('aria-expanded', 'false'); });
  dock.append(shelf, fonts, toc);
  document.body.append(dock);

  const fontPanel = makeDialog('reader-font-dialog', '阅读字号');
  const fontOptions = element('div', 'reader-font-options');
  fontOptions.setAttribute('role', 'group');
  fontOptions.setAttribute('aria-label', '选择字号');
  Object.entries({ small: '紧凑', standard: '标准', large: '大字' }).forEach(([value, text]) => {
    const control = button(text, text + '，' + parseInt(fontSizes[value], 10) + ' 像素');
    control.dataset.readerSize = value;
    control.setAttribute('aria-pressed', String(value === selectedSize));
    control.addEventListener('click', () => {
      selectedSize = value;
      root.style.setProperty('--reader-font-size', fontSizes[value]);
      fontOptions.querySelectorAll('button').forEach(option => option.setAttribute('aria-pressed', String(option === control)));
      try { localStorage.setItem(storageKey, value); } catch (_) { /* Reading remains available without persistence. */ }
    });
    fontOptions.append(control);
  });
  fontPanel.dialog.append(fontOptions, element('p', 'reader-hint', '字号会记住。图表可点开查看，长表格与公式可左右滑动。'));
  fonts.setAttribute('aria-controls', fontPanel.dialog.id);
  fonts.addEventListener('click', () => openDialog(fontPanel.dialog, fonts));

  const tocPanel = makeDialog('reader-toc-dialog', '文章目录');
  const tocList = element('ol', 'reader-toc-list');
  tocPanel.dialog.append(tocList);
  const headingSelector = 'h2, h3, .h2, .h3, .section-heading, .pair.heading, .pair.heading-pair, .pair.pair-heading, .pair.kind-heading, .pair.type-heading, .pair.type-subheading, .pair.subheading, .pair.subheading-pair, .pair[data-kind="heading"], .pair[data-kind="h2"], .pair[data-kind="h3"], .pair[data-id^="h-"]';
  const headings = Array.from(document.querySelectorAll(headingSelector)).filter(node => !node.closest('.reader-dialog, nav, aside') && !node.parentElement.closest(headingSelector));
  headings.forEach((heading, index) => {
    if (!heading.id) heading.id = 'reader-section-' + (index + 1);
    heading.classList.add('reader-heading');
    const sub = heading.matches('h3, .h3, .level-3, .type-subheading, .subheading, .subheading-pair, [data-kind="h3"], [data-level="3"], [data-level="4"]');
    if (sub) heading.classList.add('reader-heading-sub');
  });
  function buildContents() {
    tocList.replaceChildren();
    headings.forEach(heading => {
      if (!heading.getClientRects().length) return;
      const preferred = Array.from(heading.querySelectorAll('.zh, [lang^="zh"], .translation, .en, [lang="en"]')).find(node => node.getClientRects().length);
      const label = (preferred || heading).textContent.replace(/\s+/g, ' ').trim();
      if (!label) return;
      const item = element('li', heading.classList.contains('reader-heading-sub') ? 'reader-toc-sub' : '');
      const link = element('a', '', label);
      link.href = '#' + heading.id;
      link.addEventListener('click', () => { closeDialog(tocPanel.dialog); });
      item.append(link);
      tocList.append(item);
    });
    if (!tocList.children.length) {
      const item = element('li');
      const top = element('a', '', '回到文章开头');
      top.href = '#';
      top.addEventListener('click', () => closeDialog(tocPanel.dialog));
      item.append(top);
      tocList.append(item);
    }
  }
  toc.setAttribute('aria-controls', tocPanel.dialog.id);
  toc.addEventListener('click', () => { buildContents(); openDialog(tocPanel.dialog, toc); });

  const viewer = makeDialog('reader-image-dialog', '原图查看');
  viewer.dialog.classList.add('reader-image-dialog');
  const imageTools = element('div', 'reader-image-tools');
  const sizeToggle = button('原尺寸', '按原始尺寸查看图片');
  sizeToggle.setAttribute('aria-pressed', 'false');
  imageTools.append(sizeToggle, viewer.close);
  viewer.heading.append(imageTools);
  const caption = element('p', 'reader-image-caption');
  const stage = element('div', 'reader-image-stage');
  stage.tabIndex = 0;
  stage.setAttribute('role', 'region');
  stage.setAttribute('aria-label', '图像区域，可双指缩放，原尺寸模式可左右上下滑动');
  const expanded = element('img');
  expanded.alt = '';
  stage.append(expanded);
  viewer.dialog.append(caption, stage);
  function setNatural(natural) {
    stage.classList.toggle('reader-image-natural', natural);
    sizeToggle.textContent = natural ? '适合屏幕' : '原尺寸';
    sizeToggle.setAttribute('aria-pressed', String(natural));
    sizeToggle.setAttribute('aria-label', natural ? '将整张图片适配屏幕宽度' : '按原始尺寸查看图片');
    stage.scrollTo(0, 0);
  }
  sizeToggle.addEventListener('click', () => setNatural(!stage.classList.contains('reader-image-natural')));
  function openImage(original) {
    expanded.src = original.currentSrc || original.src;
    expanded.alt = original.alt || '论文图表';
    expanded.style.setProperty('--reader-image-width', (original.naturalWidth || 1200) + 'px');
    caption.textContent = original.alt || '双指可缩放；切换原尺寸后可拖动查看细节。';
    setNatural(false);
    openDialog(viewer.dialog, original.closest('button, a') || original);
  }
  const imageSelector = '.reader-content img, figure img, .embedded-figure img, .embedded-table-image img, .equation-image img, .equation img, .display-eq img, .paper-figure img';
  document.querySelectorAll(imageSelector).forEach(img => {
    if (img.matches('.math-inline, .inline-math') || img.closest('dialog')) return;
    img.setAttribute('data-reader-zoom', '');
    img.classList.add('reader-graphic');
    const trigger = img.closest('button, a') || img;
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', viewer.dialog.id);
    trigger.setAttribute('aria-expanded', 'false');
    if (!img.closest('button, a')) {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', '放大图片：' + (img.alt || '论文图表'));
    }
  });
  // Capture only marked images so old article zoom listeners cannot open a second dialog.
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const img = target && (target.matches('[data-reader-zoom]') ? target : target.closest('button')?.querySelector('[data-reader-zoom]'));
    if (!img) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openImage(img);
  }, true);
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target instanceof Element && event.target.matches('[data-reader-zoom]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openImage(event.target);
    }
  }, true);
})();
