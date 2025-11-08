import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { LeagueSelector } from "@/components/LeagueSelector";
import { EventCard } from "@/components/EventCard";
import { MarketTable } from "@/components/MarketTable";
import { LiquidityView } from "@/components/LiquidityView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GET_ALL_EVENTS_WITH_LIQUIDITY } from "@/lib/graphql-queries";
import { RefreshCw, Activity, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [selectedLeague, setSelectedLeague] = useState("MLB");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { data, loading, error, refetch } = useQuery(GET_ALL_EVENTS_WITH_LIQUIDITY, {
    variables: { league: selectedLeague },
    pollInterval: 30000, // Poll every 30 seconds
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch betting data", {
        description: error.message,
      });
    }
  }, [error]);

  const handleRefresh = async () => {
    toast.info("Refreshing data...");
    await refetch();
    toast.success("Data refreshed");
  };

  const events = data?.event || [];
  const liveEvents = events.filter((e: any) => e.status === "OPEN_INGAME");
  const pregameEvents = events.filter((e: any) => e.status === "OPEN_PREGAME");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Activity className="w-8 h-8 text-primary" />
                Novig Live Markets
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time betting data and liquidity visualization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                {events.length} active events
              </Badge>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* League Selector */}
          <LeagueSelector
            selectedLeague={selectedLeague}
            onLeagueChange={(league) => {
              setSelectedLeague(league);
              setSelectedEvent(null);
            }}
          />

          {loading && !data && (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-4">Loading betting data...</p>
            </div>
          )}

          {!loading && events.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Events</h3>
              <p className="text-muted-foreground">
                There are no active {selectedLeague} events at the moment.
              </p>
            </div>
          )}

          {events.length > 0 && !selectedEvent && (
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">
                  All Events ({events.length})
                </TabsTrigger>
                <TabsTrigger value="live">
                  Live ({liveEvents.length})
                </TabsTrigger>
                <TabsTrigger value="pregame">
                  Pre-Game ({pregameEvents.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {events.map((event: any) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => setSelectedEvent(event)}
                      showMarkets
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="live" className="space-y-4 mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {liveEvents.map((event: any) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => setSelectedEvent(event)}
                      showMarkets
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pregame" className="space-y-4 mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {pregameEvents.map((event: any) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => setSelectedEvent(event)}
                      showMarkets
                    />
                  ))}
                </div>
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

              <EventCard event={selectedEvent} />

              <Tabs defaultValue="markets" className="w-full">
                <TabsList>
                  <TabsTrigger value="markets">Markets</TabsTrigger>
                  <TabsTrigger value="liquidity">Order Book</TabsTrigger>
                </TabsList>

                <TabsContent value="markets" className="mt-6">
                  <MarketTable markets={selectedEvent.markets} />
                </TabsContent>

                <TabsContent value="liquidity" className="mt-6">
                  <div className="space-y-6">
                    {selectedEvent.markets.map((market: any) => (
                      <LiquidityView
                        key={market.id}
                        outcomes={market.outcomes}
                        marketDescription={market.description}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
