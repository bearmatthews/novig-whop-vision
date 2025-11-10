import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trophy, GraduationCap } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import mlbLogo from "@/assets/leagues/mlb-logo.png";
import nbaLogo from "@/assets/leagues/nba-logo.png";
import nflLogo from "@/assets/leagues/nfl-logo.png";
import nhlLogo from "@/assets/leagues/nhl-logo.png";
import mlsLogo from "@/assets/leagues/mls-logo.png";
import wnbaLogo from "@/assets/leagues/wnba-logo.png";
import ufcLogo from "@/assets/leagues/ufc-logo.png";

interface LeagueSelectorProps {
  selectedLeague: string;
  onLeagueChange: (league: string) => void;
}

export const LEAGUES = [
  { id: 'ALL', name: 'All Sports', logo: null, icon: Trophy },
  { id: 'MLB', name: 'MLB', logo: mlbLogo, icon: null },
  { id: 'NBA', name: 'NBA', logo: nbaLogo, icon: null },
  { id: 'NFL', name: 'NFL', logo: nflLogo, icon: null },
  { id: 'NHL', name: 'NHL', logo: nhlLogo, icon: null },
  { id: 'MLS', name: 'MLS', logo: mlsLogo, icon: null },
  { id: 'WNBA', name: 'WNBA', logo: wnbaLogo, icon: null },
  { id: 'NCAAB', name: 'NCAAB', logo: null, icon: GraduationCap },
  { id: 'NCAAF', name: 'NCAAF', logo: null, icon: GraduationCap },
  { id: 'UFC', name: 'UFC', logo: ufcLogo, icon: null },
];

export function LeagueSelector({ selectedLeague, onLeagueChange }: LeagueSelectorProps) {
  const isMobile = useIsMobile();
  const selectedLeagueData = LEAGUES.find(l => l.id === selectedLeague) || LEAGUES[0];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
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
            ) : selectedLeagueData.icon ? (
              <selectedLeagueData.icon className="w-4 h-4" />
            ) : null}
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
              ) : league.icon ? (
                <league.icon className="w-5 h-5" />
              ) : null}
              {league.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  return (
    <div className="relative w-full max-w-2xl">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      
      {/* Scrollable container */}
      <div 
        ref={scrollRef}
        className={`overflow-x-auto scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex gap-1.5 pb-1 min-w-max">
          {LEAGUES.map((league) => (
            <Button
              key={league.id}
              variant={selectedLeague === league.id ? "default" : "secondary"}
              onClick={(e) => {
                // Prevent click if we were dragging
                if (isDragging) {
                  e.preventDefault();
                  return;
                }
                onLeagueChange(league.id);
              }}
              size="sm"
              className="gap-2 shrink-0 px-2.5 text-xs pointer-events-auto"
            >
              {league.logo ? (
                <img src={league.logo} alt={league.name} className="w-4 h-4 object-contain" />
              ) : league.icon ? (
                <league.icon className="w-4 h-4" />
              ) : null}
              {league.name}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
    </div>
  );
}
