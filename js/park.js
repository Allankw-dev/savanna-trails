const $ = s => document.querySelector(s);

const PARKS = {
  mara: {
    name: 'Maasai Mara',
    tagline: 'Big cats, open plains and the Great Migration.',
    title: "Kenya's most famous wildlife stage",
    about: [
      "The Maasai Mara is a huge sweep of open grassland where lions, cheetahs and leopards hunt in plain view.",
      "From roughly July to October, herds of wildebeest and zebra cross the Mara River, one of the great wildlife shows on Earth. Outside migration season, the resident animals are still superb."
    ],
    wildlife: ['Lion', 'Cheetah', 'Leopard', 'Elephant', 'Giraffe', 'Zebra', 'Wildebeest', 'Hippo', 'Crocodile'],
    tips: ['Book dawn and dusk game drives, when the cats are most active.', 'Pack a light jacket, because early mornings are cool.'],
    facts: [['Best time', 'July to October for the migration. June to October is the easiest dry-season game viewing.'], ['Drive from Nairobi', 'About 5 to 6 hours'], ['Known for', 'Big cats and Mara River crossings']],
    lat: -1.49, lng: 35.14, zoom: 9,
    blurb: 'Big cats and the Great Migration river crossings.', meta: 'Migration: Jul to Oct',
    grad: 'linear-gradient(160deg,#C98A3C,#7A4A1F)'
  },
  amboseli: {
    name: 'Amboseli',
    tagline: 'Elephant herds under Mount Kilimanjaro.',
    title: 'The postcard shot of Kenya',
    about: [
      "Amboseli is famous for its elephants, which wander the swamps and dusty plains in big family herds.",
      "On a clear morning, Mount Kilimanjaro rises behind them. It is the photo every visitor hopes for, and it is an easy trip from Nairobi."
    ],
    wildlife: ['Elephant', 'Giraffe', 'Zebra', 'Wildebeest', 'Buffalo', 'Lion', 'Hippo'],
    tips: ['Mornings are usually clearest for Kilimanjaro views.', 'Bring a camera with a good zoom for the elephants.'],
    facts: [['Best time', 'June to October, and January to February (dry seasons)'], ['Drive from Nairobi', 'About 4 to 5 hours'], ['Known for', 'Big elephant herds and Kilimanjaro views']],
    lat: -2.65, lng: 37.26, zoom: 9,
    blurb: 'Elephant herds under the slopes of Kilimanjaro.', meta: 'Dry season: Jun to Oct',
    grad: 'linear-gradient(160deg,#8DA3B8,#41566B)'
  },
  nakuru: {
    name: 'Lake Nakuru',
    tagline: 'Flamingos, rhinos and Rift Valley views.',
    title: 'A compact park that packs in the wildlife',
    about: [
      "Lake Nakuru is a small park around a shallow soda lake, so it is easy to cover in a single day. Flamingos often line the shore, though their numbers change with the water levels.",
      "It is also one of the best places in Kenya to see both white and black rhinos, along with Rothschild's giraffes."
    ],
    wildlife: ['White rhino', 'Black rhino', "Rothschild's giraffe", 'Flamingo', 'Buffalo', 'Lion', 'Leopard', 'Waterbuck', 'Hippo'],
    tips: ['Bring binoculars for the birds along the shore.', 'Start early to make the most of a day trip.'],
    facts: [['Best time', 'Good all year. Dry months are easiest for game drives.'], ['Drive from Nairobi', 'About 3 hours'], ['Known for', "Flamingos, rhinos and Rothschild's giraffes"]],
    lat: -0.37, lng: 36.08, zoom: 11,
    blurb: 'Flamingos, rhinos and Rift Valley views.', meta: 'Good for day trips',
    grad: 'linear-gradient(160deg,#E39BA8,#9C4A63)'
  },
  samburu: {
    name: 'Samburu',
    tagline: 'A different Kenya, up in the dry north.',
    title: 'Species you will not find in the south',
    about: [
      "Samburu sits in Kenya's dry north along the Ewaso Ng'iro river, which draws animals in from the surrounding scrub.",
      "It is home to northern species you rarely see elsewhere, such as Grevy's zebra, reticulated giraffe and the Somali ostrich."
    ],
    wildlife: ["Grevy's zebra", 'Reticulated giraffe', 'Somali ostrich', 'Beisa oryx', 'Gerenuk', 'Elephant', 'Lion', 'Leopard', 'Crocodile'],
    tips: ['Look for the northern species you will not see in the southern parks.', 'Plan an extra day, since the drive from Nairobi is longer.'],
    facts: [['Best time', 'June to October, and January to February (dry seasons)'], ['Drive from Nairobi', 'About 5 to 6 hours'], ['Known for', 'Northern species and river wildlife']],
    lat: 0.57, lng: 37.53, zoom: 10,
    blurb: "Northern species like Grevy's zebra and reticulated giraffe.", meta: 'Explore the north',
    grad: 'linear-gradient(160deg,#C8693A,#6B2B1A)'
  }
};

// pick the park from ?park=mara (default: mara)
let key = new URLSearchParams(location.search).get('park');
if (!PARKS[key]) key = 'mara';
const p = PARKS[key];

document.title = p.name + ' | Savanna Trails';
$('#crumb').textContent = p.name;
$('#p-name').textContent = p.name;
$('#p-tagline').textContent = p.tagline;
$('#p-title').textContent = p.title;
$('#p-about').innerHTML = p.about.map(t => '<p>' + t + '</p>').join('');
$('#p-wildlife').innerHTML = p.wildlife.map(w => '<li>' + w + '</li>').join('');
$('#p-tips').innerHTML = p.tips.map(t => '<li>' + t + '</li>').join('');
$('#p-facts').innerHTML = p.facts.map(f => '<dt>' + f[0] + '</dt><dd>' + f[1] + '</dd>').join('');
$('#p-tours').href = $('#p-book').href = 'index.html?park=' + key + '#tours';
$('#park-hero').style.background =
  'linear-gradient(180deg,rgba(11,24,18,.55),rgba(11,24,18,.8)),url(images/' + key + '.jpg) center/cover,' + p.grad;

// other parks
$('#others').innerHTML = Object.keys(PARKS).filter(k => k !== key).map(k => {
  const o = PARKS[k];
  return '<a class="park" href="park.html?park=' + k + '">' +
    '<div class="photo" role="img" aria-label="' + o.name + '" style="background:url(images/' + k + '.jpg) center/cover,' + o.grad + '"></div>' +
    '<div class="body"><h3>' + o.name + '</h3><p>' + o.blurb + '</p><p class="meta">' + o.meta + '</p></div></a>';
}).join('');

// map (Leaflet + OpenStreetMap)
const mapEl = $('#map');
if (window.L) {
  const map = L.map(mapEl, {scrollWheelZoom: false}).setView([p.lat, p.lng], p.zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.marker([p.lat, p.lng]).addTo(map).bindPopup(p.name);
} else {
  mapEl.innerHTML = '<p style="padding:24px;color:#5A5648">The map could not load. Check your internet connection and refresh.</p>';
}

// mobile menu
const menu = $('#menu'), toggle = $('#menu-toggle');
toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', menu.classList.toggle('open')));
menu.addEventListener('click', e => {
  if (e.target.matches('a')) { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
});
