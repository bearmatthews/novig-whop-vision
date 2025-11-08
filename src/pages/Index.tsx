import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LeagueSelector, LEAGUES } from "@/components/LeagueSelector";
import { EventCard } from "@/components/EventCard";
import { MarketTable } from "@/components/MarketTable";
import { LiquidityView } from "@/components/LiquidityView";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { graphqlQuery } from "@/lib/graphql-client";
import { GET_ALL_EVENTS_QUERY, GET_EVENT_DETAIL_QUERY } from "@/lib/queries";
import { RefreshCw, Activity, TrendingUp, SearchX, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [selectedLeague, setSelectedLeague] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all sports
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const allLeagues = LEAGUES.filter(l => l.id !== 'ALL').map(l => l.id);
      const response = await graphqlQuery(GET_ALL_EVENTS_QUERY, { leagues: allLeagues });
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      return response.data;
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch betting data", {
        description: error instanceof Error ? error.message : "Unknown error",
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
      const hasActiveMarkets = event.markets?.some((market: any) => 
        market.outcomes?.some((outcome: any) => outcome.available || outcome.last)
      );
      return hasActiveMarkets;
    });
    
    // Apply search filter (searches across ALL sports regardless of league filter)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      activeEvents = activeEvents.filter((event: any) => 
        event.description.toLowerCase().includes(query)
      );
    }
    
    // Apply league filter AFTER search (so search works across all sports)
    if (selectedLeague !== 'ALL') {
      activeEvents = activeEvents.filter((event: any) => 
        event.game.league === selectedLeague
      );
    }
    
    return activeEvents;
  }, [data?.event, searchQuery, selectedLeague]);

  const liveEvents = filteredEvents.filter((e: any) => e.status === "OPEN_INGAME");
  const pregameEvents = filteredEvents.filter((e: any) => e.status === "OPEN_PREGAME");

  // Fetch detailed event data when an event is selected
  const { data: eventDetailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['eventDetail', selectedEvent?.id],
    queryFn: async () => {
      if (!selectedEvent?.id) return null;
      const response = await graphqlQuery(GET_EVENT_DETAIL_QUERY, { eventId: selectedEvent.id });
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      return response.data?.event?.[0];
    },
    enabled: !!selectedEvent?.id,
  });

  const eventWithLiquidity = eventDetailData || selectedEvent;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Top Row - Title & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="w-7 h-7 text-primary" />
                  Novig Live Markets
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Real-time betting data and liquidity
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  {filteredEvents.length} events
                </Badge>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            {/* Bottom Row - League Selector & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-shrink-0">
                <LeagueSelector
                  selectedLeague={selectedLeague}
                  onLeagueChange={(league) => {
                    setSelectedLeague(league);
                    setSelectedEvent(null);
                    setSearchQuery("");
                  }}
                />
              </div>
              <div className="flex-1 max-w-md">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search teams or games..."
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {isLoading && !data && (
            <EmptyState
              icon={RefreshCw}
              title="Loading betting data"
              description="Fetching live markets from Novig..."
            />
          )}

          {error && (
            <EmptyState
              icon={AlertCircle}
              title="Failed to load data"
              description="There was an error fetching betting data. Please try refreshing."
              action={
                <Button onClick={handleRefresh} variant="default">
                  Try Again
                </Button>
              }
            />
          )}

          {!isLoading && !error && data && filteredEvents.length === 0 && searchQuery && (
            <EmptyState
              icon={SearchX}
              title="No results found"
              description={`No games match "${searchQuery}". Try a different search term.`}
              action={
                <Button onClick={() => setSearchQuery("")} variant="outline">
                  Clear Search
                </Button>
              }
            />
          )}

          {!isLoading && !error && data && filteredEvents.length === 0 && !searchQuery && (
            <EmptyState
              icon={TrendingUp}
              title="No Active Events"
              description={
                selectedLeague === 'ALL' 
                  ? "There are no active events with open markets at the moment."
                  : `There are no active ${selectedLeague} events with open markets at the moment.`
              }
            />
          )}

          {filteredEvents.length > 0 && !selectedEvent && (
            <Tabs defaultValue="all" className="w-full">
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

              <TabsContent value="all" className="mt-6">
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredEvents.map((event: any) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => setSelectedEvent(event)}
                      showMarkets
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="live" className="mt-6">
                {liveEvents.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="No Live Events"
                    description="There are no live games at the moment. Check back during game time!"
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {liveEvents.map((event: any) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => setSelectedEvent(event)}
                        showMarkets
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pregame" className="mt-6">
                {pregameEvents.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="No Upcoming Games"
                    description="All games are currently live or there are no scheduled games with open markets."
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {pregameEvents.map((event: any) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => setSelectedEvent(event)}
                        showMarkets
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {selectedEvent && (
            <div className="space-y-6">
              <Button
                variant="secondary"
                onClick={() => setSelectedEvent(null)}
              >
                ← Back to events
              </Button>

              {isLoadingDetail ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Loading event details and liquidity...</p>
                </div>
              ) : (
                <>
                  <EventCard event={eventWithLiquidity} />

                  <Tabs defaultValue="markets" className="w-full">
                    <TabsList>
                      <TabsTrigger value="markets">Markets</TabsTrigger>
                      <TabsTrigger value="liquidity">Order Book</TabsTrigger>
                    </TabsList>

                    <TabsContent value="markets" className="mt-6">
                      <MarketTable markets={eventWithLiquidity.markets} />
                    </TabsContent>

                    <TabsContent value="liquidity" className="mt-6">
                      <div className="space-y-6">
                        {eventWithLiquidity.markets
                          .filter((market: any) => 
                            market.outcomes.some((outcome: any) => 
                              outcome.orders && outcome.orders.length > 0
                            )
                          )
                          .map((market: any) => (
                            <LiquidityView
                              key={market.id}
                              outcomes={market.outcomes}
                              marketDescription={market.description}
                            />
                          ))}
                        {eventWithLiquidity.markets.every((market: any) => 
                          !market.outcomes.some((outcome: any) => 
                            outcome.orders && outcome.orders.length > 0
                          )
                        ) && (
                          <div className="text-center py-8 text-muted-foreground">
                            No order book data available for this event.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
