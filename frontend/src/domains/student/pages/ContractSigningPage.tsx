import { useState, useEffect } from 'react';
import { Home, DollarSign, FileSignature, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { toast } from 'sonner';
import { getStudentJoinRequests } from '@/shared/services/joinRequestService';

interface JoinRequest {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  landlordName: string;
  bidAmount: number;
  requestDate: string;
  status: string;
  moveInDate?: string;
  leaseDuration?: string;
  securityDeposit?: number;
  contractHash?: string;
}

interface ContractData {
  propertyTitle: string;
  propertyAddress: string;
  landlordName: string;
  landlordGovId: string;
  studentName: string;
  studentGovId: string;
  requestDate: string;
  monthlyRent: string;
  rentDueDay: number;
  securityDeposit: string;
  leaseDuration: string;
  leaseStartDate: string;
  leaseEndDate: string;
  moveInDate: string;
  content: string;
}

interface ContractSigningPageProps {
  request: JoinRequest;
  onBack: () => void;
  onContractSigned: (contractHash: string) => void;
}

export function ContractSigningPage({ request, onBack, onContractSigned }: ContractSigningPageProps) {
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [showGasFeeDialog, setShowGasFeeDialog] = useState(false);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContractData();
  }, [request.id]);

  const fetchContractData = async () => {
    try {
      setLoading(true);
      const response = await getStudentJoinRequests();
      const joinRequest = response.joinRequests.find((r: any) => r._id === request.id);
      
      if (joinRequest && joinRequest.contract) {
        setContractData({
          propertyTitle: joinRequest.contract.propertyTitle,
          propertyAddress: joinRequest.contract.propertyAddress,
          landlordName: joinRequest.contract.landlordName,
          landlordGovId: joinRequest.contract.landlordGovId,
          studentName: joinRequest.contract.studentName,
          studentGovId: joinRequest.contract.studentGovId,
          requestDate: joinRequest.contract.requestDate,
          monthlyRent: joinRequest.contract.monthlyRent,
          rentDueDay: joinRequest.contract.rentDueDay,
          securityDeposit: joinRequest.contract.securityDeposit,
          leaseDuration: joinRequest.contract.leaseDuration,
          leaseStartDate: joinRequest.contract.leaseStartDate,
          leaseEndDate: joinRequest.contract.leaseEndDate,
          moveInDate: joinRequest.contract.moveInDate,
          content: joinRequest.contract.content
        });
      }
    } catch (error) {
      console.error('Failed to fetch contract data:', error);
      toast.error('Failed to load contract data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignClick = () => {
    if (!agreeToTerms) return;
    setShowGasFeeDialog(true);
  };

  const handleConfirmSign = async () => {
    setShowGasFeeDialog(false);
    setIsSigning(true);

    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2500));

    const contractHash = '0x' + Math.random().toString(16).substring(2, 42);
    
    setIsSigning(false);
    toast.success('Contract signed successfully! Waiting for landlord signature.');
    
    onContractSigned(contractHash);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="mb-2">Sign Rental Contract</h1>
            <p className="text-muted-foreground">Loading contract...</p>
          </div>
        </div>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading contract data...</p>
        </Card>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="mb-2">Sign Rental Contract</h1>
            <p className="text-muted-foreground text-red-600">Contract not found</p>
          </div>
        </div>
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
          <p className="text-muted-foreground">Contract data not available. Please contact support.</p>
        </Card>
      </div>
    );
  }

  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="mb-2">Sign Rental Contract</h1>
          <p className="text-muted-foreground">
            Review and Sign the Smart Contract
          </p>
        </div>
      </div>

      {/* Property Overview Card */}
      <Card className="shadow-md border bg-slate-50">
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="mb-1 text-primary">Property: {contractData.propertyTitle}</h2>
                <p className="text-muted-foreground">Address: {contractData.propertyAddress}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-primary/20">
              <div>
                <span className="text-muted-foreground text-sm">Landlord:</span>
                <p className="font-medium">{contractData.landlordName} — Government Issued ID: {contractData.landlordGovId}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Tenant:</span>
                <p className="font-medium">{contractData.studentName} — Government Issued ID: {contractData.studentGovId}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Request Date:</span>
                <p className="font-medium">{contractData.requestDate}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Terms Section */}
      <div>
        <h2 className="mb-4 pb-2 border-b-2 border-primary text-primary">Financial Terms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-md border">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Monthly Rent</p>
              <p className="text-3xl font-semibold mb-1">${contractData.monthlyRent}</p>
              <p className="text-xs text-muted-foreground">Due Date: {contractData.rentDueDay}{getDaySuffix(contractData.rentDueDay)} of each month</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Security Deposit</p>
              <p className="text-3xl font-semibold mb-1">${contractData.securityDeposit}</p>
              <p className="text-xs text-muted-foreground">Held securely in blockchain escrow</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Lease Duration</p>
              <p className="text-2xl font-semibold mb-1">{contractData.leaseDuration}</p>
              <p className="text-xs text-muted-foreground">{contractData.leaseStartDate.split(',')[0]} – {contractData.leaseEndDate.split(',')[0]}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Move-in Date</p>
              <p className="text-xl font-semibold mb-1">{contractData.moveInDate.split(',')[0]}</p>
              <p className="text-xs text-muted-foreground">Scheduled occupancy</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contract Terms Section */}
      <div>
        <h2 className="mb-4 pb-2 border-b-2 border-primary text-primary">Terms and Conditions</h2>
        <Card className="shadow-md border">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Term 1 */}
              <div className="border-l-4 border-primary/40 pl-6 py-2">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <span className="font-semibold text-primary">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Rent Payments</h3>
                    <p className="text-muted-foreground">
                      The tenant agrees to pay the monthly rent of <span className="font-semibold">${contractData.monthlyRent}</span> on the <span className="font-semibold">{contractData.rentDueDay}{getDaySuffix(contractData.rentDueDay)} day of each month</span> via the platform's blockchain payment system.
                    </p>
                    <p className="text-muted-foreground mt-2">
                      All rents are paid in advance for every month.
                    </p>
                  </div>
                </div>
              </div>

              {/* Term 2 */}
              <div className="border-l-4 border-primary/40 pl-6 py-2">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <span className="font-semibold text-primary">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Security Deposit Escrow</h3>
                    <p className="text-muted-foreground">
                      A security deposit of <span className="font-semibold">${contractData.securityDeposit}</span> is required and will be held in an on-chain escrow smart contract for the entire lease period.
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Funds remain locked and non-withdrawable by either party until the lease ends or a verified termination event occurs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Term 3 */}
              <div className="border-l-4 border-primary/40 pl-6 py-2">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <span className="font-semibold text-primary">3</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Lease Commencement</h3>
                    <p className="text-muted-foreground">
                      The lease term begins on <span className="font-semibold">{contractData.moveInDate.split(',')[0]}</span>.
                    </p>
                    <p className="text-muted-foreground mt-2">
                      The tenant must pay the security deposit within <span className="font-semibold">7 days</span> after both parties have signed this contract.
                    </p>
                    <p className="text-muted-foreground mt-2">
                      The tenant must then pay the first month's rent after <span className="font-semibold">3 days of moving in</span> (to protect the tenant from fraudulent property description).
                    </p>
                  </div>
                </div>
              </div>

              {/* Term 4 */}
              <div className="border-l-4 border-primary/40 pl-6 py-2">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <span className="font-semibold text-primary">4</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Tenant Responsibilities</h3>
                    <p className="text-muted-foreground">
                      The tenant shall maintain the property in good condition and promptly report any damages or maintenance issues via the platform.
                    </p>
                  </div>
                </div>
              </div>

              {/* Term 5 */}
              <div className="border-l-4 border-primary/40 pl-6 py-2">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <span className="font-semibold text-primary">5</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Landlord Responsibilities</h3>
                    <p className="text-muted-foreground">
                      The landlord must ensure the property condition and listing details are accurate at move-in.
                    </p>
                    <p className="text-muted-foreground mt-2">
                      If fraudulent or misrepresented conditions are found, the tenant may cancel before or within <span className="font-semibold">3 days of move-in</span> and claim a full refund of the security deposit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Term 6 */}
              <div className="border-l-4 border-primary/40 pl-6 py-2">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <span className="font-semibold text-primary">6</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Lease Termination and Deposit Refund</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-foreground">• Normal Completion:</p>
                        <p className="text-muted-foreground ml-4">
                          After the lease ends, the security deposit remains locked for up to <span className="font-semibold">7 days</span> for verification.
                        </p>
                        <p className="text-muted-foreground ml-4 mt-1">
                          ◦ If landlord marks "Okay" → Immediate refund.
                        </p>
                        <p className="text-muted-foreground ml-4">
                          ◦ If no response in 7 days → Auto-refund in full.
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">• Early Termination:</p>
                        <p className="text-muted-foreground ml-4">
                          Either party may terminate early with <span className="font-semibold">60 days' notice</span>.
                        </p>
                        <p className="text-muted-foreground ml-4">
                          Deposit remains in 60-day hold for dispute resolution.
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">• Student Withdrawal Before Move-in:</p>
                        <p className="text-muted-foreground ml-4">
                          In cases of visa rejection, travel cancellation, or property fraud, tenant may cancel before move-in.
                        </p>
                        <p className="text-muted-foreground ml-4 mt-1">
                          ◦ If rent not paid → Full refund.
                        </p>
                        <p className="text-muted-foreground ml-4">
                          ◦ If rent paid → Funds held 60 days before resolution and refund.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Term 7 */}
              <div className="border-l-4 border-primary/40 pl-6 py-2">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <span className="font-semibold text-primary">7</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Inspections & Utilities</h3>
                    <p className="text-muted-foreground">
                      The landlord may request an inspection with <span className="font-semibold">24-hour prior notice</span>.
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Utility and maintenance terms follow the original listing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Term 8 */}
              <div className="border-l-4 border-primary/40 pl-6 py-2">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <span className="font-semibold text-primary">8</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Dispute Resolution</h3>
                    <p className="text-muted-foreground">
                      All conflicts are resolved through the platform's blockchain arbitration mechanism with neutral mediation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Term 9 */}
              <div className="border-l-4 border-primary/40 pl-6 py-2">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <span className="font-semibold text-primary">9</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Smart Contract Finality</h3>
                    <p className="text-muted-foreground">
                      Once both parties digitally sign, the smart contract becomes immutable and fully enforceable.
                    </p>
                    <p className="text-muted-foreground mt-2">
                      All actions — deposits, payments, terminations, and refunds — are recorded transparently on-chain.
                    </p>
                  </div>
                </div>
              </div>

              {/* Term 10 */}
              <div className="border-l-4 border-primary/40 pl-6 py-2">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                    <span className="font-semibold text-primary">10</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-primary">Legal Binding</h3>
                    <p className="text-muted-foreground">
                      Both parties acknowledge this is a legally binding blockchain-registered agreement under applicable rental and digital contract laws.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blockchain Smart Contract Summary */}
      <Card className="shadow-md border bg-slate-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <FileSignature className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="mb-3 pb-2 border-b border-primary/20 text-primary">Blockchain Smart Contract Summary</h3>
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>All funds and events recorded immutably on the blockchain.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Once signed, contract terms cannot be changed.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p>Every deposit, payment, and refund is publicly verifiable.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secure & Transparent Agreement */}
      <Card className="shadow-md border bg-slate-50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/20">
              <FileSignature className="w-5 h-5 text-primary" />
              <h3 className="text-primary">Secure & Transparent</h3>
            </div>
            <div className="flex items-start space-x-4">
              <Checkbox
                id="agree-terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                className="mt-1 border-2"
              />
              <label
                htmlFor="agree-terms"
                className="flex-1 cursor-pointer leading-relaxed"
              >
                <span className="font-semibold">By proceeding, I confirm that I have read and understood all terms and conditions.</span>
                <br />
                I agree to be bound by this blockchain-registered smart contract.
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pb-8">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={isSigning}
          className="min-w-32"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleSignClick}
          disabled={!agreeToTerms || isSigning}
          className="flex-1 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
        >
          {isSigning ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Signing Contract via Wallet...
            </>
          ) : (
            <>
              <FileSignature className="w-5 h-5 mr-2" />
              Sign Contract Now
            </>
          )}
        </Button>
      </div>

      {/* Contract Confirmation Dialog */}
      <Dialog open={showGasFeeDialog} onOpenChange={setShowGasFeeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-primary" />
              Confirm Contract Signing
            </DialogTitle>
            <DialogDescription>
              Please confirm that you want to proceed with signing this contract
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Legal Agreement</p>
                    <p className="text-sm text-muted-foreground">
                      By signing, you are entering into a legally binding rental agreement for {contractData.propertyTitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Blockchain Registration</p>
                    <p className="text-sm text-muted-foreground">
                      This contract will be recorded on the blockchain and cannot be modified after signing
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Financial Commitment</p>
                    <p className="text-sm text-muted-foreground">
                      You agree to pay ${contractData.monthlyRent} monthly rent and ${contractData.securityDeposit} security deposit as specified
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowGasFeeDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSign}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              <FileSignature className="w-4 h-4 mr-2" />
              Confirm & Sign Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
