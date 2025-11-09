import { Shield, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const verifications = [
  {
    contract: 'Downtown Loft A - Lease Agreement',
    hash: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    timestamp: '2025-09-15T10:30:00',
    verified: true,
  },
  {
    contract: 'Riverside Apartment 3B - Lease Agreement',
    hash: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    timestamp: '2025-09-20T14:15:00',
    verified: true,
  },
  {
    contract: 'City Center Studio - Lease Agreement',
    hash: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    timestamp: '2025-10-01T09:45:00',
    verified: true,
  },
];

export function BlockchainPanel() {
  return (
    <Card className="border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#8C57FF]" />
          <CardTitle className="text-[#4A4A68]">Blockchain Verification</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {verifications.map((verification, index) => (
          <div
            key={index}
            className="p-4 bg-[#F4F5FA] rounded-xl"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm">{verification.contract}</p>
                  {verification.verified && (
                    <CheckCircle2 className="h-4 w-4 text-[#28C76F]" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {verification.hash}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Verified on {new Date(verification.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <div className="flex items-center gap-1 text-[#28C76F]">
                <Shield className="h-3 w-3" />
                <span className="text-xs">Verified</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
