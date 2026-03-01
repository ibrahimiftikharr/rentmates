import { Shield, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

const transactions = [
  {
    loanId: "LN-2847",
    txHash: "0x8f3d...a2c9",
    status: "verified",
    date: "Oct 10, 2025",
  },
  {
    loanId: "LN-2846",
    txHash: "0x7e2b...91f3",
    status: "verified",
    date: "Oct 09, 2025",
  },
  {
    loanId: "LN-2845",
    txHash: "0x6d1a...80e2",
    status: "pending",
    date: "Oct 08, 2025",
  },
];

export function BlockchainLog() {
  return (
    <Card className="border-0 shadow-2xl hover:shadow-[0_20px_50px_rgba(140,87,255,0.15)] transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Transparent Blockchain Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loan ID</TableHead>
              <TableHead>Tx Hash</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.loanId}>
                <TableCell>{tx.loanId}</TableCell>
                <TableCell className="font-mono text-sm">{tx.txHash}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      tx.status === "verified"
                        ? "bg-green-50 text-green-600 border-green-200"
                        : "bg-orange-50 text-orange-600 border-orange-200"
                    }
                  >
                    {tx.status === "verified" ? "Verified" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <button className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    Explorer
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <p className="text-xs text-muted-foreground text-center mt-3">
          All transactions are immutably recorded on Ethereum
        </p>
      </CardContent>
    </Card>
  );
}