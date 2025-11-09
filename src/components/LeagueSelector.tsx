import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
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
  const selectedLeagueData = LEAGUES.find(l => l.id === selectedLeague) || LEAGUES[0];
  
  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="secondary" 
            size="sm" 
            className="gap-1.5 text-xs px-2.5 shrink-0"
          >
            <span className="text-sm">{selectedLeagueData.icon}</span>
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
              className={`gap-2 text-sm cursor-pointer ${
                selectedLeague === league.id 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : ''
              }`}
            >
              <span className="text-base">{league.icon}</span>
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
          className="gap-2"
        >
          <span className="text-lg">{league.icon}</span>
          {league.name}
        </Button>
      ))}
    </div>
  );
}
