import { useState } from "react";
import { Download, Wallet, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { WithdrawalModal } from "./modals/WithdrawalModal";
import { toast } from "sonner";

const repayments = [
  {
    date: "Oct 10, 2025",
    loanId: "LN-2847",
    amount: "$2,450",
    amountNum: 2450,
    status: "completed",
  },
  {
    date: "Oct 09, 2025",
    loanId: "LN-2846",
    amount: "$3,200",
    amountNum: 3200,
    status: "completed",
  },
  {
    date: "Oct 08, 2025",
    loanId: "LN-2845",
    amount: "$1,875",
    amountNum: 1875,
    status: "pending",
  },
  {
    date: "Oct 05, 2025",
    loanId: "LN-2844",
    amount: "$4,100",
    amountNum: 4100,
    status: "completed",
  },
];

export function RepaymentCenter() {
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);

  const handleWithdraw = (amount: number) => {
    setSelectedAmount(amount);
    setIsWithdrawalModalOpen(true);
  };

  const handleDownload = (loanId: string) => {
    toast.success("Receipt downloaded", {
      description: `Downloaded receipt for ${loanId}`
    });
  };

  return (
    <>
      <Card className="border-0 shadow-2xl hover:shadow-[0_20px_50px_rgba(140,87,255,0.15)] transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Repayment & Withdrawal Center
            </span>
            <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-200">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Blockchain-verified
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Loan ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repayments.map((item) => (
                <TableRow key={item.loanId}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.loanId}</TableCell>
                  <TableCell>{item.amount}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        item.status === "completed"
                          ? "bg-green-50 text-green-600 border-green-200"
                          : "bg-orange-50 text-orange-600 border-orange-200"
                      }
                    >
                      {item.status === "completed" ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {item.status === "completed" ? "Completed" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {item.status === "completed" && (
                        <>
                          <Button variant="outline" size="sm" className="h-8" onClick={() => handleWithdraw(item.amountNum)}>
                            <Wallet className="mr-1 h-3 w-3" />
                            Withdraw
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8" onClick={() => handleDownload(item.loanId)}>
                            <Download className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {item.status === "pending" && (
                        <span className="text-xs text-muted-foreground">Processing...</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        amount={selectedAmount}
      />
    </>
  );
}