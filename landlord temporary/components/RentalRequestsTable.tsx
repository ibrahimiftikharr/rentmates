import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Check, X, Shield } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

const requests = [
  {
    id: 1,
    tenantName: 'Sarah Johnson',
    property: 'Downtown Loft A',
    offer: 2800,
    status: 'pending',
    kycVerified: true,
  },
  {
    id: 2,
    tenantName: 'Michael Chen',
    property: 'Riverside Apartment 3B',
    offer: 2200,
    status: 'pending',
    kycVerified: true,
  },
  {
    id: 3,
    tenantName: 'Emma Williams',
    property: 'City Center Studio',
    offer: 1800,
    status: 'approved',
    kycVerified: true,
  },
  {
    id: 4,
    tenantName: 'James Martinez',
    property: 'Suburban House',
    offer: 3500,
    status: 'pending',
    kycVerified: false,
  },
];

export function RentalRequestsTable() {
  return (
    <Card className="border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#4A4A68]">Rental Requests</CardTitle>
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant Name</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Offer Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{request.tenantName}</span>
                    {request.kycVerified && (
                      <Shield className="h-4 w-4 text-[#28C76F]" />
                    )}
                  </div>
                </TableCell>
                <TableCell>{request.property}</TableCell>
                <TableCell>${request.offer.toLocaleString()}/mo</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      request.status === 'pending'
                        ? 'bg-[#FF9F43]/10 text-[#FF9F43] border-0'
                        : request.status === 'approved'
                        ? 'bg-[#28C76F]/10 text-[#28C76F] border-0'
                        : 'bg-[#EA5455]/10 text-[#EA5455] border-0'
                    }
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {request.status === 'pending' && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#28C76F] text-[#28C76F] hover:bg-[#28C76F] hover:text-white"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#EA5455] text-[#EA5455] hover:bg-[#EA5455] hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
