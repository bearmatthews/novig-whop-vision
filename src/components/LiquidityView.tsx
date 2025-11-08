import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{marketDescription} - Order Book</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {outcomes.map((outcome) => {
          if (!outcome.orders || outcome.orders.length === 0) {
            return null;
          }

          return (
            <div key={outcome.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{outcome.description}</h4>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {outcome.orders.length} orders
                </Badge>
              </div>
              
              <div className="space-y-2">
                {outcome.orders.map((order) => {
                  const payouts = calculatePayouts(order.price, order.qty);
                  const odds = priceToAmericanOdds(order.price);
                  
                  return (
                    <div 
                      key={order.id}
                      className="bg-secondary rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {odds}
                        </Badge>
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-success">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold">
                              {formatCurrency(order.qty)} total
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            Risk {formatCurrency(Math.round(payouts.risk * 100))} to win {formatCurrency(Math.round(payouts.toWin * 100))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-mono text-muted-foreground">
                          {order.price.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
