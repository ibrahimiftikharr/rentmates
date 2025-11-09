import { Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';

const payments = [
  {
    property: 'Downtown Loft A',
    tenant: 'Sarah Johnson',
    amount: 2800,
    dueDate: '2025-10-15',
    status: 'upcoming',
  },
  {
    property: 'Riverside Apartment 3B',
    tenant: 'Michael Chen',
    amount: 2200,
    dueDate: '2025-10-18',
    status: 'upcoming',
  },
  {
    property: 'City Center Studio',
    tenant: 'Emma Williams',
    amount: 1800,
    dueDate: '2025-10-20',
    status: 'upcoming',
  },
  {
    property: 'Suburban House',
    tenant: 'James Martinez',
    amount: 3500,
    dueDate: '2025-10-22',
    status: 'upcoming',
  },
];

export function UpcomingPayments() {
  return (
    <Card className="border-0 shadow-lg rounded-xl sm:rounded-2xl">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-[#4A4A68] text-base sm:text-lg">Upcoming Rent Payments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
        {payments.map((payment, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-xl hover:border-[#8C57FF] transition-colors"
          >
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-[#8C57FF] to-[#B794F6] rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm truncate">{payment.property}</p>
                <p className="text-xs text-muted-foreground truncate">{payment.tenant}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    Due: {new Date(payment.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="flex items-center gap-1 text-[#28C76F]">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-sm sm:text-base">{payment.amount.toLocaleString()}</span>
              </div>
              <Badge
                variant="secondary"
                className="bg-[#00CFE8]/10 text-[#00CFE8] border-0 mt-1 text-xs"
              >
                Auto-pay
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
