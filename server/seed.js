require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const parks = [
  ['mara', 'Maasai Mara', 'Big cats, open plains and the Great Migration.', 'July to October (Great Migration)', -1.49, 35.14,
    ['Lion', 'Cheetah', 'Leopard', 'Elephant', 'Giraffe', 'Zebra', 'Wildebeest', 'Hippo', 'Crocodile']],
  ['amboseli', 'Amboseli', 'Elephant herds under Mount Kilimanjaro.', 'June to October, and January to February', -2.65, 37.26,
    ['Elephant', 'Giraffe', 'Zebra', 'Wildebeest', 'Buffalo', 'Lion', 'Hippo']],
  ['nakuru', 'Lake Nakuru', 'Flamingos, rhinos and Rift Valley views.', 'Good all year; dry months are easiest', -0.37, 36.08,
    ['White rhino', 'Black rhino', "Rothschild's giraffe", 'Flamingo', 'Buffalo', 'Lion', 'Leopard', 'Waterbuck', 'Hippo']],
  ['samburu', 'Samburu', 'A different Kenya, up in the dry north.', 'June to October, and January to February', 0.57, 37.53,
    ["Grevy's zebra", 'Reticulated giraffe', 'Somali ostrich', 'Beisa oryx', 'Gerenuk', 'Elephant', 'Lion', 'Leopard', 'Crocodile']]
];

// slug, title, description, includes, days, price (USD), budget?
const tours = [
  ['mara', 'Migration Safari', 'Come for the Great Migration. Dawn and dusk game drives, a day at the Mara River, and cosy nights in camp.',
    '4x4 jeep, driver-guide, park fees, meals and camp stay', 4, 1100, 0],
  ['amboseli', 'Elephants and Kilimanjaro', 'A relaxed weekend with elephant herds and Kilimanjaro at sunrise. Perfect if you only have a couple of days.',
    'safari van, driver-guide, park fees, lodge stay and meals', 2, 650, 1],
  ['nakuru', 'Rift Valley Day Trip', "Flamingos, rhinos and a lakeside lunch, and you're back in Nairobi for dinner.",
    'hotel pickup, driver-guide, park entry and lunch', 1, 190, 1]
];

const birds = ['Flamingo', 'Somali ostrich'];
const reptiles = ['Crocodile'];

db.transaction(() => {
  if (!db.prepare('SELECT 1 FROM parks LIMIT 1').get()) {
    const addPark = db.prepare('INSERT INTO parks (slug,name,tagline,best_time,lat,lng) VALUES (?,?,?,?,?,?)');
    const addAnimal = db.prepare('INSERT OR IGNORE INTO animals (name,category) VALUES (?,?)');
    const findAnimal = db.prepare('SELECT id FROM animals WHERE name = ?');
    const link = db.prepare('INSERT OR IGNORE INTO park_animals (park_id,animal_id) VALUES (?,?)');
    for (const [slug, name, tagline, best, lat, lng, animals] of parks) {
      const parkId = addPark.run(slug, name, tagline, best, lat, lng).lastInsertRowid;
      for (const a of animals) {
        addAnimal.run(a, birds.includes(a) ? 'bird' : reptiles.includes(a) ? 'reptile' : 'mammal');
        link.run(parkId, findAnimal.get(a).id);
      }
    }
    const addTour = db.prepare('INSERT INTO tours (park_id,title,description,includes,duration_days,price_usd,is_budget) VALUES (?,?,?,?,?,?,?)');
    for (const [slug, title, desc, inc, days, price, budget] of tours) {
      addTour.run(db.prepare('SELECT id FROM parks WHERE slug = ?').get(slug).id, title, desc, inc, days, price, budget);
    }
    console.log('Seeded parks, animals and tours.');
  }
  if (!db.prepare('SELECT 1 FROM admins').get()) {
    const email = (process.env.ADMIN_EMAIL || 'admin@savanna.test').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';
    db.prepare("INSERT INTO admins (name,email,password_hash) VALUES ('Admin',?,?)").run(email, bcrypt.hashSync(password, 10));
    console.log('Created admin account: ' + email + ' (change the password in .env before deploying)');
  }
})();
