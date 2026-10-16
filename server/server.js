require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
if (!process.env.JWT_SECRET) console.warn('Warning: JWT_SECRET is not set, using an insecure development secret.');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieParser());

// ---------- helpers ----------
const clean = s => String(s ?? '').trim();
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newReference = () => 'ST-' + Array.from({ length: 6 }, () => ALPHA[crypto.randomInt(ALPHA.length)]).join('');

// simple in-memory rate limit: max requests per IP per window
const hits = new Map();
const limit = (max, windowMs) => (req, res, next) => {
  const key = req.ip + req.path, now = Date.now();
  const recent = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (recent.length >= max) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
  recent.push(now); hits.set(key, recent); next();
};

function admin(req, res, next) {
  try { req.admin = jwt.verify(req.cookies.token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Please log in as admin.' }); }
}

// ---------- public: parks, tours, bookings (no account needed) ----------
app.get('/api/parks', (req, res) => res.json(db.prepare('SELECT * FROM parks ORDER BY name').all()));

app.get('/api/parks/:slug', (req, res) => {
  const p = db.prepare('SELECT * FROM parks WHERE slug = ?').get(req.params.slug);
  if (!p) return res.status(404).json({ error: 'Park not found.' });
  p.animals = db.prepare(`SELECT a.name, a.category FROM animals a
    JOIN park_animals pa ON pa.animal_id = a.id WHERE pa.park_id = ? ORDER BY a.name`).all(p.id);
  res.json(p);
});

const TOUR_SQL = 'SELECT t.*, p.slug AS park_slug, p.name AS park_name FROM tours t JOIN parks p ON p.id = t.park_id';
app.get('/api/tours', (req, res) => res.json(db.prepare(TOUR_SQL + ' WHERE t.active = 1 ORDER BY t.id').all()));

app.post('/api/bookings', limit(10, 3600 * 1000), (req, res) => {
  const name = clean(req.body.name), email = clean(req.body.email).toLowerCase(), phone = clean(req.body.phone);
  const guests = Number(req.body.guests), date = clean(req.body.travel_date);
  const tour = db.prepare('SELECT * FROM tours WHERE id = ? AND active = 1').get(Number(req.body.tour_id));
  if (!tour) return res.status(404).json({ error: 'That tour is not available.' });
  if (name.length < 2 || name.length > 80) return res.status(400).json({ error: 'Please enter your name.' });
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 120) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!/^\+?[0-9\s-]{7,16}$/.test(phone)) return res.status(400).json({ error: 'Please enter a valid phone number, for example 0712 345 678.' });
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) return res.status(400).json({ error: 'Guests must be between 1 and 20.' });
  if (!isDate(date) || date < new Date().toISOString().slice(0, 10)) return res.status(400).json({ error: 'Choose a travel date from today onwards.' });
  const total = tour.price_usd * guests;
  for (let i = 0; i < 5; i++) {
    const reference = newReference();
    try {
      db.prepare(`INSERT INTO bookings (reference,tour_id,customer_name,customer_email,customer_phone,travel_date,guests,total_usd)
        VALUES (?,?,?,?,?,?,?,?)`).run(reference, tour.id, name, email, phone, date, guests, total);
      return res.status(201).json({ reference, total_usd: total });
    } catch (e) { if (!String(e.message).includes('UNIQUE')) throw e; }
  }
  res.status(500).json({ error: 'Could not save your booking. Please try again.' });
});

// ---------- admin (owner only) ----------
app.post('/api/admin/login', limit(10, 15 * 60 * 1000), (req, res) => {
  const a = db.prepare('SELECT * FROM admins WHERE email = ?').get(clean(req.body.email).toLowerCase());
  if (!a || !bcrypt.compareSync(String(req.body.password || ''), a.password_hash))
    return res.status(401).json({ error: 'Wrong email or password.' });
  res.cookie('token', jwt.sign({ id: a.id, name: a.name }, SECRET, { expiresIn: '12h' }), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 12 * 3600 * 1000
  });
  res.json({ name: a.name });
});
app.post('/api/admin/logout', (req, res) => { res.clearCookie('token'); res.json({ ok: true }); });
app.get('/api/admin/me', admin, (req, res) => res.json({ name: req.admin.name }));

app.get('/api/admin/stats', admin, (req, res) => {
  const n = sql => db.prepare(sql).get().c;
  res.json({
    bookings: n('SELECT COUNT(*) c FROM bookings'),
    pending: n("SELECT COUNT(*) c FROM bookings WHERE status = 'pending'"),
    unpaid: n("SELECT COUNT(*) c FROM bookings WHERE payment_status = 'unpaid' AND status != 'cancelled'"),
    revenue_usd: n("SELECT COALESCE(SUM(total_usd),0) c FROM bookings WHERE payment_status = 'paid'"),
    tours: n('SELECT COUNT(*) c FROM tours WHERE active = 1')
  });
});

