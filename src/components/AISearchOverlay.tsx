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
  onEventSelect: (event: any) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AISearchOverlay({ events, onClose, onEventSelect }: AISearchOverlayProps) {
  const [currentQuery, setCurrentQuery] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<any[]>([]);
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
    const leagues = [...new Set(events.map(e => e.game.league))];
    
    if (leagues.includes('NBA')) {
      questions.push("Show me NBA games with the best underdog odds");
    }
    if (leagues.includes('NFL')) {
      questions.push("Find NFL games with high over/under totals");
    }
    if (leagues.includes('NHL')) {
      questions.push("What are the best NHL home team bets tonight?");
    }
    
    // Add generic questions
    questions.push("Show me all live games right now");
    questions.push("Find games starting in the next 2 hours");
    questions.push("What are the best value bets available?");
    
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
      const { data, error } = await supabase.functions.invoke("ai-betting-search", {
        body: {
          message: query,
          events,
          conversationHistory: messages.slice(-6)
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || "I found some matches for you!"
      };

      setMessages([...newMessages, assistantMessage]);

      // Filter and set recommended events
      if (data.eventIds && data.eventIds.length > 0) {
        const filtered = events.filter(e => data.eventIds.includes(e.id));
        setRecommendedEvents(filtered);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Main Content */}
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col animate-scale-in">
        {!hasSearched ? (
          /* Initial Search State */
          <Card className="border-2 border-primary/20 shadow-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">AI Betting Assistant</h2>
                    <p className="text-sm text-muted-foreground">Ask me anything about betting opportunities</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Search Input */}
              <div className="mb-8">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="What betting opportunities are you looking for?"
                    disabled={isLoading}
                    className="flex-1 h-14 text-lg"
                  />
                  <Button
                    onClick={() => handleSearch(input)}
                    disabled={isLoading || !input.trim()}
                    size="lg"
                    className="px-8"
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  <span>Try these example questions:</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {exampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-between h-auto py-3 px-4 text-left hover:border-primary hover:bg-primary/5 transition-all group"
                      onClick={() => handleSearch(question)}
                    >
                      <span className="text-sm">{question}</span>
                      <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Results View */
          <Card className="border-2 border-primary/20 shadow-2xl flex flex-col h-[85vh]">
            {/* Header with Query */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Bot className="w-4 h-4" />
                    <span>Your question:</span>
                  </div>
                  <h3 className="text-xl font-bold">{currentQuery}</h3>
                  {messages[messages.length - 1]?.role === "assistant" && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {messages[messages.length - 1].content}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Recommended Events */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              {isLoading && messages.length <= 2 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Finding the best matches...</p>
                  </div>
                </div>
              ) : recommendedEvents.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold mb-4">Recommended Matches</h4>
                  {recommendedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => {
                        onEventSelect(event);
                        onClose();
                      }}
                      showMarkets={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">No matches found for your query</p>
                    <p className="text-sm text-muted-foreground">Try asking something different below</p>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Chat Input at Bottom */}
            <div className="p-4 border-t bg-card/50">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a follow-up question..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSearch(input)}
                  disabled={isLoading || !input.trim()}
                  size="icon"
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
