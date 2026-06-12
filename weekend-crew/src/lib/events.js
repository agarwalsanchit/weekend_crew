// "What's happening" feed: real, specific events for each upcoming weekend
// (curated June–July 2026: World Cup, theater releases, TV premieres),
// with generic discovery links as a fallback for uncurated weekends.
// weekend.key = ISO date of the Saturday.

const CURATED = {
  // Sat Jun 13 – Sun Jun 14
  "2026-06-13": [
    {
      type: "concert", // renders with the ticket icon
      title: "⚽ World Cup AT Levi's: Qatar vs Switzerland — Sat 12pm, in person!",
      site: "Levi's Stadium",
      link: "https://levisstadium.com/event/fifa-world-cup-group-stage-2026-06-13/",
    },
    {
      type: "chill",
      title: "⚽ Brazil vs Morocco — Sat 3pm PT, watch party material",
      site: "FOX / Telemundo",
      link: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures",
    },
    {
      type: "movie",
      title: "Disclosure Day — Spielberg's new sci-fi, just opened",
      site: "Fandango",
      link: "https://www.fandango.com/search?q=Disclosure%20Day",
    },
  ],
  // Fri Jun 19 – Sun Jun 21 (Juneteenth long weekend)
  "2026-06-20": [
    {
      type: "concert",
      title: "⚽ World Cup AT Levi's: Türkiye vs Paraguay — Fri 8pm, in person!",
      site: "Levi's Stadium",
      link: "https://www.worldcupsantaclara.com/matches",
    },
    {
      type: "chill",
      title: "⚽ USA vs Australia — Fri afternoon, pub watch party?",
      site: "FOX / Telemundo",
      link: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures",
    },
    {
      type: "movie",
      title: "Toy Story 5 — opens this weekend 🤠",
      site: "Fandango",
      link: "https://www.fandango.com/search?q=Toy%20Story%205",
    },
    {
      type: "chill",
      title: "House of the Dragon S3 premiere — Sun night 🐉",
      site: "HBO Max",
      link: "https://www.hbomax.com",
    },
  ],
  // Sat Jun 27 – Sun Jun 28
  "2026-06-27": [
    {
      type: "movie",
      title: "Supergirl or Jackass: Best and Last — both just opened",
      site: "Fandango",
      link: "https://www.fandango.com/movies-in-theaters",
    },
    {
      type: "chill",
      title: "⚽ Panama vs England — Sat 2pm PT on TV",
      site: "FOX / Telemundo",
      link: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures",
    },
    {
      type: "chill",
      title: "The Bear final season binge — all episodes out Jun 25 🍝",
      site: "Hulu",
      link: "https://www.hulu.com/series/the-bear",
    },
  ],
  // Fri Jul 3 – Sun Jul 5 (July 4th long weekend)
  "2026-07-04": [
    {
      type: "chill",
      title: "⚽ World Cup Round-of-32 knockouts all weekend + July 4th fireworks 🎆",
      site: "FIFA",
      link: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures",
    },
    {
      type: "trip",
      title: "Long weekend! Tahoe cabin or Yosemite camping",
      site: "Airbnb",
      link: "https://www.airbnb.com/s/Lake-Tahoe/homes?checkin=2026-07-03",
    },
  ],
  // Sat Jul 11 – Sun Jul 12
  "2026-07-11": [
    {
      type: "chill",
      title: "⚽ World Cup quarterfinals weekend — pick a bar, claim a table",
      site: "FIFA",
      link: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures",
    },
  ],
  // Sat Jul 18 – Sun Jul 19
  "2026-07-18": [
    {
      type: "chill",
      title: "🏆 WORLD CUP FINAL — Sun Jul 19. This one plans itself.",
      site: "FOX / Telemundo",
      link: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures",
    },
  ],
};

export function getNearbyIdeas(weekend, city = "San Francisco Bay Area") {
  const q = encodeURIComponent(city);
  const curated = CURATED[weekend.key] || [];

  const generic = [
    {
      type: "concert",
      title: `Concerts near ${city}`,
      site: "Ticketmaster",
      link: `https://www.ticketmaster.com/search?q=concerts&daterange=${weekend.startISO},${weekend.endISOExclusive}`,
    },
    {
      type: "hike",
      title: `Best trails near ${city}`,
      site: "AllTrails",
      link: `https://www.alltrails.com/explore?q=${q}`,
    },
    {
      type: "chill",
      title: "Local events & festivals",
      site: "Eventbrite",
      link: `https://www.eventbrite.com/d/${q}/events--this-weekend/`,
    },
  ];

  if (weekend.long && !curated.some((i) => i.type === "trip")) {
    generic.unshift({
      type: "trip",
      title: `Long weekend! Tahoe or Yosemite trip (${weekend.holiday})`,
      site: "Airbnb",
      link: `https://www.airbnb.com/s/Lake-Tahoe/homes?checkin=${weekend.startISO}`,
    });
  }

  // Curated first, then enough generics to round out the list.
  return [...curated, ...generic].slice(0, Math.max(4, curated.length + 1));
}
