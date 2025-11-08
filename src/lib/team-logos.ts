// Team name to abbreviation mapping for ESPN CDN
const TEAM_ABBREVIATIONS: Record<string, Record<string, string>> = {
  MLB: {
    'Arizona Diamondbacks': 'ari',
    'Atlanta Braves': 'atl',
    'Baltimore Orioles': 'bal',
    'Boston Red Sox': 'bos',
    'Chicago White Sox': 'chw',
    'Chicago Cubs': 'chc',
    'Cincinnati Reds': 'cin',
    'Cleveland Guardians': 'cle',
    'Colorado Rockies': 'col',
    'Detroit Tigers': 'det',
    'Houston Astros': 'hou',
    'Kansas City Royals': 'kc',
    'Los Angeles Angels': 'laa',
    'Los Angeles Dodgers': 'lad',
    'Miami Marlins': 'mia',
    'Milwaukee Brewers': 'mil',
    'Minnesota Twins': 'min',
    'New York Yankees': 'nyy',
    'New York Mets': 'nym',
    'Oakland Athletics': 'oak',
    'Philadelphia Phillies': 'phi',
    'Pittsburgh Pirates': 'pit',
    'San Diego Padres': 'sd',
    'San Francisco Giants': 'sf',
    'Seattle Mariners': 'sea',
    'St. Louis Cardinals': 'stl',
    'Tampa Bay Rays': 'tb',
    'Texas Rangers': 'tex',
    'Toronto Blue Jays': 'tor',
    'Washington Nationals': 'wsh',
  },
  NBA: {
    'Atlanta Hawks': 'atl',
    'Boston Celtics': 'bos',
    'Brooklyn Nets': 'bkn',
    'Charlotte Hornets': 'cha',
    'Chicago Bulls': 'chi',
    'Cleveland Cavaliers': 'cle',
    'Dallas Mavericks': 'dal',
    'Denver Nuggets': 'den',
    'Detroit Pistons': 'det',
    'Golden State Warriors': 'gs',
    'Houston Rockets': 'hou',
    'Indiana Pacers': 'ind',
    'Los Angeles Clippers': 'lac',
    'Los Angeles Lakers': 'lal',
    'Memphis Grizzlies': 'mem',
    'Miami Heat': 'mia',
    'Milwaukee Bucks': 'mil',
    'Minnesota Timberwolves': 'min',
    'New Orleans Pelicans': 'no',
    'New York Knicks': 'ny',
    'Oklahoma City Thunder': 'okc',
    'Orlando Magic': 'orl',
    'Philadelphia 76ers': 'phi',
    'Phoenix Suns': 'phx',
    'Portland Trail Blazers': 'por',
    'Sacramento Kings': 'sac',
    'San Antonio Spurs': 'sa',
    'Toronto Raptors': 'tor',
    'Utah Jazz': 'utah',
    'Washington Wizards': 'wsh',
  },
  NFL: {
    'Arizona Cardinals': 'ari',
    'Atlanta Falcons': 'atl',
    'Baltimore Ravens': 'bal',
    'Buffalo Bills': 'buf',
    'Carolina Panthers': 'car',
    'Chicago Bears': 'chi',
    'Cincinnati Bengals': 'cin',
    'Cleveland Browns': 'cle',
    'Dallas Cowboys': 'dal',
    'Denver Broncos': 'den',
    'Detroit Lions': 'det',
    'Green Bay Packers': 'gb',
    'Houston Texans': 'hou',
    'Indianapolis Colts': 'ind',
    'Jacksonville Jaguars': 'jax',
    'Kansas City Chiefs': 'kc',
    'Las Vegas Raiders': 'lv',
    'Los Angeles Chargers': 'lac',
    'Los Angeles Rams': 'lar',
    'Miami Dolphins': 'mia',
    'Minnesota Vikings': 'min',
    'New England Patriots': 'ne',
    'New Orleans Saints': 'no',
    'New York Giants': 'nyg',
    'New York Jets': 'nyj',
    'Philadelphia Eagles': 'phi',
    'Pittsburgh Steelers': 'pit',
    'San Francisco 49ers': 'sf',
    'Seattle Seahawks': 'sea',
    'Tampa Bay Buccaneers': 'tb',
    'Tennessee Titans': 'ten',
    'Washington Commanders': 'wsh',
  },
  NHL: {
    'Anaheim Ducks': 'ana',
    'Arizona Coyotes': 'ari',
    'Boston Bruins': 'bos',
    'Buffalo Sabres': 'buf',
    'Calgary Flames': 'cgy',
    'Carolina Hurricanes': 'car',
    'Chicago Blackhawks': 'chi',
    'Colorado Avalanche': 'col',
    'Columbus Blue Jackets': 'cbj',
    'Dallas Stars': 'dal',
    'Detroit Red Wings': 'det',
    'Edmonton Oilers': 'edm',
    'Florida Panthers': 'fla',
    'Los Angeles Kings': 'la',
    'Minnesota Wild': 'min',
    'Montreal Canadiens': 'mtl',
    'Nashville Predators': 'nsh',
    'New Jersey Devils': 'nj',
    'New York Islanders': 'nyi',
    'New York Rangers': 'nyr',
    'Ottawa Senators': 'ott',
    'Philadelphia Flyers': 'phi',
    'Pittsburgh Penguins': 'pit',
    'San Jose Sharks': 'sj',
    'Seattle Kraken': 'sea',
    'St. Louis Blues': 'stl',
    'Tampa Bay Lightning': 'tb',
    'Toronto Maple Leafs': 'tor',
    'Vancouver Canucks': 'van',
    'Vegas Golden Knights': 'vgk',
    'Washington Capitals': 'wsh',
    'Winnipeg Jets': 'wpg',
  },
};

/**
 * Parse team names from event description
 * Format: "Team A @ Team B" or "Team A vs Team B"
 */
export function parseTeamNames(description: string): { away: string; home: string } | null {
  // Try @ separator first (away @ home)
  let match = description.match(/^(.+?)\s+@\s+(.+?)$/);
  if (match) {
    return { away: match[1].trim(), home: match[2].trim() };
  }
  
  // Try vs separator
  match = description.match(/^(.+?)\s+vs\.?\s+(.+?)$/i);
  if (match) {
    return { away: match[1].trim(), home: match[2].trim() };
  }
  
  return null;
}

/**
 * Get ESPN CDN logo URL for a team
 */
export function getTeamLogo(teamName: string, league: string): string | null {
  const abbreviations = TEAM_ABBREVIATIONS[league];
  if (!abbreviations) return null;
  
  const abbr = abbreviations[teamName];
  if (!abbr) return null;
  
  const leagueLower = league.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/${leagueLower}/500/${abbr}.png`;
}

/**
 * Get team logos for an event
 * Tries to use API-provided logos first, falls back to ESPN CDN
 */
export function getEventLogos(event: any): { away: string | null; home: string | null } {
  // Try API-provided logos first
  if (event.game?.home_logo && event.game?.away_logo) {
    return {
      home: event.game.home_logo,
      away: event.game.away_logo,
    };
  }
  
  // Fallback to parsing description and using ESPN CDN
  const teams = parseTeamNames(event.description);
  if (!teams) return { away: null, home: null };
  
  const league = event.game?.league;
  if (!league) return { away: null, home: null };
  
  return {
    away: getTeamLogo(teams.away, league),
    home: getTeamLogo(teams.home, league),
  };
}
