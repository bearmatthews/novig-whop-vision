import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { priceToAmericanOdds, calculatePayouts, formatCurrency } from "@/lib/betting-utils";
import { DollarSign, TrendingUp } from "lucide-react";

interface Order {
  id: string;
  status: string;
  qty: number;
  price: number;
}

interface Outcome {
  id: string;
  description: string;
  orders: Order[];
}

interface LiquidityViewProps {
  outcomes: Outcome[];
  marketDescription: string;
}

export function LiquidityView({ outcomes, marketDescription }: LiquidityViewProps) {
  // Filter to only show outcomes with orders
  const outcomesWithOrders = outcomes.filter(
    (outcome) => outcome.orders && outcome.orders.length > 0
  );

  if (outcomesWithOrders.length === 0) {
    return null; // Don't render if no liquidity
  }

  return (
    <Card className="p-3 sm:p-4">
      <h3 className="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wide mb-3 sm:mb-4">
        {marketDescription}
      </h3>
      <div className="space-y-3 sm:space-y-4">
        {outcomesWithOrders.map((outcome) => {
          return (
            <div key={outcome.id} className="space-y-2">
              <div className="flex items-center justify-between pb-2">
                <h4 className="font-semibold text-xs sm:text-sm line-clamp-2 flex-1">{outcome.description}</h4>
                <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs ml-2 flex-shrink-0">
                  <TrendingUp className="w-3 h-3" />
                  <span className="hidden xs:inline">{outcome.orders.length} orders</span>
                  <span className="xs:hidden">{outcome.orders.length}</span>
                </Badge>
              </div>
              
              <div className="grid gap-2">
                {outcome.orders.map((order) => {
                  const payouts = calculatePayouts(order.price, order.qty);
                  const odds = priceToAmericanOdds(order.price);
                  
                  return (
                    <div 
                      key={order.id}
                      className="bg-secondary/30 border border-border rounded-md p-2.5 sm:p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-base sm:text-lg font-bold font-mono">
                          {odds}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Price: <span className="font-semibold text-foreground">{order.price.toFixed(3)}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-0 text-xs pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1 text-success">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-semibold">{formatCurrency(order.qty)} total</span>
                        </div>
                        <div className="text-muted-foreground text-[11px] xs:text-xs">
                          Risk {formatCurrency(Math.round(payouts.risk * 100))} to win {formatCurrency(Math.round(payouts.toWin * 100))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
