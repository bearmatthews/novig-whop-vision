import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AISearchOverlayProps {
  events: any[];
  onClose: () => void;
  onEventSelect: (event: any, outcomeId?: string) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface EventResult {
  event: any;
  reasoning: string;
  relevantMarket?: string;
}

export function AISearchOverlay({ events, onClose, onEventSelect }: AISearchOverlayProps) {
  const [currentQuery, setCurrentQuery] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<EventResult[]>([]);
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Generate example questions based on upcoming events
    if (events.length > 0) {
      const examples = generateExampleQuestions(events);
      setExampleQuestions(examples);
    }
  }, [events]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Focus input when component mounts or when returning to initial state
    if (!hasSearched && inputRef.current) {
      inputRef.current.focus();
    }
  }, [hasSearched]);

  const generateExampleQuestions = (events: any[]): string[] => {
    const questions: string[] = [];
    
    if (events.length === 0) return questions;
    
    const leagues = [...new Set(events.map(e => e.game.league))];
    const liveGames = events.filter(e => e.status === 'OPEN_INGAME');
    
    // Analyze odds to find interesting markets
    const eventsWithOdds = events.filter(e => 
      e.markets?.some((m: any) => 
        m.outcomes?.some((o: any) => o.available)
      )
    );
    
    // Find high underdog odds (decimal odds > 2.5)
    const hasHighUnderdogs = eventsWithOdds.some(e =>
      e.markets?.some((m: any) =>
        m.outcomes?.some((o: any) => o.available && o.available > 2.5)
      )
    );
    
    // Find close games (odds between 1.8-2.2 for both sides)
    const hasCloseGames = eventsWithOdds.some(e =>
      e.markets?.some((m: any) => {
        const odds = m.outcomes?.filter((o: any) => o.available).map((o: any) => o.available) || [];
        return odds.length >= 2 && odds.every((odd: number) => odd >= 1.8 && odd <= 2.2);
      })
    );
    
    // Find over/under markets
    const hasOverUnder = eventsWithOdds.some(e =>
      e.markets?.some((m: any) => 
        m.description?.toLowerCase().includes('total') || 
        m.description?.toLowerCase().includes('over/under')
      )
    );
    
    // Generate smart questions based on available data
    if (liveGames.length > 0) {
      questions.push(`Show me all ${liveGames.length} live games`);
    }
    
    if (hasHighUnderdogs) {
      const league = leagues[0];
      questions.push(`Find ${league} underdogs with high payouts`);
    }
    
    if (hasCloseGames) {
      questions.push("Show me the most competitive matchups");
    }
    
    if (hasOverUnder) {
      questions.push("What are the highest over/under totals?");
    }
    
    // Add league-specific questions only if that league has games
    leagues.slice(0, 2).forEach(league => {
      const leagueGames = events.filter(e => e.game.league === league);
      if (leagueGames.length > 0) {
        questions.push(`Show me all ${league} games`);
      }
    });
    
    // Add time-based question if we have upcoming games
    const upcomingGames = events.filter(e => {
      const startTime = new Date(e.game.scheduled_start);
      const now = new Date();
      const hoursUntil = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntil > 0 && hoursUntil <= 3;
    });
    
    if (upcomingGames.length > 0) {
      questions.push("What games start in the next 3 hours?");
    }
    
    return questions.slice(0, 6);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || isLoading) return;

    setCurrentQuery(query);
    setInput("");
    setHasSearched(true);
    setIsLoading(true);

    const newMessages: Message[] = [...messages, { role: "user", content: query }];
    setMessages(newMessages);

    try {
      // Send enhanced event data with liquidity info
      const essentialEvents = events.map(e => ({
        id: e.id,
        description: e.description,
        league: e.game.league,
        status: e.status,
        scheduled_start: e.game.scheduled_start,
        markets: e.markets?.slice(0, 5).map((m: any) => ({
          description: m.description,
          outcomes: m.outcomes.slice(0, 4).map((o: any) => ({
            description: o.description,
            last: o.last,
            available: o.available,
            totalLiquidity: o.orders?.reduce((sum: number, order: any) => sum + order.qty, 0) || 0,
            orderCount: o.orders?.length || 0
          }))
        }))
      }));

      const { data, error } = await supabase.functions.invoke("ai-betting-search", {
        body: {
          message: query,
          events: essentialEvents,
          conversationHistory: messages.slice(-4) // Reduced from 6 to 4
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || "I found some matches for you!"
      };

      setMessages([...newMessages, assistantMessage]);

      // Process results with reasoning
      if (data.results && data.results.length > 0) {
        const eventResults: EventResult[] = data.results.map((result: any) => {
          const event = events.find(e => e.id === result.eventId);
          return event ? {
            event,
            reasoning: result.reasoning || "",
            relevantMarket: result.relevantMarket
          } : null;
        }).filter(Boolean);
        
        setRecommendedEvents(eventResults);
      } else if (data.eventIds && data.eventIds.length > 0) {
        // Backwards compatibility
        const filtered = events.filter(e => data.eventIds.includes(e.id));
        setRecommendedEvents(filtered.map(e => ({ event: e, reasoning: "" })));
      } else {
        setRecommendedEvents([]);
        toast.info("No matching events found. Try adjusting your search.");
      }

    } catch (error) {
      console.error("AI search error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process your request";
      
      toast.error("AI Search Error", {
        description: errorMessage
      });

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch(input);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-background/95 backdrop-blur-2xl"
        onClick={onClose}
      />

      {/* Main Content */}
      <div className="relative w-full max-w-5xl max-h-[95vh] sm:max-h-[92vh] flex flex-col animate-scale-in">
        {!hasSearched ? (
          <Card className="glass-effect border-0 shadow-2xl">
            <CardContent className="p-4 sm:p-8 md:p-12">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-foreground/5 to-foreground/10">
                    <Bot className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-0 sm:mb-1">AI Betting Assistant</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Ask me anything about betting opportunities</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full flex-shrink-0">
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              {/* Search Input */}
              <div className="mb-6 sm:mb-10">
                <div className="flex gap-2 sm:gap-3">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="What are you looking for?"
                    disabled={isLoading}
                    className="flex-1 h-12 sm:h-14 md:h-16 text-sm sm:text-base md:text-lg border-2 rounded-xl sm:rounded-2xl px-4 sm:px-6 focus-visible:ring-2 focus-visible:ring-foreground/20 transition-all"
                  />
                  <Button
                    onClick={() => handleSearch(input)}
                    disabled={isLoading || !input.trim()}
                    size="lg"
                    className="px-4 sm:px-6 md:px-8 h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Example Questions */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">Try these examples</span>
                </div>
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                  {exampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-between h-auto py-3 sm:py-4 px-3 sm:px-5 text-left border-2 hover:border-foreground hover:bg-foreground/5 rounded-lg sm:rounded-xl transition-all group"
                      onClick={() => handleSearch(question)}
                    >
                      <span className="text-xs sm:text-sm font-medium line-clamp-2">{question}</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all flex-shrink-0" />
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-effect border-0 shadow-2xl flex flex-col h-[95vh] sm:h-[88vh]">
            {/* Header with Query */}
            <div className="p-4 sm:p-6 md:p-8 border-b border-border/50">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm font-medium">Your question</span>
                  </div>
                  <h3 className="text-base sm:text-xl md:text-2xl font-semibold text-balance line-clamp-3">{currentQuery}</h3>
                  {messages[messages.length - 1]?.role === "assistant" && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {messages[messages.length - 1].content}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full flex-shrink-0">
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>

            {/* Recommended Events */}
            <ScrollArea className="flex-1 p-4 sm:p-6 md:p-8" ref={scrollRef}>
              {isLoading && messages.length <= 2 ? (
                <div className="flex items-center justify-center h-64 sm:h-96">
                  <div className="text-center space-y-3 sm:space-y-4">
                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin mx-auto" />
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Finding the best matches...</p>
                  </div>
                </div>
              ) : recommendedEvents.length > 0 ? (
                <div className="space-y-4 sm:space-y-5">
                  <h4 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Recommended Matches</h4>
                  {recommendedEvents.map((result) => (
                    <div key={result.event.id} className="card-hover">
                      <EventCard
                        event={result.event}
                        onClick={() => {
                          onEventSelect(result.event);
                          onClose();
                        }}
                        onOutcomeClick={(outcomeId) => {
                          onEventSelect(result.event, outcomeId);
                          onClose();
                        }}
                        showMarkets={true}
                        aiReasoning={result.reasoning}
                        relevantMarket={result.relevantMarket}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 sm:h-96">
                  <div className="text-center space-y-2 px-4">
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground">No matches found for your query</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Try asking something different below</p>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Chat Input at Bottom */}
            <div className="p-3 sm:p-4 md:p-6 border-t border-border/50 bg-background/50">
              <div className="flex gap-2 sm:gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a follow-up..."
                  disabled={isLoading}
                  className="flex-1 h-10 sm:h-12 rounded-lg sm:rounded-xl border-2 text-sm"
                />
                <Button
                  onClick={() => handleSearch(input)}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
