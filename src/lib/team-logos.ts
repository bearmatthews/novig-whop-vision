// Team brand colors (primary color)
const TEAM_COLORS: Record<string, Record<string, string>> = {
  MLB: {
    'Arizona Diamondbacks': '#A71930',
    'Atlanta Braves': '#CE1141',
    'Baltimore Orioles': '#DF4601',
    'Boston Red Sox': '#BD3039',
    'Chicago White Sox': '#27251F',
    'Chicago Cubs': '#0E3386',
    'Cincinnati Reds': '#C6011F',
    'Cleveland Guardians': '#E31937',
    'Colorado Rockies': '#33006F',
    'Detroit Tigers': '#0C2C56',
    'Houston Astros': '#EB6E1F',
    'Kansas City Royals': '#004687',
    'Los Angeles Angels': '#BA0021',
    'Los Angeles Dodgers': '#005A9C',
    'Miami Marlins': '#00A3E0',
    'Milwaukee Brewers': '#12284B',
    'Minnesota Twins': '#002B5C',
    'New York Yankees': '#0C2340',
    'New York Mets': '#002D72',
    'Oakland Athletics': '#003831',
    'Philadelphia Phillies': '#E81828',
    'Pittsburgh Pirates': '#27251F',
    'San Diego Padres': '#2F241D',
    'San Francisco Giants': '#FD5A1E',
    'Seattle Mariners': '#0C2C56',
    'St. Louis Cardinals': '#C41E3A',
    'Tampa Bay Rays': '#092C5C',
    'Texas Rangers': '#003278',
    'Toronto Blue Jays': '#134A8E',
    'Washington Nationals': '#AB0003',
  },
  NBA: {
    'Atlanta Hawks': '#E03A3E',
    'Boston Celtics': '#007A33',
    'Brooklyn Nets': '#000000',
    'Charlotte Hornets': '#1D1160',
    'Chicago Bulls': '#CE1141',
    'Cleveland Cavaliers': '#860038',
    'Dallas Mavericks': '#00538C',
    'Denver Nuggets': '#0E2240',
    'Detroit Pistons': '#C8102E',
    'Golden State Warriors': '#1D428A',
    'Houston Rockets': '#CE1141',
    'Indiana Pacers': '#002D62',
    'Los Angeles Clippers': '#C8102E',
    'Los Angeles Lakers': '#552583',
    'Memphis Grizzlies': '#5D76A9',
    'Miami Heat': '#98002E',
    'Milwaukee Bucks': '#00471B',
    'Minnesota Timberwolves': '#0C2340',
    'New Orleans Pelicans': '#0C2340',
    'New York Knicks': '#006BB6',
    'Oklahoma City Thunder': '#007AC1',
    'Orlando Magic': '#0077C0',
    'Philadelphia 76ers': '#006BB6',
    'Phoenix Suns': '#1D1160',
    'Portland Trail Blazers': '#E03A3E',
    'Sacramento Kings': '#5A2D81',
    'San Antonio Spurs': '#C4CED4',
    'Toronto Raptors': '#CE1141',
    'Utah Jazz': '#002B5C',
    'Washington Wizards': '#002B5C',
  },
  NFL: {
    'Arizona Cardinals': '#97233F',
    'Atlanta Falcons': '#A71930',
    'Baltimore Ravens': '#241773',
    'Buffalo Bills': '#00338D',
    'Carolina Panthers': '#0085CA',
    'Chicago Bears': '#0B162A',
    'Cincinnati Bengals': '#FB4F14',
    'Cleveland Browns': '#311D00',
    'Dallas Cowboys': '#041E42',
    'Denver Broncos': '#FB4F14',
    'Detroit Lions': '#0076B6',
    'Green Bay Packers': '#203731',
    'Houston Texans': '#03202F',
    'Indianapolis Colts': '#002C5F',
    'Jacksonville Jaguars': '#006778',
    'Kansas City Chiefs': '#E31837',
    'Las Vegas Raiders': '#000000',
    'Los Angeles Chargers': '#0080C6',
    'Los Angeles Rams': '#003594',
    'Miami Dolphins': '#008E97',
    'Minnesota Vikings': '#4F2683',
    'New England Patriots': '#002244',
    'New Orleans Saints': '#D3BC8D',
    'New York Giants': '#0B2265',
    'New York Jets': '#125740',
    'Philadelphia Eagles': '#004C54',
    'Pittsburgh Steelers': '#FFB612',
    'San Francisco 49ers': '#AA0000',
    'Seattle Seahawks': '#002244',
    'Tampa Bay Buccaneers': '#D50A0A',
    'Tennessee Titans': '#0C2340',
    'Washington Commanders': '#5A1414',
  },
  NHL: {
    'Anaheim Ducks': '#F47A38',
    'Arizona Coyotes': '#8C2633',
    'Boston Bruins': '#FFB81C',
    'Buffalo Sabres': '#002654',
    'Calgary Flames': '#C8102E',
    'Carolina Hurricanes': '#CC0000',
    'Chicago Blackhawks': '#CF0A2C',
    'Colorado Avalanche': '#6F263D',
    'Columbus Blue Jackets': '#002654',
    'Dallas Stars': '#006847',
    'Detroit Red Wings': '#CE1126',
    'Edmonton Oilers': '#041E42',
    'Florida Panthers': '#041E42',
    'Los Angeles Kings': '#111111',
    'Minnesota Wild': '#A6192E',
    'Montreal Canadiens': '#AF1E2D',
    'Nashville Predators': '#FFB81C',
    'New Jersey Devils': '#CE1126',
    'New York Islanders': '#00539B',
    'New York Rangers': '#0038A8',
    'Ottawa Senators': '#C52032',
    'Philadelphia Flyers': '#F74902',
    'Pittsburgh Penguins': '#000000',
    'San Jose Sharks': '#006D75',
    'Seattle Kraken': '#001628',
    'St. Louis Blues': '#002F87',
    'Tampa Bay Lightning': '#002868',
    'Toronto Maple Leafs': '#00205B',
    'Vancouver Canucks': '#00205B',
    'Vegas Golden Knights': '#B4975A',
    'Washington Capitals': '#C8102E',
    'Winnipeg Jets': '#041E42',
  },
};

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

/**
 * Get team colors for an event
 * Returns both away and home team colors
 */
export function getEventColors(event: any): { away: string | null; home: string | null } {
  const teams = parseTeamNames(event.description);
  if (!teams) return { away: null, home: null };
  
  const league = event.game?.league;
  if (!league) return { away: null, home: null };
  
  const colors = TEAM_COLORS[league];
  if (!colors) return { away: null, home: null };
  
  return {
    away: colors[teams.away] || null,
    home: colors[teams.home] || null,
  };
}
