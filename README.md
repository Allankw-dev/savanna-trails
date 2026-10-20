# Savanna Trails...

A full-stack website for a Kenyan wildlife safari company. Visitors explore four national parks, compare tours, plan a trip and book as a guest. The owner manages bookings, payments and tours from a private admin dashboard.

**Live demo (front end only):** <https://allankw-dev.github.io/savanna-trails/>

> GitHub Pages cannot run a server, so the live demo runs in **demo mode**: the tours you see are static and booking requests are not saved. Run the project locally (see [Getting started](#getting-started)) for the full version with the database and admin dashboard.

## Features

**For visitors**

- Looping video hero with a sunset-gradient fallback if the video is missing
- Trip planner: pick a park, date and group size, and the page jumps to the matching tours
- Four parks (Maasai Mara, Amboseli, Lake Nakuru, Samburu), each with its own detail page, wildlife list, travel tips and a Leaflet map
- Tours loaded from the database, with filters for All, Day trips, Multi-day and Budget
- Guest booking: no account needed. The visitor gets a booking reference (for example `ST-K4M7QX`) and a total price
- Best-time-to-visit chart for the Great Migration and dry seasons
- Responsive and accessible: mobile menu, keyboard focus styles, reduced-motion support

**For the owner (`/admin.html`)**

- Secure login (bcrypt password hashing, JWT in an httpOnly cookie)
- Dashboard with total bookings, pending bookings, unpaid bookings, revenue and active tours
- Booking management: move bookings between pending, confirmed, completed and cancelled
- Payment recording: log an M-Pesa, card or bank payment reference once the money arrives. The booking is marked paid and a pending booking becomes confirmed
- Tour management: add, edit and remove tours. A tour that already has bookings is archived instead of deleted, so booking history stays intact..

## Tech stack

| Layer | Technology |
| --- | --- |
| Front end | HTML5, CSS3, vanilla JavaScript (no framework, no build step) |
| Back end | Node.js, Express 5 |
| Database | SQLite via `better-sqlite3` |
| Auth | `bcryptjs`, `jsonwebtoken`, `cookie-parser` |
| Config | `dotenv` |
| Maps and fonts | Leaflet, Google Fonts (Bricolage Grotesque, Figtree) |

## Getting started

**Requirements:** Node.js 18 or newer.

```bash
git clone https://github.com/Allankw-dev/savanna-trails.git
cd savanna-trails
npm install
cp .env.example .env      # on Windows PowerShell: Copy-Item .env.example .env
```

Open `.env` and set your own values:

```env
PORT=3000
JWT_SECRET=change-this-to-a-long-random-string
ADMIN_EMAIL=admin@savanna.test
ADMIN_PASSWORD=ChangeMe123!
```

Then create the database and start the server:

```bash
npm run seed    # creates the tables, the parks, animals and tours, and the admin account
npm start       # or: npm run dev   (restarts on file changes)
```


Log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`. The seed script only creates data that does not exist yet, so it is safe to run again.

### Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Runs the server |
| `npm run dev` | Runs the server and restarts it when files change |
| `npm run seed` | Creates the database, sample data and the admin account |

## Project structure

```
savanna-trails/
├── server/
│   ├── server.js       # Express app: public API, admin API, static files
│   ├── db.js           # SQLite connection and table definitions
│   └── seed.js         # parks, animals, tours and the admin account
├── css/style.css       # all styles, using CSS variables
├── js/
│   ├── api.js          # shared fetch helper and HTML escaping
│   ├── main.js         # home page: menu, filters, planner, booking dialog
│   ├── park.js         # park detail pages and maps
│   └── admin.js        # admin dashboard
├── images/             # photos, hero video and poster
├── index.html          # home page
├── park.html           # park detail page
├── admin.html          # admin dashboard
├── .env.example        # settings template
└── package.json
```

The SQLite database is created at `data/savanna.db` and is ignored by Git.

## API reference

**Public**

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/parks` | List all parks |
| GET | `/api/parks/:slug` | One park with its animals |
| GET | `/api/tours` | Active tours, with park name and slug |
| POST | `/api/bookings` | Create a guest booking. Returns `reference` and `total_usd` |

**Admin** (requires login)

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/admin/login` | Log in and set the auth cookie |
| POST | `/api/admin/logout` | Clear the auth cookie |
| GET | `/api/admin/me` | Check the current session |
| GET | `/api/admin/stats` | Dashboard numbers |
| GET | `/api/admin/bookings` | All bookings, newest first |
| PATCH | `/api/admin/bookings/:id` | Change a booking's status |
| POST | `/api/admin/bookings/:id/payment` | Record a payment (`mpesa`, `card` or `bank`) |
| GET | `/api/admin/tours` | All tours, including archived ones |
| POST | `/api/admin/tours` | Create a tour |
| PUT | `/api/admin/tours/:id` | Update a tour |
| DELETE | `/api/admin/tours/:id` | Delete a tour, or archive it if it has bookings |

## Database

Seven tables: `admins`, `parks`, `animals`, `park_animals` (links parks to animals), `tours`, `bookings` and `payments`. Foreign keys are on, and the schema uses `CHECK` constraints to keep statuses, guest counts and prices valid.

## Security notes

- Passwords are hashed with bcrypt. The auth token lives in an httpOnly, `sameSite=lax` cookie that expires after 12 hours
- All booking and tour input is validated on the server (names, email, phone, dates, guest count, prices)
- All database queries use prepared statements
- Booking and login endpoints are rate limited per IP
- Payment references must be unique, so the same M-Pesa code cannot be recorded twice
- On the front end, text from the server is escaped before it is put into the page

## Deploying

1. Set `NODE_ENV=production`. This turns on secure cookies and proxy trust
2. Set a long random `JWT_SECRET` and a strong `ADMIN_PASSWORD`
3. Run `npm install`, then `npm run seed` once, then `npm start`
4. Serve the site over HTTPS. The `data/` folder must be on persistent storage, because that is where the SQLite file lives

## Limitations and future work

Current limitations:

- Payments are recorded by the owner by hand. Money is not collected automatically
- No email or SMS confirmation is sent to the customer
- No customer accounts. Guests keep their booking reference
- The rate limiter is kept in memory, so it resets when the server restarts
- SQLite suits a single server, not several servers sharing one database

Planned next steps:

- [ ] M-Pesa STK push payments (Daraja API)
- [ ] Email confirmations with the booking reference
- [ ] Look up a booking by reference and email
- [ ] Card payments
- [ ] Tour photos and availability by date

## Credits

- Photos and video: add photographer names and sources here (for example Pexels or Unsplash)
- Fonts: [Google Fonts](https://fonts.google.com/)
- Maps: [Leaflet](https://leafletjs.com/) with OpenStreetMap data

## Author

Built by Allan ([@Allankw-dev](https://github.com/Allankw-dev)) as a university project.
