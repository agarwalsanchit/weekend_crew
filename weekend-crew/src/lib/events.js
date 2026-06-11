// Lightweight "what's happening" feed: deep links into discovery/booking sites
// for the group's city + that weekend. v2 can swap in the Ticketmaster API.

export function getNearbyIdeas(weekend, city = "San Francisco Bay Area") {
  const q = encodeURIComponent(city);
  const ideas = [
    {
      type: "concert",
      title: `Concerts near ${city}`,
      site: "Ticketmaster",
      link: `https://www.ticketmaster.com/search?q=concerts&daterange=${weekend.startISO},${weekend.endISOExclusive}`,
    },
    {
      type: "movie",
      title: "Movie showtimes this weekend",
      site: "AMC",
      link: "https://www.amctheatres.com/showtimes",
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
  if (weekend.long) {
    ideas.unshift(
      {
        type: "trip",
        title: `Long weekend! Yosemite camping (${weekend.holiday})`,
        site: "Recreation.gov",
        link: "https://www.recreation.gov/search?q=yosemite",
      },
      {
        type: "trip",
        title: "Long weekend! Tahoe cabin",
        site: "Airbnb",
        link: `https://www.airbnb.com/s/Lake-Tahoe/homes?checkin=${weekend.startISO}`,
      }
    );
  }
  return ideas;
}