app.get('/api/admin/bookings', admin, (req, res) => res.json(db.prepare(`
  SELECT b.*, t.title AS tour_title, p.name AS park_name
  FROM bookings b JOIN tours t ON t.id = b.tour_id JOIN parks p ON p.id = t.park_id ORDER BY b.id DESC`).all()));

app.patch('/api/admin/bookings/:id', admin, (req, res) => {
  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid status.' });
  const r = db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(req.body.status, Number(req.params.id));
  if (!r.changes) return res.status(404).json({ error: 'Booking not found.' });
  res.json({ ok: true });
});

// the owner records a payment once the money arrives (for example an M-Pesa code)
app.post('/api/admin/bookings/:id/payment', admin, (req, res) => {
  const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(Number(req.params.id));
  if (!b) return res.status(404).json({ error: 'Booking not found.' });
  if (b.status === 'cancelled') return res.status(400).json({ error: 'This booking was cancelled.' });
  if (b.payment_status === 'paid') return res.status(400).json({ error: 'This booking is already paid.' });
  const method = req.body.method, reference = clean(req.body.reference).toUpperCase();
  if (!['mpesa', 'card', 'bank'].includes(method)) return res.status(400).json({ error: 'Choose M-Pesa, card or bank.' });
  if (reference.length < 4 || reference.length > 40) return res.status(400).json({ error: 'Enter the payment reference, for example the M-Pesa code.' });
  if (db.prepare('SELECT 1 FROM payments WHERE reference = ?').get(reference)) return res.status(409).json({ error: 'That payment reference was already used.' });
  db.transaction(() => {
    db.prepare('INSERT INTO payments (booking_id,method,amount_usd,reference) VALUES (?,?,?,?)').run(b.id, method, b.total_usd, reference);
    db.prepare("UPDATE bookings SET payment_status = 'paid', status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END WHERE id = ?").run(b.id);
  })();
  res.json({ ok: true });
});

app.get('/api/admin/tours', admin, (req, res) => res.json(db.prepare(TOUR_SQL + ' ORDER BY t.id').all()));

function tourInput(b) {
  const t = {
    park_id: Number(b.park_id), title: clean(b.title), description: clean(b.description), includes: clean(b.includes),
    duration_days: Number(b.duration_days), price_usd: Number(b.price_usd), is_budget: b.is_budget ? 1 : 0, active: b.active === false ? 0 : 1
  };
  if (!db.prepare('SELECT 1 FROM parks WHERE id = ?').get(t.park_id)) return { error: 'Choose a park.' };
  if (t.title.length < 3) return { error: 'Give the tour a title.' };
  if (!Number.isInteger(t.duration_days) || t.duration_days < 1 || t.duration_days > 30) return { error: 'Duration must be 1 to 30 days.' };
  if (!Number.isInteger(t.price_usd) || t.price_usd < 0) return { error: 'Price must be a whole number of US dollars.' };
  return { t };
}

app.post('/api/admin/tours', admin, (req, res) => {
  const { t, error } = tourInput(req.body);
  if (error) return res.status(400).json({ error });
  const id = db.prepare(`INSERT INTO tours (park_id,title,description,includes,duration_days,price_usd,is_budget,active)
    VALUES (@park_id,@title,@description,@includes,@duration_days,@price_usd,@is_budget,@active)`).run(t).lastInsertRowid;
  res.status(201).json({ id });
});

app.put('/api/admin/tours/:id', admin, (req, res) => {
  const { t, error } = tourInput(req.body);
  if (error) return res.status(400).json({ error });
  const r = db.prepare(`UPDATE tours SET park_id=@park_id, title=@title, description=@description, includes=@includes,
    duration_days=@duration_days, price_usd=@price_usd, is_budget=@is_budget, active=@active WHERE id=@id`).run({ ...t, id: Number(req.params.id) });
  if (!r.changes) return res.status(404).json({ error: 'Tour not found.' });
  res.json({ ok: true });
});

// tours that have bookings are archived instead of deleted, so booking history stays intact
app.delete('/api/admin/tours/:id', admin, (req, res) => {
  const id = Number(req.params.id);
  if (db.prepare('SELECT 1 FROM bookings WHERE tour_id = ?').get(id)) {
    db.prepare('UPDATE tours SET active = 0 WHERE id = ?').run(id);
    return res.json({ archived: true });
  }
  db.prepare('DELETE FROM tours WHERE id = ?').run(id);
  res.json({ deleted: true });
});

// ---------- static site ----------
const root = path.join(__dirname, '..');
['css', 'js', 'images'].forEach(d => app.use('/' + d, express.static(path.join(root, d))));
app.get(['/', '/index.html'], (req, res) => res.sendFile(path.join(root, 'index.html')));
['park', 'admin'].forEach(p => app.get('/' + p + '.html', (req, res) => res.sendFile(path.join(root, p + '.html'))));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Something went wrong.' }); });

app.listen(PORT, () => console.log(`Savanna Trails running at http://localhost:${PORT}`));
