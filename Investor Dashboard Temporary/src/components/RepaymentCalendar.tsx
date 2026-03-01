import { useState } from "react";
import { Calendar } from "./ui/calendar";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "./ui/badge";

interface RepaymentEvent {
  date: Date;
  loanId: string;
  amount: number;
  status: "paid" | "due-soon" | "overdue" | "scheduled";
  autoPay: boolean;
}

export function RepaymentCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [autoRepayEnabled, setAutoRepayEnabled] = useState(true);

  // Mock repayment data
  const repayments: RepaymentEvent[] = [
    {
      date: new Date(2024, 1, 15),
      loanId: "LOAN-001",
      amount: 500,
      status: "paid",
      autoPay: true
    },
    {
      date: new Date(2024, 1, 20),
      loanId: "LOAN-002",
      amount: 750,
      status: "due-soon",
      autoPay: true
    },
    {
      date: new Date(2024, 1, 25),
      loanId: "LOAN-003",
      amount: 1000,
      status: "scheduled",
      autoPay: false
    },
    {
      date: new Date(2024, 1, 10),
      loanId: "LOAN-004",
      amount: 300,
      status: "overdue",
      autoPay: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "due-soon":
        return "bg-orange-500";
      case "overdue":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>;
      case "due-soon":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Due Soon</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Scheduled</Badge>;
    }
  };

  const getDateEvents = (date: Date) => {
    return repayments.filter(
      (r) =>
        r.date.getDate() === date.getDate() &&
        r.date.getMonth() === date.getMonth() &&
        r.date.getFullYear() === date.getFullYear()
    );
  };

  const getDateStatus = (date: Date) => {
    const events = getDateEvents(date);
    if (events.length === 0) return null;
    
    // Priority: overdue > due-soon > paid > scheduled
    if (events.some(e => e.status === "overdue")) return "overdue";
    if (events.some(e => e.status === "due-soon")) return "due-soon";
    if (events.some(e => e.status === "paid")) return "paid";
    return "scheduled";
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const events = getDateEvents(date);
      if (events.length > 0) {
        setSelectedDate(date);
        setIsDialogOpen(true);
      }
    }
  };

  const selectedDateEvents = selectedDate ? getDateEvents(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Auto-Repay Toggle */}
      <Card className="p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="auto-repay" className="text-base font-semibold">
              Auto-Repay
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically pay scheduled repayments from your wallet
            </p>
          </div>
          <Switch
            id="auto-repay"
            checked={autoRepayEnabled}
            onCheckedChange={setAutoRepayEnabled}
          />
        </div>
        <div className="mt-4">
          <Badge
            variant="secondary"
            className={autoRepayEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
          >
            {autoRepayEnabled ? "✓ Enabled" : "✗ Disabled"}
          </Badge>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="font-semibold">Payment Status</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-muted-foreground">Due Soon</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-muted-foreground">Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-muted-foreground">Scheduled</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar */}
      <Card className="p-6 shadow-lg">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="rounded-md border"
            modifiers={{
              paid: (date) => getDateStatus(date) === "paid",
              dueSoon: (date) => getDateStatus(date) === "due-soon",
              overdue: (date) => getDateStatus(date) === "overdue",
              scheduled: (date) => getDateStatus(date) === "scheduled"
            }}
            modifiersClassNames={{
              paid: "bg-green-100 text-green-900 font-bold hover:bg-green-200 relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-green-500",
              dueSoon: "bg-orange-100 text-orange-900 font-bold hover:bg-orange-200 relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-orange-500",
              overdue: "bg-red-100 text-red-900 font-bold hover:bg-red-200 relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-red-500",
              scheduled: "bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-gray-400"
            }}
          />
        </div>
      </Card>

      {/* Date Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Payments for {selectedDate?.toLocaleDateString("en-US", { 
                month: "long", 
                day: "numeric", 
                year: "numeric" 
              })}
            </DialogTitle>
            <DialogDescription>
              Manage your repayments for the selected date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedDateEvents.map((event, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{event.loanId}</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      ${event.amount.toLocaleString()}
                    </p>
                  </div>
                  {getStatusBadge(event.status)}
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Label htmlFor={`auto-${index}`} className="cursor-pointer">
                      Auto-pay
                    </Label>
                  </div>
                  <Switch
                    id={`auto-${index}`}
                    checked={event.autoPay}
                    disabled={event.status === "paid" || event.status === "overdue"}
                  />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}