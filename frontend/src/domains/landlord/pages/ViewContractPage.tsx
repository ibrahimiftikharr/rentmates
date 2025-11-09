import { useState } from 'react';
import { ChevronLeft, FileText, Download, Shield, Wallet, Loader2, Building, User, Calendar, DollarSign, Clock, FileSignature } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Checkbox } from '@/shared/ui/checkbox';

interface ViewContractPageProps {
  contractId: string;
  onNavigate: (page: string) => void;
}

// Mock contract data - maps contractId to contract details
const MOCK_CONTRACTS: Record<string, any> = {
  'CONTRACT-001': {
    id: 'CONTRACT-001',
    propertyName: 'Modern Student Apartment',
    propertyAddress: '123 University Ave, Boston, MA',
    landlordName: 'John Smith',
    landlordId: '3410625622826',
    tenantName: 'Sara Johns',
    tenantId: '3410625622826',
    requestDate: '2025-11-01',
    signedDate: '2025-11-08',
    monthlyRent: '1200',
    dueDate: '1st',
    securityDeposit: '1200',
    leaseDuration: '12',
    moveInDate: '2025-12-01',
    contractPeriod: 'Dec 1, 2025 – Nov 30, 2026',
    blockchainHash: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
    status: 'pending',
  },
  'CONTRACT-002': {
    id: 'CONTRACT-002',
    propertyName: 'Modern Student Apartment',
    propertyAddress: '123 University Ave, Boston, MA',
    landlordName: 'John Smith',
    landlordId: '3410625622826',
    tenantName: 'Michael Chen',
    tenantId: '3410625622826',
    requestDate: '2025-11-01',
    signedDate: '2025-11-08',
    monthlyRent: '1200',
    dueDate: '1st',
    securityDeposit: '1200',
    leaseDuration: '12',
    moveInDate: '2025-12-01',
    contractPeriod: 'Dec 1, 2025 – Nov 30, 2026',
    blockchainHash: '0x8a0fade2d1e68b8bg77bc5bfbe80gade2d1e68b8bg77bc5bfbe8d3d3fc8c22b02496',
    status: 'pending',
  },
  'CONTRACT-003': {
    id: 'CONTRACT-003',
    propertyName: 'Modern Student Apartment',
    propertyAddress: '123 University Ave, Boston, MA',
    landlordName: 'John Smith',
    landlordId: '3410625622826',
    tenantName: 'Sarah Johnson',
    tenantId: '3410625622826',
    requestDate: '2025-11-01',
    signedDate: '2025-11-05',
    monthlyRent: '1200',
    dueDate: '1st',
    securityDeposit: '1200',
    leaseDuration: '12',
    moveInDate: '2025-12-01',
    contractPeriod: 'Dec 1, 2025 – Nov 30, 2026',
    blockchainHash: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
    status: 'active',
  }
};

