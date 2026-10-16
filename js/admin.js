const $ = s => document.querySelector(s);
const fmt = n => Number(n).toLocaleString('en-US');
const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
let tours = [], bookings = [], payId = null;

function flash(msg, bad) {
  const f = $('#flash');
  f.textContent = msg; f.className = 'flash' + (bad ? ' bad' : ''); f.hidden = false;
  clearTimeout(flash.t); flash.t = setTimeout(() => f.hidden = true, 3500);
}
const guard = fn => async (...a) => { try { await fn(...a); } catch (e) { flash(e.message, true); } };

// ---------- login (the only login on the whole site, for the owner) ----------
async function init() {
  try { await api('/api/admin/me'); await showApp(); }
  catch (e) { $('#login').hidden = false; }
}
async function showApp() {
  $('#login').hidden = true; $('#app').hidden = false; $('#logout').hidden = false;
  const parks = await api('/api/parks');
  $('#t-park').innerHTML = parks.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  loadAll();
}
$('#login-form').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await api('/api/admin/login', { method: 'POST', body: { email: $('#l-email').value, password: $('#l-pass').value } });
    await showApp();
  } catch (err) {
    $('#l-err').textContent = err.status ? err.message : 'Could not reach the server. Make sure it is running (npm start).';
    $('#l-err').hidden = false;
  }
});
$('#logout').addEventListener('click', async () => { await api('/api/admin/logout', { method: 'POST' }); location.reload(); });

// ---------- dashboard ----------
const loadAll = () => Promise.all([loadStats(), loadBookings(), loadTours()]).catch(e => flash(e.message, true));

async function loadStats() {
  const s = await api('/api/admin/stats');
  $('#stats').innerHTML = [
    ['Bookings', s.bookings], ['Pending', s.pending], ['Awaiting payment', s.unpaid],
    ['Paid revenue', 'US$ ' + fmt(s.revenue_usd)], ['Active tours', s.tours]
  ].map(([k, v]) => `<div class="stat"><b>${esc(v)}</b><span>${k}</span></div>`).join('');
}

async function loadBookings() {
  bookings = await api('/api/admin/bookings');
  $('#bk-empty').hidden = bookings.length > 0;
  $('#bk-body').innerHTML = bookings.map(b => `<tr>
    <td><strong>${esc(b.reference)}</strong><br><small>${esc(b.created_at)}</small></td>
    <td>${esc(b.customer_name)}<br><small>${esc(b.customer_email)}<br>${esc(b.customer_phone)}</small></td>
    <td>${esc(b.tour_title)}<br><small>${esc(b.park_name)}</small></td>
    <td>${esc(b.travel_date)}</td><td>${b.guests}</td><td>US$ ${fmt(b.total_usd)}</td>
    <td><span class="pill ${esc(b.payment_status)}">${esc(b.payment_status)}</span>
      ${b.payment_status === 'unpaid' && b.status !== 'cancelled' ? `<br><button class="link" data-pay="${b.id}">Record payment</button>` : ''}</td>
    <td><select data-bk="${b.id}" aria-label="Status for booking ${esc(b.reference)}">${STATUSES.map(s =>
      `<option${s === b.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('');
}
$('#bk-body').addEventListener('change', guard(async e => {
  const sel = e.target.closest('[data-bk]'); if (!sel) return;
  await api('/api/admin/bookings/' + sel.dataset.bk, { method: 'PATCH', body: { status: sel.value } });
  flash('Booking updated to ' + sel.value + '.');
  loadStats();
}));
$('#bk-body').addEventListener('click', e => {
  const btn = e.target.closest('[data-pay]'); if (!btn) return;
  const b = bookings.find(x => x.id == btn.dataset.pay);
  payId = b.id;
  $('#pay-for').textContent = b.reference + ' for ' + b.customer_name + ': US$ ' + fmt(b.total_usd);
  $('#pay-ref').value = ''; $('#pay-err').hidden = true;
  $('#pay-dlg').showModal();
});
$('#pay-form').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await api('/api/admin/bookings/' + payId + '/payment', { method: 'POST', body: { method: $('#pay-method').value, reference: $('#pay-ref').value } });
    $('#pay-dlg').close(); flash('Payment recorded and booking confirmed.'); loadAll();
  } catch (err) { $('#pay-err').textContent = err.message; $('#pay-err').hidden = false; }
});
$('#pay-cancel').addEventListener('click', () => $('#pay-dlg').close());

// ---------- tours ----------
async function loadTours() {
  tours = await api('/api/admin/tours');
  $('#t-body').innerHTML = tours.map(t => `<tr>
    <td>${esc(t.title)}</td><td>${esc(t.park_name)}</td><td>${t.duration_days}</td><td>US$ ${fmt(t.price_usd)}</td>
    <td>${t.active ? 'Active' : '<em>Archived</em>'}</td>
    <td><button class="link" data-edit="${t.id}">Edit</button> <button class="link danger" data-del="${t.id}">Delete</button></td></tr>`).join('');
}

function openTour(t) {
  $('#t-title-h').textContent = t ? 'Edit tour' : 'Add a tour';
  $('#t-id').value = t ? t.id : '';
  $('#t-park').value = t ? t.park_id : $('#t-park').options[0].value;
  $('#t-name').value = t ? t.title : '';
  $('#t-desc').value = t ? t.description || '' : '';
  $('#t-inc').value = t ? t.includes || '' : '';
  $('#t-days').value = t ? t.duration_days : 1;
  $('#t-price').value = t ? t.price_usd : '';
  $('#t-budget').checked = t ? !!t.is_budget : false;
  $('#t-active').checked = t ? !!t.active : true;
  $('#t-err').hidden = true;
  $('#tour-dlg').showModal();
}
$('#add-tour').addEventListener('click', () => openTour(null));
$('#t-cancel').addEventListener('click', () => $('#tour-dlg').close());

$('#t-body').addEventListener('click', guard(async e => {
  const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
  if (ed) openTour(tours.find(t => t.id == ed.dataset.edit));
  if (del && confirm('Delete this tour? If it has bookings it will be archived instead.')) {
    const r = await api('/api/admin/tours/' + del.dataset.del, { method: 'DELETE' });
    flash(r.archived ? 'Tour archived (it has bookings).' : 'Tour deleted.');
    loadAll();
  }
}));

$('#tour-form').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('#t-id').value;
  const body = {
    park_id: $('#t-park').value, title: $('#t-name').value, description: $('#t-desc').value, includes: $('#t-inc').value,
    duration_days: $('#t-days').value, price_usd: $('#t-price').value, is_budget: $('#t-budget').checked, active: $('#t-active').checked
  };
  try {
    await api(id ? '/api/admin/tours/' + id : '/api/admin/tours', { method: id ? 'PUT' : 'POST', body });
    $('#tour-dlg').close(); flash(id ? 'Tour updated.' : 'Tour added.'); loadAll();
  } catch (err) { $('#t-err').textContent = err.message; $('#t-err').hidden = false; }
});

init();
