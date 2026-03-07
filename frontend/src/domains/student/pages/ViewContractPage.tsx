import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, FileSignature, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Shield, ExternalLink, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/utils/toast';
import { getStudentJoinRequests } from '@/shared/services/joinRequestService';

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
  studentSignature?: {
    signed: boolean;
    signedAt?: Date;
    signature?: string;
  };
  landlordSignature?: {
    signed: boolean;
    signedAt?: Date;
    signature?: string;
  };
  blockchainVerification?: {
    contractHash?: string;
    ipfsCID?: string;
    transactionHash?: string;
    blockchainContractId?: number;
    verifiedAt?: Date;
    blockchainNetwork?: string;
    gatewayUrl?: string;
  };
}

export function ViewContractPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchContractData();
    }
  }, [id]);

  const fetchContractData = async () => {
    try {
      setLoading(true);
      const response = await getStudentJoinRequests();
      const joinRequest = response.joinRequests.find((r: any) => r._id === id);
      
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
          content: joinRequest.contract.content,
          studentSignature: joinRequest.contract.studentSignature,
          landlordSignature: joinRequest.contract.landlordSignature,
          blockchainVerification: joinRequest.contract.blockchainVerification
        });
      }
    } catch (error) {
      console.error('Failed to fetch contract data:', error);
      toast.error('Failed to load contract data');
    } finally {
      setLoading(false);
    }
  };

  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const getBlockchainExplorerUrl = (txHash: string, network: string = 'amoy') => {
    if (network === 'amoy' || network === 'polygon-amoy') {
      return `https://amoy.polygonscan.com/tx/${txHash}`;
    }
    return `https://polygonscan.com/tx/${txHash}`;
  };

  const getIPFSGatewayUrl = (cid: string) => {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading contract data...</p>
        </div>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
          <p className="text-muted-foreground">Contract data not available. Please contact support.</p>
          <Button
            variant="outline"
            onClick={() => navigate('/student/join-requests')}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Join Requests
          </Button>
        </div>
      </div>
    );
  }

  const studentSigned = contractData?.studentSignature?.signed || false;
  const landlordSigned = contractData?.landlordSignature?.signed || false;
  const bothSigned = studentSigned && landlordSigned;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/student/join-requests')}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold mb-2">Rental Contract</h1>
          <p className="text-muted-foreground">
            {bothSigned ? 'Contract Active - Agreement Completed' : 'Contract Review'}
          </p>
        </div>
      </div>

      {/* Contract Status Banner */}
      {bothSigned && (
        <Card className="shadow-md border bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-800 text-lg">Contract Successfully Signed!</p>
                <p className="text-sm text-green-700">This contract has been deployed to the blockchain and is now active. The rental agreement is fully executed.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blockchain Verification Section */}
      {bothSigned && contractData.blockchainVerification && (
        <Card className="shadow-lg border-2 border-primary/30">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-full">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">Blockchain Verification</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This contract is immutably recorded on the blockchain and stored on IPFS
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Details */}
            <div className="p-6 space-y-4">
              {/* Verification Status */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">✓ Verified on Blockchain</span>
                </div>
                <p className="text-sm text-green-700 mt-1 ml-7">
                  Contract authenticity confirmed on {contractData.blockchainVerification.blockchainNetwork?.toUpperCase() || 'Polygon'} Network
                </p>
              </div>

              {/* Transaction Hash */}
              {contractData.blockchainVerification.transactionHash && (
                <div className="border border-gray-200 rounded-lg p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Transaction Hash</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono break-all text-gray-800 block">
                        {contractData.blockchainVerification.transactionHash}
                      </code>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(contractData.blockchainVerification!.transactionHash!, 'txHash')}
                        className="h-8 w-8 p-0"
                      >
                        {copiedField === 'txHash' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getBlockchainExplorerUrl(contractData.blockchainVerification!.transactionHash!, contractData.blockchainVerification!.blockchainNetwork), '_blank')}
                        className="h-8 px-3"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* IPFS Link */}
              {contractData.blockchainVerification.ipfsCID && (
                <div className="border border-gray-200 rounded-lg p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 mb-1">IPFS Document Link</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono break-all text-gray-800 block">
                        {contractData.blockchainVerification.ipfsCID}
                      </code>
                      <p className="text-xs text-muted-foreground mt-2">
                        Click to view or download the verified contract document from IPFS
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(contractData.blockchainVerification!.ipfsCID!, 'ipfs')}
                        className="h-8 w-8 p-0"
                      >
                        {copiedField === 'ipfs' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getIPFSGatewayUrl(contractData.blockchainVerification!.ipfsCID!), '_blank')}
                        className="h-8 px-3"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View PDF
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Contract Hash */}
              {contractData.blockchainVerification.contractHash && (
                <div className="border border-gray-200 rounded-lg p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Contract Hash (SHA-256)</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono break-all text-gray-800 block">
                        {contractData.blockchainVerification.contractHash}
                      </code>
                      <p className="text-xs text-muted-foreground mt-2">
                        Use this hash to verify document authenticity
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(contractData.blockchainVerification!.contractHash!, 'hash')}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      {copiedField === 'hash' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Verification Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">How to Verify:</p>
                <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                  <li>Click the IPFS link to download the contract document</li>
                  <li>Calculate the SHA-256 hash of the downloaded file</li>
                  <li>Compare your hash with the Contract Hash shown above</li>
                  <li>If they match, the document is authentic and unmodified</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Property Overview Card */}
      <Card className="shadow-md border bg-slate-50">
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1 text-primary">{contractData.propertyTitle}</h2>
                <p className="text-muted-foreground">{contractData.propertyAddress}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-primary/20">
              <div>
                <span className="text-muted-foreground text-sm">Landlord:</span>
                <p className="font-medium">{contractData.landlordName}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Tenant:</span>
                <p className="font-medium">{contractData.studentName}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Terms Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-primary text-primary">Financial Terms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-md border">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Monthly Rent</p>
              <p className="text-3xl font-semibold mb-1">${contractData.monthlyRent}</p>
              <p className="text-xs text-muted-foreground">Due: {contractData.rentDueDay}{getDaySuffix(contractData.rentDueDay)} of month</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Security Deposit</p>
              <p className="text-3xl font-semibold mb-1">${contractData.securityDeposit}</p>
              <p className="text-xs text-muted-foreground">Blockchain escrow</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Lease Duration</p>
              <p className="text-2xl font-semibold mb-1">{contractData.leaseDuration}</p>
              <p className="text-xs text-muted-foreground">{contractData.leaseStartDate} – {contractData.leaseEndDate}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Move-in Date</p>
              <p className="text-xl font-semibold mb-1">{contractData.moveInDate}</p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contract Content */}
      <div>
        <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-primary text-primary">Contract Agreement</h2>
        <Card className="shadow-md border">
          <CardContent className="p-8">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                {contractData.content}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signature Status */}
      <Card className="shadow-md border">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Signature Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${studentSigned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border-2`}>
              <div className="flex items-center gap-2 mb-2">
                {studentSigned ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-medium">Student Signature</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {studentSigned ? `Signed on ${new Date(contractData.studentSignature!.signedAt!).toLocaleString()}` : 'Not signed'}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${landlordSigned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border-2`}>
              <div className="flex items-center gap-2 mb-2">
                {landlordSigned ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-medium">Landlord Signature</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {landlordSigned ? `Signed on ${new Date(contractData.landlordSignature!.signedAt!).toLocaleString()}` : 'Not signed'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
