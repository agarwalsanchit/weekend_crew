// "What's happening" feed v3: ONE obvious pick per category, per weekend.
// - Hike: chosen from real Bay Area trails based on the actual weather forecast
//   (Open-Meteo, free, no key). Rainy? You get a museum instead.
// - Movie: THE release worth seeing that weekend (curated Jun–Jul 2026).
// - Food: a specific new restaurant/bar opening to try.
// - Event: the can't-miss thing (World Cup matches, premieres).
// weekend.key = ISO date of the Saturday.

const MAPS = (q) => `https://www.google.com/maps/search/${encodeURIComponent(q)}`;
const FIFA_FIXTURES = "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures";

// --- Specific new restaurants & bars to rotate through (SF, spring 2026) ---
const FOOD_PICKS = [
  { type: "chill", title: "🍷 Fat Cat — new Bernal Heights wine bar, get the fried tofu + oysters", site: "New opening", link: MAPS("Fat Cat wine bar Bernal Heights San Francisco") },
  { type: "chill", title: "🍸 Golden Rule — mini martinis from the Che Fico team (Thrive City)", site: "New opening", link: MAPS("Golden Rule bar Thrive City San Francisco") },
  { type: "chill", title: "🍕 Rose Pizzeria's new Inner Richmond spot — natural wine + pizza", site: "New opening", link: MAPS("Rose Pizzeria Inner Richmond San Francisco") },
];

// --- The one movie worth the theater trip, per weekend ---
const MOVIE_PICKS = {
  "2026-06-13": { type: "movie", title: "🎬 Disclosure Day — Spielberg's new sci-fi, just opened", site: "Fandango", link: "https://www.fandango.com/search?q=Disclosure%20Day" },
  "2026-06-20": { type: "movie", title: "🎬 Toy Story 5 — opening weekend 🤠", site: "Fandango", link: "https://www.fandango.com/search?q=Toy%20Story%205" },
  "2026-06-27": { type: "movie", title: "🎬 Supergirl — opening weekend", site: "Fandango", link: "https://www.fandango.com/search?q=Supergirl" },
  "2026-07-04": { type: "movie", title: "🎬 Minions & Monsters — fresh out Jul 1", site: "Fandango", link: "https://www.fandango.com/search?q=Minions%20%26%20Monsters" },
  "2026-07-11": { type: "movie", title: "🎬 Moana (live action) — opening weekend 🌊", site: "Fandango", link: "https://www.fandango.com/search?q=Moana" },
  "2026-07-18": { type: "movie", title: "🎬 The Odyssey — Nolan's epic, opening weekend", site: "Fandango", link: "https://www.fandango.com/search?q=The%20Odyssey" },
};

// --- The can't-miss events, per weekend ---
const EVENT_PICKS = {
  "2026-06-13": [
    { type: "concert", title: "⚽ World Cup AT Levi's: Qatar vs Switzerland — Sat 12pm, go in person!", site: "Levi's Stadium", link: "https://levisstadium.com/event/fifa-world-cup-group-stage-2026-06-13/" },
    { type: "chill", title: "⚽ Brazil vs Morocco — Sat 3pm PT watch party", site: "FOX / Telemundo", link: FIFA_FIXTURES },
  ],
  "2026-06-20": [
    { type: "concert", title: "⚽ World Cup AT Levi's: Türkiye vs Paraguay — Fri 8pm, go in person!", site: "Levi's Stadium", link: "https://www.worldcupsantaclara.com/matches" },
    { type: "chill", title: "🐉 House of the Dragon S3 premiere — Sun night", site: "HBO Max", link: "https://www.hbomax.com" },
  ],
  "2026-06-27": [
    { type: "chill", title: "⚽ Panama vs England — Sat on TV; The Bear S5 binge after 🍝", site: "FOX / Hulu", link: FIFA_FIXTURES },
  ],
  "2026-07-04": [
    { type: "chill", title: "⚽ World Cup knockouts all weekend + July 4th fireworks 🎆", site: "FIFA", link: FIFA_FIXTURES },
    { type: "trip", title: "🏔️ Long weekend! Tahoe cabin — book before they're gone", site: "Airbnb", link: "https://www.airbnb.com/s/Lake-Tahoe/homes?checkin=2026-07-03" },
  ],
  "2026-07-11": [
    { type: "chill", title: "⚽ World Cup quarterfinals — claim a bar table early", site: "FIFA", link: FIFA_FIXTURES },
  ],
  "2026-07-18": [
    { type: "chill", title: "🏆 WORLD CUP FINAL — Sun Jul 19. This one plans itself.", site: "FOX / Telemundo", link: FIFA_FIXTURES },
  ],
};

