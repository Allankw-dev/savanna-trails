const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const parkNames = {mara:'Maasai Mara', amboseli:'Amboseli', nakuru:'Lake Nakuru', samburu:'Samburu'};

// mobile menu
const menu = $('#menu'), toggle = $('#menu-toggle');
toggle.addEventListener('click', () => {
  toggle.setAttribute('aria-expanded', menu.classList.toggle('open'));
});
menu.addEventListener('click', e => {
  if (e.target.matches('a')) { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
});

// no past dates
const today = new Date().toISOString().split('T')[0];
['#p-date', '#b-date'].forEach(id => $(id).min = today);

// tour filtering
let type = 'all', park = 'all';
function applyFilters() {
  let shown = 0;
  $$('.tour').forEach(t => {
    const typeOk = type === 'all' || (type === 'budget' ? t.dataset.budget === 'yes' : t.dataset.type === type);
    const parkOk = park === 'all' || t.dataset.park === park;
    t.hidden = !(typeOk && parkOk);
    if (!t.hidden) shown++;
  });
  $('#empty').hidden = shown > 0;
  $$('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === type)));
  const status = $('#status');
  status.innerHTML = park === 'all' ? '' : 'Showing tours for ' + parkNames[park] + '. <button type="button" id="clear-park">Show all parks</button>';
  const clear = $('#clear-park');
  if (clear) clear.addEventListener('click', () => { park = 'all'; applyFilters(); });
}
$$('.chip').forEach(c => c.addEventListener('click', () => { type = c.dataset.filter; applyFilters(); }));
$$('.park').forEach(p => p.addEventListener('click', () => { park = p.dataset.park; type = 'all'; applyFilters(); }));

// trip planner
$('#planner').addEventListener('submit', e => {
  e.preventDefault();
  park = $('#p-park').value; type = 'all';
  applyFilters();
  $('#tours').scrollIntoView();
});

// booking dialog (front end only: shows a confirmation, nothing is saved)
const dlg = $('#book-dlg'), form = $('#book-form');
let tourName = '';
$$('.book').forEach(b => b.addEventListener('click', () => {
  tourName = b.dataset.tour;
  $('#book-title').textContent = 'Book: ' + tourName;
  $('#b-date').value = $('#p-date').value;
  $('#b-guests').value = $('#p-guests').value || 2;
  form.hidden = false; $('#book-done').hidden = true;
  dlg.showModal();
}));
form.addEventListener('submit', e => {
  e.preventDefault();
  const d = new FormData(form);
  $('#done-text').textContent = 'Thanks ' + d.get('name') + '. We received your request for ' + tourName + ' on ' + d.get('date') + ' for ' + d.get('guests') + ' guest(s). We will email ' + d.get('email') + ' to confirm.';
  form.hidden = true; $('#book-done').hidden = false;
  form.reset();
});
$('#b-cancel').addEventListener('click', () => dlg.close());
$('#b-close').addEventListener('click', () => dlg.close());
