import { FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';

const contracts = [
  {
    id: 1,
    property: 'Downtown Loft A',
    tenant: 'Sarah Johnson',
    status: 'signed',
    hash: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  },
  {
    id: 2,
    property: 'Riverside Apartment 3B',
    tenant: 'Michael Chen',
    status: 'pending',
    hash: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
  },
  {
    id: 3,
    property: 'City Center Studio',
    tenant: 'Emma Williams',
    status: 'signed',
    hash: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  },
];

export function SmartContractPanel() {
  return (
    <Card className="border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-[#4A4A68]">Smart Contracts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-[#F4F5FA] rounded-xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#8C57FF] rounded-lg">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm">Auto Rent Payment</span>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="space-y-3">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-[#8C57FF] transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm">{contract.property}</p>
                  <Badge
                    variant="secondary"
                    className={
                      contract.status === 'signed'
                        ? 'bg-[#28C76F]/10 text-[#28C76F] border-0'
                        : 'bg-[#FF9F43]/10 text-[#FF9F43] border-0'
                    }
                  >
                    {contract.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{contract.tenant}</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {contract.hash.slice(0, 20)}...
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-[#8C57FF] text-[#8C57FF] hover:bg-[#8C57FF] hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
