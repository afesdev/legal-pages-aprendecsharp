// Mejora progresiva de las páginas legales: tema, tarjetas por sección, índice y "volver arriba".
// Sin JavaScript las páginas se leen igual, solo sin estas ayudas.
(function () {
  var root = document.documentElement;
  var dark = matchMedia('(prefers-color-scheme: dark)');

  var themeBtn = document.querySelector('[data-theme-toggle]');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var isDark = root.dataset.theme ? root.dataset.theme === 'dark' : dark.matches;
      var next = isDark ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  var doc = document.querySelector('.doc');
  if (!doc) return;

  // Agrupa cada <h2> y lo que le sigue en una tarjeta; "1. Título" pasa a insignia numerada.
  var sections = [];
  var current = null;
  Array.prototype.slice.call(doc.children).forEach(function (el) {
    if (el.tagName === 'H2') {
      var match = el.textContent.trim().match(/^(\d+)\.\s*(.*)$/);
      var title = match ? match[2] : el.textContent.trim();
      current = document.createElement('section');
      current.className = 'card';
      current.id = slug(title);
      doc.insertBefore(current, el);
      current.appendChild(el);
      if (match) {
        el.textContent = '';
        var num = document.createElement('span');
        num.className = 'num';
        num.textContent = match[1];
        var text = document.createElement('span');
        text.textContent = title;
        el.append(num, text);
      }
      sections.push({ id: current.id, num: match ? match[1] : '', title: title });
    } else if (current) {
      current.appendChild(el);
    } else {
      el.classList.add('intro');
    }
  });

  var toc = document.querySelector('.toc');
  if (toc && sections.length >= 4) buildToc(toc, sections);
  else if (toc) { toc.remove(); document.querySelector('.layout').classList.add('single'); }

  var toTop = document.createElement('button');
  toTop.type = 'button';
  toTop.className = 'to-top';
  toTop.setAttribute('aria-label', 'Volver arriba');
  toTop.innerHTML = '<svg class="svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>';
  toTop.addEventListener('click', function () { scrollTo({ top: 0 }); });
  document.body.appendChild(toTop);
  addEventListener('scroll', function () {
    toTop.classList.toggle('show', scrollY > 600);
  }, { passive: true });

  function buildToc(container, items) {
    var details = document.createElement('details');
    details.className = 'toc-box';
    var summary = document.createElement('summary');
    summary.textContent = 'En esta página';
    var list = document.createElement('ol');
    var links = {};
    items.forEach(function (s) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + s.id;
      var n = document.createElement('span');
      n.textContent = s.num;
      a.append(n, document.createTextNode(s.title));
      a.addEventListener('click', function () { if (!desktop.matches) details.open = false; });
      li.appendChild(a);
      list.appendChild(li);
      links[s.id] = a;
    });
    details.append(summary, list);
    container.appendChild(details);

    // En escritorio el índice siempre está abierto; en móvil es plegable.
    var desktop = matchMedia('(min-width: 960px)');
    var sync = function () { details.open = desktop.matches; };
    sync();
    desktop.addEventListener('change', sync);
    summary.addEventListener('click', function (e) { if (desktop.matches) e.preventDefault(); });

    if (!('IntersectionObserver' in window)) return;
    var active = null;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (active) active.removeAttribute('aria-current');
        active = links[entry.target.id];
        active.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    items.forEach(function (s) { observer.observe(document.getElementById(s.id)); });
  }

  function slug(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
})();
