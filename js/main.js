const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const parkNames = {mara:'Maasai Mara', amboseli:'Amboseli', nakuru:'Lake Nakuru', samburu:'Samburu'};

// hero video background (skipped if the person prefers reduced motion)
const hero = $('.hero'), vid = $('.hero-video');
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  vid.remove();
} else {
  vid.addEventListener('loadeddata', () => hero.classList.add('has-video'));
  vid.play().catch(() => {});
}

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

// tours and bookings: use the server when it is running, otherwise keep the demo cards and demo form
const KES = 129;
const fmt = n => Number(n).toLocaleString('en-US');
let serverUp = false, tourId = null, tourName = '';
const dlg = $('#book-dlg'), form = $('#book-form');

function showDone(title, text) {
  $('#book-done').querySelector('h2').textContent = title;
  $('#done-text').textContent = text;
  form.hidden = true; $('#book-done').hidden = false;
}

async function loadTours() {
  try {
    const tours = await api('/api/tours');
    serverUp = true;
    $('.tours').innerHTML = tours.map(t => `
      <article class="tour reveal in" data-id="${t.id}" data-park="${esc(t.park_slug)}" data-type="${t.duration_days === 1 ? 'day' : 'multi'}" data-budget="${t.is_budget ? 'yes' : 'no'}">
        <p class="when">${t.duration_days} day${t.duration_days > 1 ? 's' : ''} in ${esc(t.park_name)}</p><h3>${esc(t.title)}</h3>
        <p class="desc">${esc(t.description)}</p>
        <p class="price">From US$ ${fmt(t.price_usd)}<small>about KES ${fmt(Math.round(t.price_usd * KES / 500) * 500)} per person</small></p>
        <p class="incl">${t.includes ? 'Includes: ' + esc(t.includes) : ''}</p>
        <button class="btn btn-orange book" data-id="${t.id}" data-tour="${esc(t.title)}">Book this tour</button>
      </article>`).join('');
    applyFilters();
  } catch (e) { /* server not running: the static cards stay */ }
}

document.addEventListener('click', e => {
  const b = e.target.closest('.book');
  if (!b) return;
  tourId = b.dataset.id; tourName = b.dataset.tour;
  $('#book-title').textContent = 'Book: ' + tourName;
  $('#b-date').value = $('#p-date').value;
  $('#b-guests').value = $('#p-guests').value || 2;
  $('#book-error').hidden = true;
  form.hidden = false; $('#book-done').hidden = true;
  dlg.showModal();
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  const d = new FormData(form);
  const first = String(d.get('name')).trim().split(' ')[0];
  if (!serverUp) {  // demo mode (no server): nothing is saved
    showDone('Request sent', 'Asante sana, ' + first + '! This is demo mode, so your request for ' + tourName + ' was not saved.');
    form.reset();
    return;
  }
  try {
    const r = await api('/api/bookings', { method: 'POST', body: {
      tour_id: Number(tourId), travel_date: d.get('date'), guests: Number(d.get('guests')),
      name: d.get('name'), email: d.get('email'), phone: d.get('phone') } });
    showDone('Booking received', 'Asante sana, ' + first + '! Your reference is ' + r.reference + ' for ' + tourName + ' (total US$ ' + fmt(r.total_usd) + '). We will contact you to confirm and share payment details. Please keep your reference.');
    form.reset();
  } catch (err) {
    $('#book-error').textContent = err.status ? err.message : 'Could not reach the server. Please try again.';
    $('#book-error').hidden = false;
  }
});
$('#b-cancel').addEventListener('click', () => dlg.close());
$('#b-close').addEventListener('click', () => dlg.close());


// sticky header turns solid after scrolling
const topbar = $('#topbar');
const onScroll = () => topbar.classList.toggle('solid', window.scrollY > 40);
onScroll();
addEventListener('scroll', onScroll, {passive: true});

// fade-in on scroll (cards stagger within each grid)
$$('.grid').forEach(g => [...g.children].forEach((el, i) => {
  el.classList.add('reveal');
  el.style.setProperty('--d', (i * 0.08) + 's');
}));
['.kicker', '.h2', '.intro', '.chips', '.cal-scroll', '.cta-box'].forEach(s => $$(s).forEach(el => el.classList.add('reveal')));
const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries, obs) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
}, {threshold: 0.12}) : null;
$$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));


// arriving from a park page (index.html?park=mara#tours) opens the tours filtered
const startPark = new URLSearchParams(location.search).get('park');
if (startPark && parkNames[startPark]) { park = startPark; applyFilters(); }

loadTours();
