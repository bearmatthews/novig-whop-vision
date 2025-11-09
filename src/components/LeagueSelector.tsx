import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
  return (
    <div className="flex gap-1.5 md:gap-2 flex-wrap">
      {LEAGUES.map((league) => (
        <Button
          key={league.id}
          variant={selectedLeague === league.id ? "default" : "secondary"}
          onClick={() => onLeagueChange(league.id)}
          size={isMobile ? "sm" : "default"}
          className={isMobile ? "gap-1.5 text-xs px-2.5" : "gap-2"}
        >
          <span className={isMobile ? "text-sm" : "text-lg"}>{league.icon}</span>
          {league.name}
        </Button>
      ))}
    </div>
  );
}
