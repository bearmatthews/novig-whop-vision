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
  MLS: {
    'Atlanta United FC': '#80000B',
    'Austin FC': '#00B140',
    'Charlotte FC': '#00245D',
    'Chicago Fire FC': '#C8102E',
    'FC Cincinnati': '#FE5000',
    'Colorado Rapids': '#8A1538',
    'Columbus Crew': '#FFF200',
    'CF Montreal': '#00245D',
    'D.C. United': '#000000',
    'FC Dallas': '#BF0D3E',
    'Houston Dynamo FC': '#F68712',
    'Sporting Kansas City': '#93B1D7',
    'LA Galaxy': '#00245D',
    'LAFC': '#C39E6D',
    'Inter Miami CF': '#F7B5CD',
    'Minnesota United FC': '#8CD2F4',
    'Nashville SC': '#EDE939',
    'New England Revolution': '#C8102E',
    'New York City FC': '#6CACE4',
    'New York Red Bulls': '#ED1E36',
    'Orlando City SC': '#633492',
    'Philadelphia Union': '#B1872D',
    'Portland Timbers': '#004812',
    'Real Salt Lake': '#B30838',
    'San Jose Earthquakes': '#0051BA',
    'Seattle Sounders FC': '#5D9741',
    'St. Louis City SC': '#FFC20E',
    'Toronto FC': '#B81137',
    'Vancouver Whitecaps FC': '#9DC2EA',
  },
  WNBA: {
    'Atlanta Dream': '#C8102E',
    'Chicago Sky': '#5091CD',
    'Connecticut Sun': '#FF6600',
    'Dallas Wings': '#0046AD',
    'Indiana Fever': '#E03A3E',
    'Las Vegas Aces': '#000000',
    'Los Angeles Sparks': '#552583',
    'Minnesota Lynx': '#005083',
    'New York Liberty': '#6ECEB2',
    'Phoenix Mercury': '#CB6015',
    'Seattle Storm': '#2C5234',
    'Washington Mystics': '#C8102E',
  },
  NCAAB: {
    'Duke': '#003087',
    'North Carolina': '#13294B',
    'Kansas': '#0051BA',
    'Kentucky': '#0033A0',
    'Villanova': '#002F6C',
    'Michigan State': '#18453B',
    'Gonzaga': '#002554',
    'Arizona': '#CC0033',
    'UCLA': '#2774AE',
    'Louisville': '#AD0000',
    'Syracuse': '#D44500',
    'UConn': '#000E2F',
    'Indiana': '#990000',
    'Maryland': '#E03A3E',
    'Wisconsin': '#C5050C',
    'Florida': '#0021A5',
    'Texas': '#BF5700',
    'Ohio State': '#BB0000',
    'Michigan': '#00274C',
    'Purdue': '#CFB991',
    'Illinois': '#13294B',
    'Iowa': '#FFCD00',
    'Virginia': '#232D4B',
    'Baylor': '#003015',
    'Houston': '#C8102E',
    'Memphis': '#003087',
    'Creighton': '#005DAA',
    'Xavier': '#041E42',
    'Georgetown': '#041E42',
    'Butler': '#13294B',
    'Providence': '#000000',
    'St. John\'s': '#CE1126',
    'Marquette': '#003087',
    'Auburn': '#03244D',
    'Tennessee': '#FF8200',
    'Arkansas': '#9D2235',
    'Alabama': '#9E1B32',
    'LSU': '#461D7C',
    'Florida State': '#782F40',
    'Miami': '#F47321',
    'Pittsburgh': '#003594',
    'Virginia Tech': '#630031',
    'North Carolina State': '#CC0000',
    'Wake Forest': '#9E7E38',
    'Clemson': '#F66733',
    'Georgia Tech': '#B3A369',
    'USC': '#990000',
    'Oregon': '#154733',
    'Washington': '#4B2E83',
    'Arizona State': '#8C1D40',
    'Colorado': '#CFB87C',
    'Utah': '#CC0000',
    'Stanford': '#8C1515',
    'California': '#003262',
    'Oklahoma': '#841617',
    'Texas Tech': '#CC0000',
    'West Virginia': '#002855',
    'Kansas State': '#512888',
    'Iowa State': '#C8102E',
    'TCU': '#4D1979',
    'Oklahoma State': '#FF6600',
    'Texas A&M': '#500000',
    'Ole Miss': '#14213D',
    'Mississippi State': '#660000',
    'Missouri': '#F1B82D',
    'Vanderbilt': '#866D4B',
    'South Carolina': '#73000A',
    'BYU': '#002E5D',
    'SMU': '#0033A0',
    'UCF': '#BA9B37',
    'Cincinnati': '#E00122',
    'Northwestern': '#4E2A84',
    'Penn State': '#041E42',
    'Nebraska': '#E41C38',
    'Minnesota': '#7A0019',
    'Rutgers': '#CC0033',
    'Boston College': '#98002E',
    'Notre Dame': '#0C2340',
    'Georgia': '#BA0C2F',
    'Saint Louis': '#0033A0',
    'Dayton': '#CE1141',
    'VCU': '#000000',
    'Richmond': '#00205B',
    'Davidson': '#C60C30',
    'George Washington': '#033869',
    'Saint Joseph\'s': '#660000',
    'Rhode Island': '#003DA5',
    'UMass': '#881C1C',
    'Temple': '#9B003C',
    'Seton Hall': '#0066B3',
    'DePaul': '#004477',
    'Colorado State': '#1E4D2B',
    'San Diego State': '#BA0C2F',
    'UNLV': '#CF0A2C',
    'New Mexico': '#BA0C2F',
    'Boise State': '#0033A0',
    'Nevada': '#003366',
    'Fresno State': '#CC0000',
    'Wyoming': '#492F24',
    'Utah State': '#0F2439',
    'Air Force': '#003087',
    'Saint Mary\'s': '#003da5',
    'Santa Clara': '#B30838',
    'Pacific': '#FF6A39',
    'Pepperdine': '#003da5',
    'Loyola Marymount': '#8A2432',
    'San Francisco': '#FDBB30',
    'Portland': '#502d8a',
    'San Jose State': '#0055A2',
    'Wichita State': '#000000',
    'Tulsa': '#002D72',
    'East Carolina': '#592a8a',
    'Tulane': '#006747',
    'South Florida': '#006747',
    'UAB': '#1E6B52',
    'UTSA': '#0C2340',
    'Rice': '#00205B',
    'North Texas': '#00853E',
    'Charlotte': '#046A38',
    'FAU': '#003366',
    'FIU': '#081E3F',
    'Middle Tennessee': '#0066CC',
    'Western Kentucky': '#C8102E',
    'Old Dominion': '#003057',
    'Marshall': '#00B140',
    'James Madison': '#450084',
    'Coastal Carolina': '#006F71',
    'Appalachian State': '#000000',
    'Georgia State': '#0039A6',
    'Georgia Southern': '#041E42',
    'Arkansas State': '#CC0000',
    'Louisiana': '#CE181E',
    'Louisiana Tech': '#002F8B',
    'Troy': '#862633',
    'South Alabama': '#00205B',
    'Texas State': '#501214',
    'UL Monroe': '#840029',
    'Saint Thomas': '#512698',
    'Milwaukee': '#000000',
    'Little Rock': '#840029',
    'Cal State Fullerton': '#003366',
    'Cal State Bakersfield': '#005DAA',
    'Cal State Northridge': '#D22630',
    'Long Beach State': '#000000',
    'UC Irvine': '#0064A4',
    'UC Davis': '#002855',
    'UC Riverside': '#003da5',
    'UC Santa Barbara': '#003660',
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
  MLS: {
    'Atlanta United FC': 'atl',
    'Austin FC': 'atx',
    'Charlotte FC': 'clt',
    'Chicago Fire FC': 'chi',
    'FC Cincinnati': 'cin',
    'Colorado Rapids': 'col',
    'Columbus Crew': 'clb',
    'CF Montreal': 'mtl',
    'D.C. United': 'dc',
    'FC Dallas': 'dal',
    'Houston Dynamo FC': 'hou',
    'Sporting Kansas City': 'skc',
    'LA Galaxy': 'la',
    'LAFC': 'lafc',
    'Inter Miami CF': 'mia',
    'Minnesota United FC': 'min',
    'Nashville SC': 'nsh',
    'New England Revolution': 'ne',
    'New York City FC': 'nyc',
    'New York Red Bulls': 'ny',
    'Orlando City SC': 'orl',
    'Philadelphia Union': 'phi',
    'Portland Timbers': 'por',
    'Real Salt Lake': 'rsl',
    'San Jose Earthquakes': 'sj',
    'Seattle Sounders FC': 'sea',
    'St. Louis City SC': 'stl',
    'Toronto FC': 'tor',
    'Vancouver Whitecaps FC': 'van',
  },
  WNBA: {
    'Atlanta Dream': 'atl',
    'Chicago Sky': 'chi',
    'Connecticut Sun': 'con',
    'Dallas Wings': 'dal',
    'Indiana Fever': 'ind',
    'Las Vegas Aces': 'lv',
    'Los Angeles Sparks': 'la',
    'Minnesota Lynx': 'min',
    'New York Liberty': 'ny',
    'Phoenix Mercury': 'phx',
    'Seattle Storm': 'sea',
    'Washington Mystics': 'wsh',
  },
  NCAAB: {
    // Major conference teams
    'Duke': 'duke',
    'North Carolina': 'unc',
    'Kentucky': 'ken',
    'Kansas': 'kan',
    'UCLA': 'ucla',
    'Gonzaga': 'gonz',
    'Villanova': 'vill',
    'Michigan': 'mich',
    'Arizona': 'ariz',
    'UConn': 'conn',
    'Syracuse': 'syr',
    'Louisville': 'lou',
    'Indiana': 'ind',
    'Michigan State': 'msu',
    'Ohio State': 'ohst',
    'Florida': 'fla',
    'Texas': 'tex',
    'Purdue': 'pur',
    'Wisconsin': 'wis',
    'Illinois': 'ill',
    'Virginia': 'uva',
    'Pittsburgh': 'pitt',
    'UNC Wilmington': 'uncw',
    'Eastern Michigan': 'emu',
    'Georgetown': 'gtwn',
    'Marquette': 'marq',
    'Creighton': 'crei',
    'Xavier': 'xav',
    'Butler': 'butl',
    'Memphis': 'mem',
    'Temple': 'tem',
    'Saint Louis': 'stl',
    'VCU': 'vcu',
    'Dayton': 'day',
    'Cincinnati': 'cin',
    'Wichita State': 'wicst',
    'San Diego State': 'sdsu',
    'Nevada': 'nev',
    'Boise State': 'bsu',
    'Colorado State': 'csu',
    'New Mexico': 'unm',
    'BYU': 'byu',
    'Houston': 'hou',
    'SMU': 'smu',
    'TCU': 'tcu',
    'Baylor': 'bay',
    'Oklahoma': 'okla',
    'Iowa State': 'iast',
    'West Virginia': 'wvu',
    'Maryland': 'md',
    'Rutgers': 'rutg',
    'Penn State': 'psu',
    'Minnesota': 'minn',
    'Iowa': 'iowa',
    'Nebraska': 'neb',
    'Northwestern': 'nw',
    'USC': 'usc',
    'Stanford': 'stan',
    'California': 'cal',
    'Oregon': 'ore',
    'Washington': 'wash',
    'Oregon State': 'orst',
    'Washington State': 'wsu',
    'Colorado': 'colo',
    'Utah': 'utah',
    'Arizona State': 'asu',
  },
  NCAAF: {
    // Major conference teams
    'Alabama': 'bama',
    'Georgia': 'uga',
    'Ohio State': 'ohst',
    'Michigan': 'mich',
    'Clemson': 'clem',
    'Notre Dame': 'nd',
    'Oklahoma': 'okla',
    'Texas': 'tex',
    'LSU': 'lsu',
    'Florida': 'fla',
    'Penn State': 'psu',
    'Oregon': 'ore',
    'USC': 'usc',
    'Texas A&M': 'tam',
    'Auburn': 'aub',
    'Miami': 'miami',
    'Miami Florida': 'miami',
    'Florida State': 'fsu',
    'Wisconsin': 'wis',
    'Iowa': 'iowa',
    'Michigan State': 'msu',
    'Nebraska': 'neb',
    'Tennessee': 'tenn',
    'Ole Miss': 'miss',
    'Arkansas': 'ark',
    'Mississippi State': 'msst',
    'Kentucky': 'ken',
    'South Carolina': 'scar',
    'Missouri': 'mizz',
    'Vanderbilt': 'van',
    'UCLA': 'ucla',
    'Washington': 'wash',
    'Stanford': 'stan',
    'Utah': 'utah',
    'Colorado': 'colo',
    'Arizona': 'ariz',
    'Arizona State': 'asu',
    'Oregon State': 'orst',
    'California': 'cal',
    'Washington State': 'wsu',
    'Oklahoma State': 'okst',
    'TCU': 'tcu',
    'Baylor': 'bay',
    'Kansas': 'kan',
    'Kansas State': 'ksu',
    'Iowa State': 'iast',
    'West Virginia': 'wvu',
    'Texas Tech': 'ttech',
    'North Carolina': 'unc',
    'North Carolina State': 'ncst',
    'NC State': 'ncst',
    'Duke': 'duke',
    'Virginia': 'uva',
    'Virginia Tech': 'vt',
    'Pittsburgh': 'pitt',
    'Louisville': 'lou',
    'Syracuse': 'syr',
    'Boston College': 'bc',
    'Wake Forest': 'wake',
    'Georgia Tech': 'gt',
    'Northwestern': 'nw',
    'Purdue': 'pur',
    'Illinois': 'ill',
    'Minnesota': 'minn',
    'Indiana': 'ind',
    'Maryland': 'md',
    'Rutgers': 'rutg',
    'Eastern Michigan': 'emu',
    'North Texas': 'unt',
    'SMU': 'smu',
    'Houston': 'hou',
    'BYU': 'byu',
    'Cincinnati': 'cin',
    'UCF': 'ucf',
    'Memphis': 'mem',
    'Tulane': 'tuln',
    'Navy': 'navy',
    'Army': 'army',
    'Air Force': 'af',
    'San Diego State': 'sdsu',
    'Fresno State': 'fresno',
    'Boise State': 'bsu',
    'UNLV': 'unlv',
    'Nevada': 'nev',
    'Colorado State': 'csu',
    'Wyoming': 'wyo',
    'New Mexico': 'unm',
    'Utah State': 'usu',
    'Hawaii': 'haw',
    'San Jose State': 'sjsu',
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
 * Supports all major leagues and provides fallback for teams not in our mapping
 */
export function getTeamLogo(teamName: string, league: string): string | null {
  // Special handling for UFC - return UFC logo
  if (league === 'UFC') {
    return 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/ufc.png';
  }

  const abbreviations = TEAM_ABBREVIATIONS[league];
  if (!abbreviations) return null;
  
  let abbr = abbreviations[teamName];
  
  // If we don't have the abbreviation, try intelligent fallbacks for college teams
  if (!abbr && (league === 'NCAAB' || league === 'NCAAF')) {
    // Try common patterns first
    const cleanName = teamName.trim();
    
    // Handle common variations
    const variations = [
      cleanName,
      cleanName.replace(' State', ''),
      cleanName.replace('State', ''),
      cleanName.split(' ')[0], // First word only
    ];
    
    // Try to find a match in variations
    for (const variation of variations) {
      if (abbreviations[variation]) {
        abbr = abbreviations[variation];
        break;
      }
    }
    
    // If still no match, generate abbreviation from team name
    if (!abbr) {
      // Remove common words and create abbreviation
      abbr = cleanName.toLowerCase()
        .replace(/university|college|state university|polytechnic|institute|tech$/gi, '')
        .trim()
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 5);
      
      // If it's too short, try using the first word
      if (abbr.length < 2) {
        abbr = cleanName.toLowerCase()
          .split(' ')[0]
          .replace(/[^a-z]/g, '')
          .substring(0, 6);
      }
    }
  }
  
  if (!abbr) return null;
  
  // College sports use different CDN path
  if (league === 'NCAAB' || league === 'NCAAF') {
    const sport = league === 'NCAAB' ? 'mens-college-basketball' : 'college-football';
    return `https://a.espncdn.com/i/teamlogos/${sport}/500/${abbr}.png`;
  }
  
  const leagueLower = league.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/${leagueLower}/500/${abbr}.png`;
}

/**
 * Get team logos for an event with robust ESPN fallback
 * Priority: 1) API-provided logos, 2) ESPN CDN, 3) League logo for UFC, 4) null
 */
export function getEventLogos(event: any): { away: string | null; home: string | null } {
  const league = event.game?.league;
  
  // Special handling for UFC - show UFC logo for both sides or fighter images if available
  if (league === 'UFC') {
    const ufcLogo = 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/ufc.png';
    return {
      away: event.game?.away_logo || ufcLogo,
      home: event.game?.home_logo || ufcLogo,
    };
  }

  // Try API-provided logos first
  if (event.game?.home_logo && event.game?.away_logo) {
    return {
      home: event.game.home_logo,
      away: event.game.away_logo,
    };
  }
  
  // Fallback to parsing description and using ESPN CDN
  const teams = parseTeamNames(event.description);
  if (!teams || !league) return { away: null, home: null };
  
  // For college sports, fetch from Supabase storage cache
  if (league === 'NCAAB' || league === 'NCAAF') {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return {
      away: `${supabaseUrl}/storage/v1/object/public/team-logos/${league}/${teams.away.toLowerCase().replace(/\s+/g, '-')}.png`,
      home: `${supabaseUrl}/storage/v1/object/public/team-logos/${league}/${teams.home.toLowerCase().replace(/\s+/g, '-')}.png`,
    };
  }
  
  const awayLogo = getTeamLogo(teams.away, league);
  const homeLogo = getTeamLogo(teams.home, league);
  
  return {
    away: awayLogo,
    home: homeLogo,
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

/**
 * Get team abbreviation from team name
 */
export function getTeamAbbreviation(teamName: string, league: string): string | null {
  const abbreviations = TEAM_ABBREVIATIONS[league];
  if (!abbreviations) return null;
  
  return abbreviations[teamName] || null;
}
