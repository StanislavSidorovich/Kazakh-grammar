/*
 * Две проверки, которые нельзя сделать в node: обе требуют разметки страницы.
 *
 * Как запускать: открыть index.html в браузере, поставить окно шириной 375px
 * (в DevTools — режим телефона), открыть консоль и вставить нужную функцию
 * целиком, потом вызвать её.
 *
 * Всё остальное проверяет `node tools/check.js`.
 */

/* ---------------------------------------------------------------------------
 * 1. ШИРИНА ТАБЛИЦ
 *
 * На теле темы доступно 343px при вьюпорте 375. Таблица шире контейнера даёт
 * горизонтальную прокрутку всей страницы — на телефоне это заметно и мешает.
 * Пять колонок влезают, только если ячейки короткие: «отырмын», «тұрмын».
 * Таблица спряжения с колонками бар-/кел-/айт- и строкой «сендер»
 * (бардыңдар, келдіңдер, айттыңдар) уже не влезает — проверено, 387px.
 *
 * Вызов: checkTables()
 * -------------------------------------------------------------------------*/
function checkTables() {
  const problems = [];
  document.querySelectorAll('.topic-row[data-open], .tool-row[data-open]').forEach((row) => {
    const id = row.dataset.open;
    row.click();
    const screen = document.getElementById('screen-' + id);
    if (!screen) return;
    screen.querySelectorAll('.subnav-btn').forEach((btn) => {
      btn.click();
      screen.querySelectorAll('table').forEach((table) => {
        const w = table.getBoundingClientRect().width;
        const p = table.parentElement.getBoundingClientRect().width;
        if (w > p + 1) {
          problems.push(`${id} · ${table.rows[0].cells.length} колонок · ${Math.round(w)}px в контейнере ${Math.round(p)}px`);
        }
      });
    });
    const back = screen.querySelector('[data-back]');
    if (back) back.click();
  });

  const scroll = document.body.scrollWidth;
  const client = document.documentElement.clientWidth;
  if (scroll > client) problems.push(`страница шире экрана: ${scroll}px против ${client}px`);

  console.log(problems.length ? 'ПЕРЕПОЛНЕНИЕ:\n' + problems.join('\n') : 'Все таблицы влезают, горизонтальной прокрутки нет.');
  return problems;
}

/* ---------------------------------------------------------------------------
 * 1б. ОБРЕЗАННЫЕ БЛОКИ
 *
 * checkTables() ловит только таблицы и ширину страницы целиком, и этого мало.
 * Элемент с overflow:auto прокручивается внутри себя, страницу не расширяет —
 * и обрезка остаётся невидимой для проверки. Так пролезли сразу две:
 *
 *  · .blockbar с четырьмя кнопками требовала 761px при 640px контейнера.
 *    На телефоне это прокручивалось пальцем, а на десктопе четвёртая кнопка
 *    просто обрывалась краем. Лечится переносом (flex-wrap), а не прокруткой.
 *  · .level-track: четыре сегмента по проценту давали ровно 100%, и три
 *    зазора gap:3px вылезали сверху. Лечится flex-grow с basis 0.
 *
 * Проверять при обоих крайних размерах шрифта: при 125% не влезает то,
 * что при обычном влезало.
 *
 * Вызов: checkClipping()
 * -------------------------------------------------------------------------*/
function checkClipping() {
  const problems = [];
  const seen = new Set();

  const scan = (where) => {
    document.querySelectorAll('.screen.active, .screen.active *').forEach((el) => {
      if (!el.offsetParent) return;
      const over = el.scrollWidth - el.clientWidth;
      if (over <= 1 || el.clientWidth === 0) return;
      // Таблица при шрифте 125% прокручивается внутри себя намеренно —
      // это лечение, а не болезнь.
      if (el.tagName === 'TABLE' && getComputedStyle(el).overflowX === 'auto') return;
      const key = where + '|' + el.tagName + (el.className || '');
      if (seen.has(key)) return;
      seen.add(key);
      problems.push(`${where} · ${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} шире своего контейнера на ${over}px`);
    });
  };

  ['', 'font-plus', 'font-plus-plus'].forEach((font) => {
    document.documentElement.className = font;
    scan('главная, шрифт ' + (font || 'обычный'));
    document.querySelectorAll('.topic-row[data-open]').forEach((row) => {
      const id = row.dataset.open;
      row.click();
      const screen = document.getElementById('screen-' + id);
      if (!screen) return;
      screen.querySelectorAll('.subnav-btn').forEach((btn) => { btn.click(); scan(id); });
      const back = screen.querySelector('[data-back]');
      if (back) back.click();
    });
  });
  document.documentElement.className = '';

  console.log(problems.length ? 'ОБРЕЗКА:\n' + problems.join('\n') : 'Ничего не обрезано ни при одном размере шрифта.');
  return problems;
}

/* ---------------------------------------------------------------------------
 * 2. ЗАДАНИЯ
 *
 * Заполняет все задания темы правильными ответами и жмёт «Тексеру».
 * Должно выйти N / N верно. Ловит то, чего не видит статическая проверка:
 * ответ, который не проходит нормализацию, и слово, которое не встаёт
 * в собранную строку.
 *
 * Вызов: checkQuizzes()                       — все темы
 *        checkQuizzes(['past-simple'])        — только эти
 * -------------------------------------------------------------------------*/
function checkQuizzes(ids) {
  const list = ids || [...document.querySelectorAll('.topic-row[data-open]')].map((r) => r.dataset.open);
  const out = [];

  for (const id of list) {
    const row = document.querySelector('.topic-row[data-open="' + id + '"]');
    if (!row) { out.push(id + ': нет такой темы'); continue; }
    row.click();

    const screen = document.getElementById('screen-' + id);
    const tab = screen.querySelector('.subnav-btn[data-pane="quiz"]');
    if (!tab) { out.push(id + ': нет вкладки заданий'); continue; }
    tab.click();

    const pane = screen.querySelector('.pane-quiz');
    pane.querySelectorAll('input.blank').forEach((i) => { i.value = i.dataset.answer.split('|')[0]; });
    pane.querySelectorAll('select.mc').forEach((s) => { s.value = s.dataset.answer; });
    pane.querySelectorAll('.qbuild').forEach((box) => {
      box.dataset.answer.replace(/[.,!?;:—–-]/g, '').split(/\s+/).forEach((word) => {
        const btn = [...box.querySelectorAll('.qbuild-bank .qword')].find((b) => b.textContent.trim() === word);
        if (btn) btn.click();
        else out.push(`${id}: слова «${word}» нет в банке`);
      });
    });

    pane.querySelector('.btn-check').click();
    const result = pane.querySelector('.quiz-result').textContent;
    const wrong = [...pane.querySelectorAll('input.blank.bad, select.mc.bad')].map((e) => e.dataset.answer);
    out.push(id + ': ' + result + (wrong.length ? ' · не зачлись: ' + wrong.join(', ') : ''));

    const back = screen.querySelector('[data-back]');
    if (back) back.click();
  }

  console.log(out.join('\n'));
  return out;
}
