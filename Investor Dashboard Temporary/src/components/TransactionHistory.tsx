import { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { 
  Search, 
  Download, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Calendar
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { toast } from "sonner";
import React from "react";

interface Transaction {
  id: string;
  hash: string;
  date: string;
  type: "Investment" | "Withdrawal" | "Repayment" | "Escrow" | "Interest";
  amount: number;
  status: "Completed" | "Pending" | "Failed";
  from?: string;
  to?: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    hash: "0x1a2b3c4d5e6f7g8h9i0j",
    date: "2024-02-04",
    type: "Investment",
    amount: 5000,
    status: "Completed",
    to: "Conservative Growth Pool"
  },
  {
    id: "2",
    hash: "0x9i8h7g6f5e4d3c2b1a",
    date: "2024-02-03",
    type: "Withdrawal",
    amount: 1000,
    status: "Completed",
    to: "0x742d...89Ab"
  },
  {
    id: "3",
    hash: "0xabcdef123456789",
    date: "2024-02-02",
    type: "Repayment",
    amount: 500,
    status: "Pending",
    from: "LOAN-001"
  },
  {
    id: "4",
    hash: "0x987654321fedcba",
    date: "2024-02-01",
    type: "Escrow",
    amount: 2500,
    status: "Completed",
    to: "ESCROW-045"
  },
  {
    id: "5",
    hash: "0xfedcba987654321",
    date: "2024-01-31",
    type: "Interest",
    amount: 125,
    status: "Completed",
    from: "Conservative Growth Pool"
  },
  {
    id: "6",
    hash: "0x123abc456def789",
    date: "2024-01-30",
    type: "Investment",
    amount: 3000,
    status: "Failed",
    to: "High Yield Pool"
  }
];

export function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Pending":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "Failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
      case "Pending":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Pending</Badge>;
      case "Failed":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Investment":
        return "text-blue-600 bg-blue-50";
      case "Withdrawal":
        return "text-purple-600 bg-purple-50";
      case "Repayment":
        return "text-green-600 bg-green-50";
      case "Escrow":
        return "text-orange-600 bg-orange-50";
      case "Interest":
        return "text-emerald-600 bg-emerald-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleExport = () => {
    toast.success("Export started", {
      description: "Your transaction history is being downloaded as CSV"
    });
  };

  // Filter and sort transactions
  let filteredTransactions = mockTransactions.filter((tx) => {
    const matchesSearch =
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.toString().includes(searchQuery);
    
    const matchesType = filterType === "all" || tx.type.toLowerCase() === filterType.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  // Sort transactions
  filteredTransactions.sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "date-asc":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  return (
    <Card className="shadow-lg">
      {/* Header with Search and Filters */}
      <div className="p-6 border-b space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-xl font-semibold">Transaction History</h3>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by transaction hash, amount, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Chips and Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2 items-center">
            {/* Type Filter Dropdown */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="repayment">Repayment</SelectItem>
                <SelectItem value="escrow">Escrow</SelectItem>
                <SelectItem value="interest">Interest</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="amount-desc">Amount (High)</SelectItem>
                <SelectItem value="amount-asc">Amount (Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Transaction Hash</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No transactions found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <React.Fragment key={tx.id}>
                  <TableRow className="group hover:bg-accent/50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleRow(tx.id)}
                      >
                        {expandedRows.has(tx.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Date(tx.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getTypeColor(tx.type)} border-0`}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-accent px-2 py-1 rounded">
                        {tx.hash.slice(0, 10)}...
                      </code>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${tx.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        {getStatusBadge(tx.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`https://etherscan.io/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Explorer
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          Receipt
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Row Details */}
                  {expandedRows.has(tx.id) && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-accent/30">
                        <div className="py-4 px-6 space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-muted-foreground">Transaction Hash</p>
                              <p className="font-mono text-xs">{tx.hash}</p>
                            </div>
                            {tx.from && (
                              <div>
                                <p className="text-muted-foreground">From</p>
                                <p className="font-medium">{tx.from}</p>
                              </div>
                            )}
                            {tx.to && (
                              <div>
                                <p className="text-muted-foreground">To</p>
                                <p className="font-medium">{tx.to}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground">Date & Time</p>
                              <p className="font-medium">{new Date(tx.date).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1-{filteredTransactions.length} of {mockTransactions.length} transactions
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}