export function ViewContractPage({ contractId, onNavigate }: ViewContractPageProps) {
  // Get contract data or use default
  const contract = MOCK_CONTRACTS[contractId] || MOCK_CONTRACTS['CONTRACT-001'];
  
  // CONTRACT-003 is the pre-existing fully signed contract
  // Other contract IDs (CONTRACT-001, CONTRACT-002) are newly approved and pending signatures
  const isFullySigned = contractId === 'CONTRACT-003';
  
  const [studentSigned, setStudentSigned] = useState(isFullySigned);
  const [landlordSigned, setLandlordSigned] = useState(isFullySigned);
  const [showGasFeeModal, setShowGasFeeModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleDownload = () => {
    // In real implementation, this would generate and download a PDF
    console.log('Downloading contract:', contractId);
  };

  // Simulate student signing (for demo purposes)
  const handleStudentSign = () => {
    setStudentSigned(true);
  };

  const handleLandlordSignClick = () => {
    if (!studentSigned || !termsAccepted) return; // Button is disabled
    setShowGasFeeModal(true);
  };

  const handleConfirmSign = async () => {
    setShowGasFeeModal(false);
    setIsSigning(true);
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setLandlordSigned(true);
    setIsSigning(false);
  };

  const allSigned = studentSigned && landlordSigned;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => onNavigate('join-requests')}
        className="flex items-center text-muted-foreground hover:text-[#8C57FF] mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Join Requests
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-[#8C57FF]" />
              <h1 className="text-[#4A4A68]">Smart Rental Contract</h1>
            </div>
            <p className="text-muted-foreground">Review and Sign the Smart Contract</p>
            <p className="text-sm text-muted-foreground mt-1">Contract ID: {contract.id}</p>
          </div>

          <div className="flex gap-2">
            <Badge className={allSigned 
              ? "bg-green-500/10 text-green-700 border-green-200"
              : "bg-yellow-500/10 text-yellow-700 border-yellow-200"
            }>
              {allSigned ? 'Fully Signed' : 'Awaiting Signatures'}
            </Badge>
            {allSigned && (
              <Badge className="bg-[#8C57FF]/10 text-[#8C57FF] border-[#8C57FF]/20">
                🟢 Blockchain Verified
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Blockchain Info */}
      {allSigned && (
        <Card className="p-6 mb-6 shadow-lg bg-[#8C57FF]/5 border-[#8C57FF]/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#8C57FF]/10 rounded-lg">
              <Shield className="h-6 w-6 text-[#8C57FF]" />
            </div>
            <div className="flex-1">
              <h3 className="text-[#8C57FF] mb-2">Blockchain Certification</h3>
              <p className="text-sm text-muted-foreground mb-2">
                This contract has been immutably recorded on the blockchain and cannot be altered.
              </p>
              <div className="bg-white/50 rounded p-3 break-all">
                <p className="text-xs text-muted-foreground mb-1">Transaction Hash:</p>
                <p className="text-xs text-[#4A4A68] font-mono">{contract.blockchainHash}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Contract Details Section Title */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-[#8C57FF]">Contract Details</h2>
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Property Information Card */}
      <Card className="p-6 mb-4 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Building className="h-5 w-5 text-[#8C57FF]" />
          <h3 className="text-[#8C57FF]">Property Information</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex">
            <span className="text-muted-foreground w-32">Property:</span>
            <span className="text-[#4A4A68]">{contract.propertyName}</span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-32">Address:</span>
            <span className="text-[#4A4A68]">{contract.propertyAddress}</span>
          </div>
        </div>
      </Card>

      {/* Parties Information Card */}
      <Card className="p-6 mb-4 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-[#8C57FF]" />
          <h3 className="text-[#8C57FF]">Parties</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex">
            <span className="text-muted-foreground w-32">Landlord:</span>
            <span className="text-[#4A4A68]">{contract.landlordName} — Government Issued ID: {contract.landlordId}</span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-32">Tenant:</span>
            <span className="text-[#4A4A68]">{contract.tenantName} — Government Issued ID: {contract.tenantId}</span>
          </div>
        </div>
      </Card>

      {/* Financial Terms Card */}
      <Card className="p-6 mb-4 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-[#8C57FF]" />
          <h3 className="text-[#8C57FF]">Financial Terms</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex mb-2">
              <span className="text-muted-foreground w-40">Monthly Rent:</span>
              <span className="text-[#4A4A68]">${contract.monthlyRent}</span>
            </div>
            <div className="flex mb-2">
              <span className="text-muted-foreground w-40">Due Date:</span>
              <span className="text-[#4A4A68]">{contract.dueDate} of each month</span>
            </div>
          </div>
          <div>
            <div className="flex mb-2">
              <span className="text-muted-foreground w-40">Security Deposit:</span>
              <span className="text-[#4A4A68]">${contract.securityDeposit}</span>
            </div>
            <div className="flex mb-2">
              <span className="text-muted-foreground w-40">Deposit Type:</span>
              <span className="text-[#4A4A68]">Blockchain Escrow</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Lease Period Card */}
      <Card className="p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-[#8C57FF]" />
          <h3 className="text-[#8C57FF]">Lease Period</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex">
            <span className="text-muted-foreground w-40">Request Date:</span>
            <span className="text-[#4A4A68]">
              {new Date(contract.requestDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-40">Lease Duration:</span>
            <span className="text-[#4A4A68]">{contract.leaseDuration} months</span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-40">Contract Period:</span>
            <span className="text-[#4A4A68]">{contract.contractPeriod}</span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-40">Move-in Date:</span>
            <span className="text-[#4A4A68]">Dec 1, 2025</span>
          </div>
        </div>
      </Card>

      {/* Terms and Conditions */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-6">
          <FileSignature className="h-6 w-6 text-[#8C57FF]" />
          <h2 className="text-xl text-[#8C57FF]">Terms and Conditions</h2>
        </div>

        <div className="space-y-4">
          {/* Term 1 */}
          <Card className="p-6 shadow-md">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8C57FF]/10 flex items-center justify-center">
                <span className="text-[#8C57FF]">1</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[#4A4A68] mb-3">Rent Payments</h4>
                <div className="space-y-2 text-sm text-[#4A4A68]">
                  <p>The tenant agrees to pay the monthly rent of $1200 on the 8th day of each month via the platform's blockchain payment system.</p>
                  <p>A maximum payment delay of 5 days is allowed (i.e., the 13th day is the final due date).</p>
                  <p>All rents are paid in advance for every month.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Term 2 */}
          <Card className="p-6 shadow-md">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8C57FF]/10 flex items-center justify-center">
                <span className="text-[#8C57FF]">2</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[#4A4A68] mb-3">Security Deposit Escrow</h4>
                <div className="space-y-2 text-sm text-[#4A4A68]">
                  <p>A security deposit of $1200 is required and will be held in an on-chain escrow smart contract for the entire lease period.</p>
                  <p>Funds remain locked and non-withdrawable by either party until the lease ends or a verified termination event occurs.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Term 3 */}
          <Card className="p-6 shadow-md">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8C57FF]/10 flex items-center justify-center">
                <span className="text-[#8C57FF]">3</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[#4A4A68] mb-3">Lease Commencement</h4>
                <div className="space-y-2 text-sm text-[#4A4A68]">
                  <p>The lease term begins on Dec 1, 2025.</p>
                  <p>The tenant must pay the security deposit within 7 days after both parties have signed this contract.</p>
                  <p>The tenant must then pay the first month's rent after 3 days of moving in (to protect the tenant from fraudulent property description).</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Term 4 */}
          <Card className="p-6 shadow-md">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8C57FF]/10 flex items-center justify-center">
                <span className="text-[#8C57FF]">4</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[#4A4A68] mb-3">Tenant Responsibilities</h4>
                <div className="space-y-2 text-sm text-[#4A4A68]">
                  <p>The tenant shall maintain the property in good condition and promptly report any damages or maintenance issues via the platform.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Term 5 */}
          <Card className="p-6 shadow-md">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8C57FF]/10 flex items-center justify-center">
                <span className="text-[#8C57FF]">5</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[#4A4A68] mb-3">Landlord Responsibilities</h4>
                <div className="space-y-2 text-sm text-[#4A4A68]">
                  <p>The landlord must ensure the property condition and listing details are accurate at move-in.</p>
                  <p>If fraudulent or misrepresented conditions are found, the tenant may cancel before or within 3 days of move-in and claim a full refund of the security deposit.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Term 6 */}
          <Card className="p-6 shadow-md">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8C57FF]/10 flex items-center justify-center">
                <span className="text-[#8C57FF]">6</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[#4A4A68] mb-3">Lease Termination and Deposit Refund</h4>
                <div className="space-y-3 text-sm text-[#4A4A68]">
                  <div className="pl-4 border-l-2 border-[#8C57FF]/20">
                    <p className="mb-2"><strong>Normal Completion:</strong></p>
                    <p className="mb-1">After the lease ends, the security deposit remains locked for up to 7 days for verification.</p>
                    <p className="pl-4 mb-1">• If landlord marks "Okay" → Immediate refund.</p>
                    <p className="pl-4">• If no response in 7 days → Auto-refund in full.</p>
                  </div>
                  <div className="pl-4 border-l-2 border-[#8C57FF]/20">
                    <p className="mb-2"><strong>Early Termination:</strong></p>
                    <p className="mb-1">Either party may terminate early with 60 days' notice.</p>
                    <p>Deposit remains in 60-day hold for dispute resolution.</p>
                  </div>
                  <div className="pl-4 border-l-2 border-[#8C57FF]/20">
                    <p className="mb-2"><strong>Student Withdrawal Before Move-in:</strong></p>
                    <p className="mb-1">In cases of visa rejection, travel cancellation, or property fraud, tenant may cancel before move-in.</p>
                    <p className="pl-4 mb-1">• If rent not paid → Full refund.</p>
                    <p className="pl-4">• If rent paid → Funds held 60 days before resolution and refund.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Term 7 */}
          <Card className="p-6 shadow-md">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8C57FF]/10 flex items-center justify-center">
                <span className="text-[#8C57FF]">7</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[#4A4A68] mb-3">Inspections & Utilities</h4>
                <div className="space-y-2 text-sm text-[#4A4A68]">
                  <p>The landlord may request an inspection with 24-hour prior notice.</p>
                  <p>Utility and maintenance terms follow the original listing.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Term 8 */}
          <Card className="p-6 shadow-md">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8C57FF]/10 flex items-center justify-center">
                <span className="text-[#8C57FF]">8</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[#4A4A68] mb-3">Dispute Resolution</h4>
                <div className="space-y-2 text-sm text-[#4A4A68]">
                  <p>All conflicts are resolved through the platform's blockchain arbitration mechanism with neutral mediation.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Term 9 */}
          <Card className="p-6 shadow-md">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8C57FF]/10 flex items-center justify-center">
                <span className="text-[#8C57FF]">9</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[#4A4A68] mb-3">Smart Contract Finality</h4>
                <div className="space-y-2 text-sm text-[#4A4A68]">
                  <p>Once both parties digitally sign, the smart contract becomes immutable and fully enforceable.</p>
                  <p>All actions — deposits, payments, terminations, and refunds — are recorded transparently on-chain.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Term 10 */}
          <Card className="p-6 shadow-md">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8C57FF]/10 flex items-center justify-center">
                <span className="text-[#8C57FF]">10</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[#4A4A68] mb-3">Legal Binding</h4>
                <div className="space-y-2 text-sm text-[#4A4A68]">
                  <p>Both parties acknowledge this is a legally binding blockchain-registered agreement under applicable rental and digital contract laws.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Blockchain Smart Contract Summary */}
      <Card className="p-6 mb-6 shadow-lg bg-[#8C57FF]/5 border-[#8C57FF]/20">
        <h3 className="text-[#8C57FF] mb-4">Blockchain Smart Contract Summary</h3>
        <div className="space-y-2 text-sm text-[#4A4A68]">
          <div className="flex items-start gap-2">
            <span className="text-[#8C57FF] mt-1">•</span>
            <p>All funds and events recorded immutably on the blockchain.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#8C57FF] mt-1">•</span>
            <p>Once signed, contract terms cannot be changed.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#8C57FF] mt-1">•</span>
            <p>Every deposit, payment, and refund is publicly verifiable.</p>
          </div>
        </div>
      </Card>

      {/* Secure & Transparent */}
      <Card className="p-6 mb-6 shadow-lg bg-gradient-to-br from-[#8C57FF]/10 to-[#8C57FF]/5 border-[#8C57FF]/30">
        <h3 className="text-[#8C57FF] mb-4">Secure & Transparent</h3>
        <div className="space-y-4 text-sm text-[#4A4A68]">
          <p>By proceeding, I confirm that I have read and understood all terms and conditions.</p>
          <p>I agree to be bound by this blockchain-registered smart contract.</p>
          
          {!allSigned && (
            <div className="pt-2 border-t border-[#8C57FF]/20">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms-accept"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  className="mt-1"
                />
                <label
                  htmlFor="terms-accept"
                  className="text-sm text-[#4A4A68] cursor-pointer leading-relaxed"
                >
                  I have read and agree to all terms and conditions outlined in this rental agreement. 
                  I understand that this contract will be recorded on the blockchain and cannot be modified after signing.
                </label>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Sign with Wallet Button */}
      {!allSigned && (
        <Card className="p-6 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            {!studentSigned && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Demo: Simulate student signing the contract
                </p>
                <Button
                  onClick={handleStudentSign}
                  variant="outline"
                  className="border-[#8C57FF] text-[#8C57FF] hover:bg-[#8C57FF]/10"
                >
                  Simulate Student Signature
                </Button>
              </div>
            )}

            <div className="w-full border-t pt-4">
              <Button
                onClick={handleLandlordSignClick}
                disabled={!studentSigned || !termsAccepted || isSigning}
                className={`w-full ${
                  !studentSigned || !termsAccepted || isSigning
                    ? 'bg-gray-300 cursor-not-allowed hover:bg-gray-300'
                    : 'bg-[#8C57FF] hover:bg-[#7645E8]'
                }`}
              >
                {isSigning ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Signing Contract...
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5 mr-2" />
                    Sign with Wallet
                  </>
                )}
              </Button>
              
              {!studentSigned && (
                <p className="text-xs text-muted-foreground text-center mt-3 italic">
                  Awaiting student signature — you can sign once the student has signed the contract.
                </p>
              )}
              
              {studentSigned && !termsAccepted && (
                <p className="text-xs text-yellow-600 text-center mt-3">
                  ⚠️ Please accept the terms and conditions to proceed with signing.
                </p>
              )}
              
              {studentSigned && termsAccepted && !landlordSigned && (
                <p className="text-xs text-green-600 text-center mt-3">
                  ✓ Student has signed and terms accepted. You can now sign the contract.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Gas Fee Confirmation Modal */}
      {showGasFeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-[#8C57FF]" />
              <h3 className="text-[#4A4A68]">Blockchain Signing Fee Notice</h3>
            </div>
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  A $3 gas fee will be automatically deducted from your connected wallet to complete this on-chain signing process.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                This transaction will deploy the rental agreement as an immutable smart contract. Once signed, the contract cannot be modified.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowGasFeeModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#8C57FF] hover:bg-[#7645E8]"
                onClick={handleConfirmSign}
              >
                Confirm & Sign
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Success Message */}
      {allSigned && (
        <Card className="p-6 shadow-lg bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-full">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-green-800">Contract Successfully Signed!</h3>
              <p className="text-sm text-green-700">
                This contract has been deployed to the blockchain and is now active.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Bottom Back Button */}
      <div className="mt-8 pt-6 border-t">
        <Button
          onClick={() => onNavigate('join-requests')}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Go Back to Join Requests
        </Button>
      </div>
    </div>
  );
}
