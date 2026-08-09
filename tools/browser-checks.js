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
