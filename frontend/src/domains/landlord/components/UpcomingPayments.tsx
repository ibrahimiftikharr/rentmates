import { useEffect, useState } from 'react';
import { Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import * as landlordService from '../services/landlordService';
import { io } from 'socket.io-client';

interface Payment {
  _id: string;
  property: {
    _id: string;
    title: string;
  };
  student: {
    _id: string;
    name: string;
  };
  currentRentCycle: {
    amount: number;
    dueDate: string;
  };
  autoPaymentEnabled: boolean;
}

export function UpcomingPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    try {
      const data = await landlordService.getUpcomingPayments();
      setPayments(data);
    } catch (error) {
      console.error('Failed to load upcoming payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();

    const socket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });

    socket.on('payment_received', () => {
      loadPayments();
    });

    socket.on('rent_cycle_updated', () => {
      loadPayments();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-[#4A4A68] text-base sm:text-lg">Upcoming Rent Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <p className="text-sm text-muted-foreground">Loading payments...</p>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card className="border-0 shadow-lg rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-[#4A4A68] text-base sm:text-lg">Upcoming Rent Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <p className="text-sm text-muted-foreground">No upcoming payments</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg rounded-xl sm:rounded-2xl">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-[#4A4A68] text-base sm:text-lg">Upcoming Rent Payments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
        {payments.map((payment) => (
          <div
            key={payment._id}
            className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-xl hover:border-[#8C57FF] transition-colors"
          >
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-[#8C57FF] to-[#B794F6] rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm truncate">{payment.property.title}</p>
                <p className="text-xs text-muted-foreground truncate">{payment.student.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    Due: {new Date(payment.currentRentCycle.dueDate).toLocaleDateString('en-US', {
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
                <span className="text-sm sm:text-base">{payment.currentRentCycle.amount.toLocaleString()}</span>
              </div>
              {payment.autoPaymentEnabled && (
                <Badge
                  variant="secondary"
                  className="bg-[#00CFE8]/10 text-[#00CFE8] border-0 mt-1 text-xs"
                >
                  Auto-pay
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
