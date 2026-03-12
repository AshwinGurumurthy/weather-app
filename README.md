# SkyView

Real-time US weather forecasts powered by the [National Weather Service](https://www.weather.gov). No API keys, no sign-up, no ads.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

Deployment link: https://weather-app-six-sigma-20.vercel.app
---

## Features

- **Current conditions** — temperature, feels like, humidity, wind speed & direction
- **5-day forecast** — daily high and low temperatures at a glance
- **Hourly breakdown** — tap any forecast day to see hour-by-hour details with precipitation chance
- **Location search** — search any US city with live autocomplete
- **Auto-location** — detects your location via the browser geolocation API
- **°F / °C toggle** — switch temperature units instantly
- **Dynamic backgrounds** — gradient changes to match current conditions (sunny, rainy, stormy, snowy, night)
- **No external dependencies** — built on free public APIs with zero third-party UI libraries

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Weather data | [NWS API](https://www.weather.gov/documentation/services-web-api) |
| Geocoding | [Nominatim / OpenStreetMap](https://nominatim.org) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
# Build for production
npm run build
npm start
```

---

## Deployment

### Vercel (recommended)

Vercel has first-class Next.js support and a generous free tier. No configuration is needed.

**Via CLI:**
```bash
npm install -g vercel
vercel
```

**Via dashboard:**
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Click Deploy

No environment variables are required.

### Other platforms

Any platform that supports Node.js works. Run `npm run build` to produce the production build, then `npm start` to serve it.

---

## API Notes

- **Coverage:** US locations only. The NWS API does not cover international locations.
- **Rate limits:** The NWS API is free with no enforced rate limits for reasonable use.
- **Geocoding:** Location search uses Nominatim, which requires a valid `User-Agent` header and asks that you avoid sending more than one request per second.

---

## Project Structure

```
app/
├── page.tsx            # Main app — state, data fetching, and UI
├── layout.tsx          # Root layout with metadata
├── globals.css         # Global styles and custom scrollbar
├── types/
│   └── weather.ts      # TypeScript interfaces
└── utils/
    └── weather.ts      # Helper functions (emoji mapping, date formatting)
components/
├── SearchBar/          # City search input with live autocomplete
├── CurrentWeather/     # Current conditions card
├── ForecastGrid/       # 5-day forecast grid
└── HourlyPanel/        # Hourly breakdown panel for a selected day
```

---

## License

MIT
