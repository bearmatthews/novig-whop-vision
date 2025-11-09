import { Button } from "@/components/ui/button";

interface LeagueSelectorProps {
  selectedLeague: string;
  onLeagueChange: (league: string) => void;
}

export const LEAGUES = [
  { id: 'ALL', name: 'All Sports', icon: '🏆' },
  { id: 'MLB', name: 'MLB', icon: '⚾' },
  { id: 'NBA', name: 'NBA', icon: '🏀' },
  { id: 'NFL', name: 'NFL', icon: '🏈' },
  { id: 'NHL', name: 'NHL', icon: '🏒' },
];

export function LeagueSelector({ selectedLeague, onLeagueChange }: LeagueSelectorProps) {
  return (
    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
      {LEAGUES.map((league) => (
        <Button
          key={league.id}
          variant={selectedLeague === league.id ? "default" : "secondary"}
          onClick={() => onLeagueChange(league.id)}
          size="sm"
          className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
        >
          <span className="text-base sm:text-lg">{league.icon}</span>
          <span className="hidden xs:inline">{league.name}</span>
        </Button>
      ))}
    </div>
  );
}
