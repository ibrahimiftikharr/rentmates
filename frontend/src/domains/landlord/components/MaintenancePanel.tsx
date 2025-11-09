import { Plus, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

const tickets = [
  {
    id: 1,
    property: 'Downtown Loft A',
    issue: 'Leaking faucet in kitchen',
    date: '2025-10-08',
    status: 'in-progress',
  },
  {
    id: 2,
    property: 'Riverside Apartment 3B',
    issue: 'AC not cooling properly',
    date: '2025-10-07',
    status: 'pending',
  },
  {
    id: 3,
    property: 'City Center Studio',
    issue: 'Broken window latch',
    date: '2025-10-05',
    status: 'resolved',
  },
  {
    id: 4,
    property: 'Suburban House',
    issue: 'Garage door malfunction',
    date: '2025-10-06',
    status: 'in-progress',
  },
];

export function MaintenancePanel() {
  return (
    <Card className="border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#4A4A68]">Maintenance & Condition Reports</CardTitle>
          <Button
            size="sm"
            className="bg-[#8C57FF] hover:bg-[#7C47EF]"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Issue
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>{ticket.property}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{ticket.issue}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(ticket.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      ticket.status === 'resolved'
                        ? 'bg-[#28C76F]/10 text-[#28C76F] border-0'
                        : ticket.status === 'in-progress'
                        ? 'bg-[#00CFE8]/10 text-[#00CFE8] border-0'
                        : 'bg-[#FF9F43]/10 text-[#FF9F43] border-0'
                    }
                  >
                    {ticket.status === 'in-progress' ? 'In Progress' : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                    {ticket.status !== 'resolved' && (
                      <Button
                        size="sm"
                        className="bg-[#28C76F] hover:bg-[#24B263] text-white"
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
