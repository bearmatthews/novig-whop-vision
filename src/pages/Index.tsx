import { useState, useEffect, useMemo } from "react";
import novigLogo from "@/assets/novig-logo.jpg";
import { useQuery } from "@tanstack/react-query";
import { LeagueSelector, LEAGUES } from "@/components/LeagueSelector";
import { EventCard } from "@/components/EventCard";
import { MarketTable } from "@/components/MarketTable";
import { LiquidityView } from "@/components/LiquidityView";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState } from "@/components/EmptyState";
import { WhopUserProfile } from "@/components/WhopUserProfile";
import { AISearchOverlay } from "@/components/AISearchOverlay";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { graphqlQuery } from "@/lib/graphql-client";
import { GET_ALL_EVENTS_QUERY, GET_EVENT_DETAIL_QUERY } from "@/lib/queries";
import { RefreshCw, Activity, TrendingUp, SearchX, AlertCircle, Bot } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const isMobile = useIsMobile();
  const [selectedLeague, setSelectedLeague] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiFilteredEventIds, setAiFilteredEventIds] = useState<string[]>([]);
  const [targetOutcomeId, setTargetOutcomeId] = useState<string | null>(null);

  // Fetch all sports
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const allLeagues = LEAGUES.filter(l => l.id !== 'ALL').map(l => l.id);
      const response = await graphqlQuery(GET_ALL_EVENTS_QUERY, {
        leagues: allLeagues
      });
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      
      // Enhance with Polymarket odds
      try {
        const polymarketResponse = await supabase.functions.invoke('polymarket-odds', {
          body: { novigEvents: response.data.event }
        });
        
        if (polymarketResponse.data?.events) {
          console.log(`Enhanced ${polymarketResponse.data.events.length} events with Polymarket data`);
          return { event: polymarketResponse.data.events };
        }
      } catch (polyError) {
        console.error('Failed to fetch Polymarket odds:', polyError);
      }
      
      return response.data;
    },
    refetchInterval: 30000 // Poll every 30 seconds
  });
  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch betting data", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }, [error]);
  const handleRefresh = async () => {
    toast.info("Refreshing data...");
    await refetch();
    toast.success("Data refreshed");
  };

  // Filter out events with no active markets, apply league filter and search
  const filteredEvents = useMemo(() => {
    const allEvents = data?.event || [];

    // Filter out events without active markets
    let activeEvents = allEvents.filter((event: any) => {
      const hasActiveMarkets = event.markets?.some((market: any) => market.outcomes?.some((outcome: any) => outcome.available || outcome.last));
      return hasActiveMarkets;
    });

    // If AI has filtered events, use that filter
    if (aiFilteredEventIds.length > 0) {
      activeEvents = activeEvents.filter((event: any) => aiFilteredEventIds.includes(event.id));
    } else {
      // Apply search filter (searches across ALL sports regardless of league filter)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        activeEvents = activeEvents.filter((event: any) => event.description.toLowerCase().includes(query));
      }

      // Apply league filter AFTER search (so search works across all sports)
      if (selectedLeague !== 'ALL') {
        activeEvents = activeEvents.filter((event: any) => event.game.league === selectedLeague);
      }
    }
    return activeEvents;
  }, [data?.event, searchQuery, selectedLeague, aiFilteredEventIds]);
  const liveEvents = filteredEvents.filter((e: any) => e.status === "OPEN_INGAME");
  const pregameEvents = filteredEvents.filter((e: any) => e.status === "OPEN_PREGAME");

  // Fetch detailed event data when an event is selected
  const {
    data: eventDetailData,
    isLoading: isLoadingDetail
  } = useQuery({
    queryKey: ['eventDetail', selectedEvent?.id],
    queryFn: async () => {
      if (!selectedEvent?.id) return null;
      const response = await graphqlQuery(GET_EVENT_DETAIL_QUERY, {
        eventId: selectedEvent.id
      });
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      return response.data?.event?.[0];
    },
    enabled: !!selectedEvent?.id
  });
  const eventWithLiquidity = eventDetailData || selectedEvent;
  return <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 glass-effect">
        <div className="container mx-auto px-3 md:px-6 py-2 md:py-5">
          {isMobile ? (
            // Mobile Layout - Single Line
            <div className="flex items-center gap-2">
              <WhopUserProfile />
              <LeagueSelector 
                selectedLeague={selectedLeague} 
                onLeagueChange={league => {
                  setSelectedLeague(league);
                  setSelectedEvent(null);
                  setSearchQuery("");
                }} 
              />
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder="Search..." 
              />
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setShowAIChat(!showAIChat)} 
                className="rounded-lg shrink-0 px-2"
              >
                <Bot className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            // Desktop Layout - Horizontal
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-6">
                <WhopUserProfile />
                <div className="flex-shrink-0">
                  <LeagueSelector selectedLeague={selectedLeague} onLeagueChange={league => {
                  setSelectedLeague(league);
                  setSelectedEvent(null);
                  setSearchQuery("");
                }} />
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-full sm:w-auto sm:max-w-md">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search teams or games..." />
                </div>
                <Button variant="default" size="default" onClick={() => setShowAIChat(!showAIChat)} className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all">
                  <Bot className="w-4 h-4" />
                  Ask Bear
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 relative">
        <div className="space-y-6">
          {isLoading && !data && <EmptyState icon={RefreshCw} title="Loading betting data" description="Fetching live markets from Novig..." />}

          {error && <EmptyState icon={AlertCircle} title="Failed to load data" description="There was an error fetching betting data. Please try refreshing." action={<Button onClick={handleRefresh} variant="default">
                  Try Again
                </Button>} />}

          {!isLoading && !error && data && filteredEvents.length === 0 && searchQuery && <EmptyState icon={SearchX} title="No results found" description={`No games match "${searchQuery}". Try a different search term.`} action={<Button onClick={() => setSearchQuery("")} variant="outline">
                  Clear Search
                </Button>} />}

          {!isLoading && !error && data && filteredEvents.length === 0 && !searchQuery && <EmptyState icon={TrendingUp} title="No Active Events" description={selectedLeague === 'ALL' ? "There are no active events with open markets at the moment." : `There are no active ${selectedLeague} events with open markets at the moment.`} />}

          {filteredEvents.length > 0 && !selectedEvent && <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="all">
                  All <span className="ml-1.5 text-xs">({filteredEvents.length})</span>
                </TabsTrigger>
                <TabsTrigger value="live">
                  Live <span className="ml-1.5 text-xs">({liveEvents.length})</span>
                </TabsTrigger>
                <TabsTrigger value="pregame">
                  Pre-Game <span className="ml-1.5 text-xs">({pregameEvents.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* Polymarket Integration Info */}
              {data?.event?.some((e: any) => e.polymarketData?.markets?.length > 0) && (
                <div className="mt-4 mb-6 p-4 bg-success/10 border border-success/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-success text-success-foreground">
                      Polymarket
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Showing best odds across Novig and Polymarket •{' '}
                      {data.event.filter((e: any) => e.polymarketData?.markets?.length > 0).length} games with multiple lines
                    </span>
                  </div>
                </div>
              )}

              <TabsContent value="all" className="mt-6">
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredEvents.map((event: any) => <EventCard 
                    key={event.id} 
                    event={event} 
                    onClick={() => setSelectedEvent(event)}
                    onOutcomeClick={(outcomeId) => {
                      setSelectedEvent(event);
                      setTargetOutcomeId(outcomeId);
                    }}
                    showMarkets 
                  />)}
                </div>
              </TabsContent>

              <TabsContent value="live" className="mt-6">
                {liveEvents.length === 0 ? <EmptyState icon={Activity} title="No Live Events" description="There are no live games at the moment. Check back during game time!" /> : <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {liveEvents.map((event: any) => <EventCard 
                      key={event.id} 
                      event={event} 
                      onClick={() => setSelectedEvent(event)}
                      onOutcomeClick={(outcomeId) => {
                        setSelectedEvent(event);
                        setTargetOutcomeId(outcomeId);
                      }}
                      showMarkets 
                    />)}
                  </div>}
              </TabsContent>

              <TabsContent value="pregame" className="mt-6">
                {pregameEvents.length === 0 ? <EmptyState icon={TrendingUp} title="No Upcoming Games" description="All games are currently live or there are no scheduled games with open markets." /> : <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {pregameEvents.map((event: any) => <EventCard 
                      key={event.id} 
                      event={event} 
                      onClick={() => setSelectedEvent(event)}
                      onOutcomeClick={(outcomeId) => {
                        setSelectedEvent(event);
                        setTargetOutcomeId(outcomeId);
                      }}
                      showMarkets 
                    />)}
                  </div>}
              </TabsContent>
            </Tabs>}

          {selectedEvent && <div className="space-y-6">
              <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
                ← Back to events
              </Button>

              {isLoadingDetail ? <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Loading event details and liquidity...</p>
                </div> : <>
                  <EventCard event={eventWithLiquidity} />

                  <Tabs defaultValue="markets" className="w-full">
                    <TabsList>
                      <TabsTrigger value="markets">Markets</TabsTrigger>
                      <TabsTrigger value="liquidity">Order Book</TabsTrigger>
                    </TabsList>

                    <TabsContent value="markets" className="mt-6">
                      <MarketTable 
                        markets={eventWithLiquidity.markets} 
                        eventId={selectedEvent.id}
                        targetOutcomeId={targetOutcomeId}
                        onOutcomeHighlighted={() => setTargetOutcomeId(null)}
                      />
                    </TabsContent>

                    <TabsContent value="liquidity" className="mt-6">
                      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                        {eventWithLiquidity.markets.filter((market: any) => market.outcomes.some((outcome: any) => outcome.orders && outcome.orders.length > 0)).map((market: any) => <LiquidityView key={market.id} outcomes={market.outcomes} marketDescription={market.description} />)}
                      </div>
                      {eventWithLiquidity.markets.every((market: any) => !market.outcomes.some((outcome: any) => outcome.orders && outcome.orders.length > 0)) && <div className="text-center py-8 text-muted-foreground">
                            No order book data available for this event.
                          </div>}
                    </TabsContent>
                  </Tabs>
                </>}
            </div>}
        </div>
      </main>

      {/* AI Search Overlay */}
      {showAIChat && <AISearchOverlay events={data?.event || []} onClose={() => {
      setShowAIChat(false);
      setAiFilteredEventIds([]);
    }} onEventSelect={(event, outcomeId) => {
      setSelectedEvent(event);
      setShowAIChat(false);
      if (outcomeId) {
        setTargetOutcomeId(outcomeId);
      }
    }} />}
    </div>;
};
export default Index;