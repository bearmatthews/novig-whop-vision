import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
export function LogoCachePopulator() {
  const [isPopulating, setIsPopulating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const populateLogos = async (league?: string) => {
    setIsPopulating(true);
    setResults(null);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('populate-college-logos', {
        body: {
          league,
          all: !league
        }
      });
      if (error) throw error;
      setResults(data.results);
      toast.success('Logo population completed!');
    } catch (error) {
      console.error('Error populating logos:', error);
      toast.error('Failed to populate logos');
    } finally {
      setIsPopulating(false);
    }
  };
  return <Card>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => populateLogos()} disabled={isPopulating}>
            {isPopulating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Populate All Logos
          </Button>
          <Button variant="outline" onClick={() => populateLogos('NCAAF')} disabled={isPopulating}>
            NCAAF Only
          </Button>
          <Button variant="outline" onClick={() => populateLogos('NCAAB')} disabled={isPopulating}>
            NCAAB Only
          </Button>
        </div>

        {results && <div className="mt-4 space-y-2 text-sm">
            {Object.entries(results).map(([league, data]: [string, any]) => <div key={league} className="p-3 rounded-lg bg-muted">
                <div className="font-semibold">{league}</div>
                <div className="text-muted-foreground">
                  ✓ {data.successful} successful, ✗ {data.failed} failed ({data.total} total)
                </div>
              </div>)}
          </div>}
      </CardContent>
    </Card>;
}