// --- Weather-aware hike selection ---
const HIKE_HOT = { type: "hike", title: "🥾 Purisima Creek Redwoods — shaded all the way", site: "AllTrails", link: "https://www.alltrails.com/parks/us/california/purisima-creek-redwoods-open-space-preserve" };
const HIKE_CLEAR = { type: "hike", title: "🥾 Lands End Trail — coastal views, Sutro Baths finish", site: "AllTrails", link: "https://www.alltrails.com/trail/us/california/lands-end-trail" };
const HIKE_COOL = { type: "hike", title: "🥾 Mission Peak — earn the summit pole photo", site: "AllTrails", link: "https://www.alltrails.com/trail/us/california/mission-peak-loop-from-stanford-avenue-staging-area" };
const HIKE_DEFAULT = { type: "hike", title: "🥾 Tennessee Valley Trail — easy, ends at a beach", site: "AllTrails", link: "https://www.alltrails.com/trail/us/california/tennessee-valley-trail" };
const RAINY_BACKUP = { type: "chill", title: "🖼️ SFMOMA day — current exhibitions + museum café", site: "SFMOMA", link: "https://www.sfmoma.org/exhibitions/" };

async function pickHike(weekend) {
  try {
    const endInclusive = new Date(new Date(weekend.endISOExclusive).getTime() - 86400000)
      .toISOString().slice(0, 10);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=37.77&longitude=-122.42&daily=temperature_2m_max,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles&start_date=${weekend.startISO}&end_date=${endInclusive}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("forecast unavailable");
    const j = await res.json();
    const temps = j.daily?.temperature_2m_max || [];
    const rains = j.daily?.precipitation_probability_max || [];
    if (!temps.length) throw new Error("out of range");
    const tMax = Math.round(Math.max(...temps));
    const rainMax = Math.max(...rains.map((r) => r ?? 0));

    if (rainMax >= 50) return { ...RAINY_BACKUP, why: `${rainMax}% chance of rain — trails will be muddy, go indoors` };
    if (tMax >= 85) return { ...HIKE_HOT, why: `Forecast hits ${tMax}° — stay in the redwood shade` };
    if (tMax <= 62) return { ...HIKE_COOL, why: `Crisp ${tMax}° — perfect summit weather` };
    return { ...HIKE_CLEAR, why: `${tMax}° and dry — coastal trail conditions: ideal` };
  } catch {
    return { ...HIKE_DEFAULT, why: "Forecast lands ~10 days out — pick appears closer to the date" };
  }
}

export async function getNearbyIdeas(weekend, city = "San Francisco Bay Area") {
  const ideas = [];

  // 1. The can't-miss events
  ideas.push(...(EVENT_PICKS[weekend.key] || []));

  // 2. THE hike (weather-decided)
  ideas.push(await pickHike(weekend));

  // 3. THE movie
  const movie = MOVIE_PICKS[weekend.key];
  if (movie) ideas.push(movie);

  // 4. THE new restaurant — rotate so it's a different spot each weekend
  const idx = Math.abs(weekend.key.split("-").reduce((a, b) => a + parseInt(b, 10), 0)) % FOOD_PICKS.length;
  ideas.push(FOOD_PICKS[idx]);

  // Fallback filler only if the list is thin (far-future weekends)
  if (ideas.length < 3) {
    ideas.push({
      type: "chill",
      title: `Local events & festivals near ${city}`,
      site: "Eventbrite",
      link: `https://www.eventbrite.com/d/${encodeURIComponent(city)}/events--this-weekend/`,
    });
  }
  return ideas;
}
