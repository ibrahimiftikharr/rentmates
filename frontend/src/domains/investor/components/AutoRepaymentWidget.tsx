import { Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";

const repayments = [
  { date: "Oct 13", amount: "$2,450", status: "due-soon" },
  { date: "Oct 20", amount: "$3,200", status: "scheduled" },
  { date: "Nov 05", amount: "$1,800", status: "scheduled" },
];

export function AutoRepaymentWidget() {
  return (
    <Card className="border-0 shadow-2xl hover:shadow-[0_20px_50px_rgba(140,87,255,0.15)] transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Automated Loan Repayment
          </span>
          <Switch defaultChecked />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 text-sm">
            Next payment in 3 days – Auto-debit enabled
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          {repayments.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${
                  item.status === "due-soon" ? "bg-orange-500" : "bg-primary"
                }`} />
                <div>
                  <p className="text-sm">{item.date}</p>
                  <p className="text-xs text-muted-foreground">{item.amount}</p>
                </div>
              </div>
              <Badge 
                variant="secondary"
                className={
                  item.status === "due-soon" 
                    ? "bg-orange-50 text-orange-600 border-orange-200" 
                    : "bg-primary/10 text-primary border-primary/20"
                }
              >
                {item.status === "due-soon" ? "Due Soon" : "Scheduled"}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <p className="text-xs text-blue-700">
            Auto-repay ensures timely payments from your wallet balance. Disable anytime in settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}