import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trophy } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import mlbLogo from "@/assets/leagues/mlb-logo.png";
import nbaLogo from "@/assets/leagues/nba-logo.png";
import nflLogo from "@/assets/leagues/nfl-logo.png";
import nhlLogo from "@/assets/leagues/nhl-logo.png";

interface LeagueSelectorProps {
  selectedLeague: string;
  onLeagueChange: (league: string) => void;
}

export const LEAGUES = [
  { id: 'ALL', name: 'All Sports', logo: null },
  { id: 'MLB', name: 'MLB', logo: mlbLogo },
  { id: 'NBA', name: 'NBA', logo: nbaLogo },
  { id: 'NFL', name: 'NFL', logo: nflLogo },
  { id: 'NHL', name: 'NHL', logo: nhlLogo },
];

export function LeagueSelector({ selectedLeague, onLeagueChange }: LeagueSelectorProps) {
  const isMobile = useIsMobile();
  const selectedLeagueData = LEAGUES.find(l => l.id === selectedLeague) || LEAGUES[0];
  
  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="secondary" 
            size="sm" 
            className="gap-2 text-xs px-2.5 shrink-0"
          >
            {selectedLeagueData.logo ? (
              <img src={selectedLeagueData.logo} alt={selectedLeagueData.name} className="w-4 h-4 object-contain" />
            ) : (
              <Trophy className="w-4 h-4" />
            )}
            {selectedLeagueData.name}
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="bg-background border-border z-50 min-w-[140px]"
        >
          {LEAGUES.map((league) => (
            <DropdownMenuItem
              key={league.id}
              onClick={() => onLeagueChange(league.id)}
              className={`gap-2.5 text-sm cursor-pointer ${
                selectedLeague === league.id 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : ''
              }`}
            >
              {league.logo ? (
                <img src={league.logo} alt={league.name} className="w-5 h-5 object-contain" />
              ) : (
                <Trophy className="w-5 h-5" />
              )}
              {league.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  return (
    <div className="flex gap-2 flex-wrap">
      {LEAGUES.map((league) => (
        <Button
          key={league.id}
          variant={selectedLeague === league.id ? "default" : "secondary"}
          onClick={() => onLeagueChange(league.id)}
          className="gap-2.5"
        >
          {league.logo ? (
            <img src={league.logo} alt={league.name} className="w-5 h-5 object-contain" />
          ) : (
            <Trophy className="w-5 h-5" />
          )}
          {league.name}
        </Button>
      ))}
    </div>
  );
}
