import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
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
      const essentialEvents = events.slice(0, 100).map(e => ({
        id: e.id,
        description: e.description,
        league: e.game?.league || 'Unknown',
        status: e.status,
        scheduled_start: e.game?.scheduled_start,
        markets: (e.markets || []).slice(0, 5).map((m: any) => ({
          description: m.description,
          outcomes: (m.outcomes || []).slice(0, 4).map((o: any) => ({
            description: o.description,
            last: o.last,
            available: o.available,
            totalLiquidity: o.orders?.reduce((sum: number, order: any) => sum + order.qty, 0) || 0,
            orderCount: o.orders?.length || 0
          }))
        }))
      }));

      const requestBody = {
        message: query.trim().slice(0, 2000),
        events: essentialEvents,
        conversationHistory: messages.slice(-4).slice(0, 20)
      };

      console.log('AI Search Request:', {
        messageLength: requestBody.message.length,
        eventCount: requestBody.events.length,
        historyCount: requestBody.conversationHistory.length
      });

      const { data, error } = await supabase.functions.invoke("ai-betting-search", {
        body: requestBody
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to connect to AI service");
      }
      if (data?.error) {
        console.error("AI service error:", data.error, data.details);
        const errorMsg = data.details || data.error;
        throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }

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

  if (isMobile) {
    // Mobile: Console below header
    return (
      <div className="fixed top-[57px] left-0 right-0 bottom-0 z-40 bg-background animate-slide-in-right flex flex-col">
        {!hasSearched ? (
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-foreground/5 to-foreground/10">
                  <Bot className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold">AI Search</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about betting opportunities..."
                  disabled={isLoading}
                  className="flex-1 h-10 text-base border-2 rounded-lg px-3"
                  style={{ fontSize: '16px' }}
                />
                <Button
                  onClick={() => handleSearch(input)}
                  disabled={isLoading || !input.trim()}
                  size="default"
                  className="h-10 px-4 rounded-lg"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Example Questions */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-xs font-medium">Try these examples</span>
                </div>
                <div className="grid gap-2">
                  {exampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto py-2.5 px-3 text-xs text-left border-2 hover:border-foreground hover:bg-foreground/5 rounded-lg transition-all"
                      onClick={() => handleSearch(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-background/95 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bot className="w-3 h-3" />
                    <span className="text-xs font-medium">Your question</span>
                  </div>
                  <h3 className="text-sm font-semibold">{currentQuery}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Results */}
            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
              {isLoading && messages.length <= 2 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                    <p className="text-muted-foreground text-sm">Finding matches...</p>
                  </div>
                </div>
              ) : recommendedEvents.length > 0 ? (
                <div className="space-y-3">
                  {messages[messages.length - 1]?.role === "assistant" && (
                    <div className="p-3 rounded-lg bg-muted/30 mb-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {messages[messages.length - 1].content}
                      </p>
                    </div>
                  )}
                  {recommendedEvents.map((result) => (
                    <div key={result.event.id}>
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
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-2">
                    <p className="text-base text-muted-foreground">No matches found</p>
                    <p className="text-xs text-muted-foreground">Try a different question</p>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Input at Bottom */}
            <div className="p-3 border-t border-border/50 bg-background/95 backdrop-blur-sm">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a follow-up..."
                  disabled={isLoading}
                  className="flex-1 h-10 text-base rounded-lg border-2"
                  style={{ fontSize: '16px' }}
                />
                <Button
                  onClick={() => handleSearch(input)}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="h-10 w-10 rounded-lg"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop: Full overlay
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-background/95 backdrop-blur-2xl"
        onClick={onClose}
      />

      {/* Main Content */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col animate-scale-in">
        {!hasSearched ? (
          <Card className="glass-effect border-0 shadow-2xl">
            <CardContent className="p-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-foreground/5 to-foreground/10">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold mb-1">AI Betting Assistant</h2>
                    <p className="text-muted-foreground">Ask me anything about betting opportunities</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Search Input */}
              <div className="mb-10">
                <div className="flex gap-3">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="What betting opportunities are you looking for?"
                    disabled={isLoading}
                    className="flex-1 h-16 text-lg border-2 rounded-2xl px-6 focus-visible:ring-2 focus-visible:ring-foreground/20 transition-all"
                  />
                  <Button
                    onClick={() => handleSearch(input)}
                    disabled={isLoading || !input.trim()}
                    size="lg"
                    className="px-8 h-16 rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Example Questions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Try these examples</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {exampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-between h-auto py-4 px-5 text-sm text-left border-2 hover:border-foreground hover:bg-foreground/5 rounded-xl transition-all group"
                      onClick={() => handleSearch(question)}
                    >
                      <span className="font-medium">{question}</span>
                      <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-effect border-0 shadow-2xl flex flex-col h-[88vh]">
            {/* Header with Query */}
            <div className="p-8 border-b border-border/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bot className="w-4 h-4" />
                    <span className="text-sm font-medium">Your question</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-balance">{currentQuery}</h3>
                  {messages[messages.length - 1]?.role === "assistant" && (
                    <p className="text-muted-foreground leading-relaxed">
                      {messages[messages.length - 1].content}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Recommended Events */}
            <ScrollArea className="flex-1 p-8" ref={scrollRef}>
              {isLoading && messages.length <= 2 ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto" />
                    <p className="text-muted-foreground text-lg">Finding the best matches...</p>
                  </div>
                </div>
              ) : recommendedEvents.length > 0 ? (
                <div className="space-y-5">
                  <h4 className="text-lg font-semibold mb-6">Recommended Matches</h4>
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
                <div className="flex items-center justify-center h-96">
                  <div className="text-center space-y-2">
                    <p className="text-lg text-muted-foreground">No matches found for your query</p>
                    <p className="text-sm text-muted-foreground">Try asking something different below</p>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Chat Input at Bottom */}
            <div className="p-6 border-t border-border/50 bg-background/50">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a follow-up question..."
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl border-2"
                />
                <Button
                  onClick={() => handleSearch(input)}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
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
