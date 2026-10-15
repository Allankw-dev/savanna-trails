# Savanna Trails

A friendly, responsive website for a Kenyan wildlife safari company. Visitors can explore the parks, meet the animals, compare tours with real-market prices, and send a booking request.

**Live site:** https://allankw-dev.github.io/savanna-trails/

<!-- Add a screenshot: save it as images/screenshot.png, then uncomment the next line -->
<!-- ![Savanna Trails home page](images/screenshot.png) -->

## Features

- **Video hero:** a looping wildlife video behind the headline, with a sunset-gradient fallback if the video is missing
- **Trip planner:** pick a destination, date and group size, and the page jumps to the matching tours
- **Parks:** Maasai Mara, Amboseli, Lake Nakuru and Samburu, each with its best season
- **Wildlife guide:** four animals and where to spot them
- **Tours with filters:** All, Day trips, Multi-day and Budget, plus an empty state when nothing matches
- **Booking form:** a dialog that collects name, email, date and guests, then shows a confirmation
- **Best time to visit:** a month-by-month chart of the Great Migration and dry seasons
- **Responsive and accessible:** works on phones and desktops, with a mobile menu, keyboard focus styles and reduced-motion support

## Tech stack

- HTML5, CSS3 and vanilla JavaScript (no frameworks, no build step)
- Google Fonts: Bricolage Grotesque and Figtree
- Hosted on GitHub Pages

## Project structure

```
savanna-trails/
├── index.html        # page structure and content
├── css/
│   └── style.css     # all styles, using CSS variables
├── js/
│   └── main.js       # menu, filters, planner, booking dialog, hero video
├── images/           # photos, hero video and poster
└── README.md
```

## Run it locally

Clone the repo:

```bash
git clone https://github.com/Allankw-dev/savanna-trails.git
cd savanna-trails
```

Then use either option.

**Option 1:** open `index.html` in your browser.

**Option 2:** serve it from a local server (needs Python or Node):

```bash
python -m http.server 3000
# or
npx live-server --port=3000
```

Open http://localhost:3000.

## Add your own media

The site looks for these files in `images/`. Anything missing falls back to a colour or gradient, so nothing breaks.

| File | Used for |
|---|---|
| `hero.mp4` | Looping background video (keep it under about 10 MB) |
| `hero-poster.jpg` | Still frame shown while the video loads |
| `mara.jpg`, `amboseli.jpg`, `nakuru.jpg`, `samburu.jpg` | Park cards |
| `lion.jpg`, `elephant.jpg`, `cheetah.jpg`, `flamingo.jpg` | Wildlife guide |

To compress a video with [ffmpeg](https://ffmpeg.org/):

```bash
ffmpeg -i input.mp4 -vf scale=1280:-2 -an -c:v libx264 -crf 28 -preset slow -movflags +faststart images/hero.mp4
```

## Tour prices

Prices are in US dollars per person sharing, based on current Kenyan operator and booking-site rates, with Kenyan shillings at about KES 129 per US$1.

| Tour | Price | Approx. in KES |
|---|---|---|
| Migration Safari (4 days, Maasai Mara) | From US$ 1,100 | 142,000 |
| Elephants and Kilimanjaro (2 days, Amboseli) | From US$ 650 | 84,000 |
| Rift Valley Day Trip (1 day, Lake Nakuru) | From US$ 190 | 24,500 |

To change a price, edit the `<p class="price">` line of that tour in `index.html`.

## Limitations and future work

This is a front-end project, so:

- The booking form only shows a confirmation. Nothing is saved yet.
- There are no user accounts and no payments.
- Only the home page is built.

Planned next steps:

- [ ] Park detail pages with maps (Leaflet)
- [ ] Backend and database (users, parks, tours, bookings)
- [ ] User login with tourist and admin roles
- [ ] Admin dashboard to manage tours and bookings
- [ ] M-Pesa and card payments

## Credits

- Photos and video: add photographer names and sources here (for example Pexels or Unsplash)
- Fonts: [Google Fonts](https://fonts.google.com/)

## Author

Built by Allan ([@Allankw-dev](https://github.com/Allankw-dev)) as a university class project.
