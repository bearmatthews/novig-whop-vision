import { Button } from "@/components/ui/button";

interface LeagueSelectorProps {
  selectedLeague: string;
  onLeagueChange: (league: string) => void;
}

const LEAGUES = [
  { id: 'MLB', name: 'MLB', icon: '⚾' },
  { id: 'NBA', name: 'NBA', icon: '🏀' },
  { id: 'NFL', name: 'NFL', icon: '🏈' },
  { id: 'NHL', name: 'NHL', icon: '🏒' },
];

export function LeagueSelector({ selectedLeague, onLeagueChange }: LeagueSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {LEAGUES.map((league) => (
        <Button
          key={league.id}
          variant={selectedLeague === league.id ? "default" : "secondary"}
          onClick={() => onLeagueChange(league.id)}
          className="gap-2"
        >
          <span className="text-lg">{league.icon}</span>
          {league.name}
        </Button>
      ))}
    </div>
  );
}
