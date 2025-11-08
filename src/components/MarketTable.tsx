import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { priceToAmericanOdds, calculatePayouts, formatCurrency } from "@/lib/betting-utils";
import { TrendingUp, DollarSign } from "lucide-react";

interface Market {
  id: string;
  description: string;
  outcomes: Outcome[];
}

interface Outcome {
  id: string;
  description: string;
  last?: number;
  available?: number;
  orders?: Order[];
}

interface Order {
  id: string;
  status: string;
  qty: number;
  price: number;
}

interface MarketTableProps {
  markets: Market[];
  showLiquidity?: boolean;
}

export function MarketTable({ markets, showLiquidity = false }: MarketTableProps) {
  // Filter to only show markets with at least one outcome that has a price
  const marketsWithPrices = markets.filter((market) =>
    market.outcomes.some((outcome) => outcome.available || outcome.last)
  );

  if (marketsWithPrices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No markets with available prices at the moment.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {marketsWithPrices.map((market) => (
        <div key={market.id} className="border border-border rounded-lg overflow-hidden">
          <div className="bg-card px-4 py-3 border-b border-border">
            <h3 className="font-semibold">{market.description}</h3>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Outcome</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Odds</TableHead>
                {showLiquidity && (
                  <>
                    <TableHead className="text-right">Liquidity</TableHead>
                    <TableHead className="text-right">Total Orders</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {market.outcomes
                .filter((outcome) => outcome.available || outcome.last) // Only show outcomes with prices
                .map((outcome) => {
                const price = outcome.available || outcome.last;
                const hasOrders = outcome.orders && outcome.orders.length > 0;
                const totalLiquidity = hasOrders 
                  ? outcome.orders.reduce((sum, order) => sum + order.qty, 0)
                  : 0;
                
                return (
                  <TableRow key={outcome.id}>
                    <TableCell className="font-medium">{outcome.description}</TableCell>
                    <TableCell className="text-right">
                      {price ? (
                        <div className="flex items-center justify-end gap-2">
                          {outcome.available ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              {price.toFixed(2)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                              {price.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {price ? priceToAmericanOdds(price) : '-'}
                    </TableCell>
                    {showLiquidity && (
                      <>
                        <TableCell className="text-right">
                          {hasOrders ? (
                            <div className="flex items-center justify-end gap-1 text-success">
                              <DollarSign className="w-4 h-4" />
                              {formatCurrency(totalLiquidity)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {hasOrders ? (
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {outcome.orders.length}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
