import { useState, useEffect } from 'react';
import { 
  Search,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  History,
  Loader2
} from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { getLandlordTenants } from '@/shared/services/joinRequestService';
import { toast } from '@/shared/utils/toast';

interface ActionHistory {
  action: string;
  amount?: string;
  date: string;
  notes: string;
  gasFeee?: string;
}

interface Tenant {
  id: string;
  name: string;
  photo: string;
  propertyTitle: string;
  propertyAddress: string;
  moveInDate: string;
  monthlyRent: string;
  leaseDuration: string;
  status: 'active' | 'terminating' | 'completed';
  securityDeposit: string;
  actionHistory: ActionHistory[];
}

const MOCK_TENANTS: Tenant[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    propertyTitle: 'Spacious 3-Bed House with Garden',
    propertyAddress: '78 Oak Avenue, Birmingham, B2 4QA',
    moveInDate: '2025-01-15',
    monthlyRent: '1800',
    leaseDuration: '12',
    status: 'active',
    securityDeposit: '1800',
    actionHistory: [
      {
        action: 'Rent (Apr 2025) Paid',
        amount: '£1800',
        date: '2025-04-01',
        notes: 'Transaction confirmed'
      },
      {
        action: 'Rent (Mar 2025) Paid',
        amount: '£1800',
        date: '2025-03-01',
        notes: 'Transaction confirmed'
      },
      {
        action: 'Rent (Feb 2025) Paid',
        amount: '£1800',
        date: '2025-02-01',
        notes: 'Transaction confirmed'
      },
      {
        action: 'Security Deposited',
        amount: '£1800',
        date: '2025-01-15',
        notes: 'Held in escrow'
      },
      {
        action: 'Contract Signed',
        gasFeee: '0.004 ETH',
        date: '2025-01-15',
        notes: 'Smart contract deployed'
      }
    ]
  },
  {
    id: '2',
    name: 'Michael Chen',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    propertyTitle: 'Modern 2-Bed Flat in City Centre',
    propertyAddress: '123 High Street, London, SW1A 1AA',
    moveInDate: '2025-02-01',
    monthlyRent: '1200',
    leaseDuration: '6',
    status: 'active',
    securityDeposit: '1200',
    actionHistory: [
      {
        action: 'Rent (Apr 2025) Paid',
        amount: '£1200',
        date: '2025-04-01',
        notes: 'Transaction confirmed'
      },
      {
        action: 'Rent (Mar 2025) Paid',
        amount: '£1200',
        date: '2025-03-01',
        notes: 'Transaction confirmed'
      },
      {
        action: 'Security Deposited',
        amount: '£1200',
        date: '2025-02-01',
        notes: 'Held in escrow'
      },
      {
        action: 'Contract Signed',
        gasFeee: '0.004 ETH',
        date: '2025-02-01',
        notes: 'Smart contract deployed'
      }
    ]
  },
  {
    id: '3',
    name: 'Emma Williams',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    propertyTitle: 'Cosy Studio Near University',
    propertyAddress: '45 Park Lane, Manchester, M1 2AB',
    moveInDate: '2024-09-01',
    monthlyRent: '850',
    leaseDuration: '12',
    status: 'terminating',
    securityDeposit: '850',
    actionHistory: [
      {
        action: 'Termination Initiated',
        date: '2025-04-15',
        notes: 'Contract termination in progress'
      },
      {
        action: 'Rent (Apr 2025) Paid',
        amount: '£850',
        date: '2025-04-01',
        notes: 'Transaction confirmed'
      },
      {
        action: 'Security Deposited',
        amount: '£850',
        date: '2024-09-01',
        notes: 'Held in escrow'
      },
      {
        action: 'Contract Signed',
        gasFeee: '0.004 ETH',
        date: '2024-09-01',
        notes: 'Smart contract deployed'
      }
    ]
  }
];

export function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'history' | null>(null);
  const [showTerminateModal, setShowTerminateModal] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await getLandlordTenants();
      setTenants(response.tenants);
    } catch (error: any) {
      console.error('Failed to fetch tenants:', error);
      toast.error(error.error || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'terminating':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'completed':
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleTerminate = (id: string) => {
    setTenants(tenants.map(tenant => 
      tenant.id === id ? { ...tenant, status: 'terminating' as const } : tenant
    ));
    setShowTerminateModal(null);
    showSuccessToast('✅ Contract termination initiated.');
  };

  const showSuccessToast = (message: string) => {
    setShowToast({ message, type: 'success' });
    setTimeout(() => setShowToast(null), 3000);
  };

  const toggleExpanded = (tenantId: string, section: 'history') => {
    if (expandedTenant === tenantId && expandedSection === section) {
      setExpandedTenant(null);
      setExpandedSection(null);
    } else {
      setExpandedTenant(tenantId);
      setExpandedSection(section);
    }
  };

  const getTerminationDate = (securityAmount: string) => {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-[#8C57FF]" />
            <p className="text-muted-foreground">Loading tenants...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-[#4A4A68] mb-2 text-xl sm:text-2xl">Tenant Management</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Manage all active tenants and contract details</p>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-3 sm:p-4 mb-4 sm:mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
          {/* Search */}
          <div className="flex-1 min-w-full sm:min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tenant name or property"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="terminating">Termination Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tenant Cards */}
      <div className="space-y-4">
        {filteredTenants.length === 0 ? (
          <Card className="p-12 text-center shadow-lg">
            <p className="text-muted-foreground">No tenants found</p>
          </Card>
        ) : (
          filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="shadow-md hover:shadow-lg transition-shadow border border-border/50">
              {/* Card Content */}
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
                  {/* Left: Tenant Info */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                    <img
                      src={tenant.photo}
                      alt={tenant.name}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0 border-2 border-[#8C57FF]/20"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[#4A4A68] mb-1 text-base sm:text-lg truncate">{tenant.name}</h3>
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-[#8C57FF] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-[#4A4A68] truncate">{tenant.propertyTitle}</p>
                          <p className="text-xs text-muted-foreground truncate">{tenant.propertyAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status */}
                  <Badge className={`${getStatusColor(tenant.status)} text-xs whitespace-nowrap`}>
                    {tenant.status === 'active' ? 'Active' : tenant.status === 'terminating' ? 'Termination Pending' : 'Completed'}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 p-3 sm:p-4 bg-[#F4F5FA]/50 rounded-lg mb-4 border border-border/30">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="h-3 w-3 text-[#8C57FF] flex-shrink-0" />
                      <p className="text-xs text-[#8C57FF] truncate">Move-in Date</p>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A4A68] truncate">
                      {new Date(tenant.moveInDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3 text-[#8C57FF] flex-shrink-0" />
                      <p className="text-xs text-[#8C57FF] truncate">Monthly Rent</p>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A4A68] truncate">£{tenant.monthlyRent}/mo</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-[#8C57FF] flex-shrink-0" />
                      <p className="text-xs text-[#8C57FF] truncate">Lease Duration</p>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A4A68]">{tenant.leaseDuration} months</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Shield className="h-3 w-3 text-[#8C57FF] flex-shrink-0" />
                      <p className="text-xs text-[#8C57FF] truncate">Security Deposit</p>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A4A68]">£{tenant.securityDeposit}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="h-3 w-3 text-[#8C57FF] flex-shrink-0" />
                      <p className="text-xs text-[#8C57FF] truncate">Lease End Date</p>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A4A68] truncate">
                      {(() => {
                        const endDate = new Date(tenant.moveInDate);
                        endDate.setMonth(endDate.getMonth() + parseInt(tenant.leaseDuration));
                        return endDate.toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        });
                      })()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {tenant.status === 'active' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowTerminateModal(tenant.id)}
                      className="flex-1 text-red-600 hover:text-red-700 hover:border-red-300 text-xs sm:text-sm"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Terminate Contract
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => toggleExpanded(tenant.id, 'history')}
                    className="flex-1 text-[#8C57FF] hover:text-[#7645E8] hover:border-[#8C57FF] text-xs sm:text-sm"
                  >
                    <History className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    {expandedTenant === tenant.id && expandedSection === 'history' ? 'Hide' : 'Show'} Action History
                    {expandedTenant === tenant.id && expandedSection === 'history' ? (
                      <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded Action History */}
              {expandedTenant === tenant.id && expandedSection === 'history' && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t pt-4 sm:pt-6 bg-[#F4F5FA]/30">
                  <h4 className="text-[#8C57FF] mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <History className="h-4 w-4" />
                    Action History
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#8C57FF]">Action</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#8C57FF]">Amount</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#8C57FF]">Date</th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#8C57FF]">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenant.actionHistory.map((action, idx) => (
                          <tr key={idx} className="border-b hover:bg-white/50 transition-colors">
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#4A4A68]">{action.action}</td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#4A4A68]">
                              {action.amount || action.gasFeee ? (
                                action.gasFeee ? (
                                  <span className="text-xs text-muted-foreground">Gas Fee: {action.gasFeee}</span>
                                ) : (
                                  action.amount
                                )
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#4A4A68]">
                              {new Date(action.date).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-muted-foreground">{action.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Terminate Contract Modal */}
      {showTerminateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-lg w-full">
            <div className="flex items-center gap-2 mb-4">
              <X className="h-5 w-5 text-red-600" />
              <h3 className="text-[#4A4A68]">Terminate Contract</h3>
            </div>
            <p className="text-[#4A4A68] mb-4">
              Are you sure you want to terminate this contract?
            </p>
            <div className="bg-yellow-500/10 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-[#4A4A68] mb-2">
                As per the agreement, the contract and security deposit of <strong>£{tenants.find(t => t.id === showTerminateModal)?.securityDeposit}</strong> will remain on hold for <strong>60 days</strong>.
              </p>
              <p className="text-sm text-[#4A4A68] mb-2">
                The contract will be officially terminated and security auto-refunded on <strong>{getTerminationDate(tenants.find(t => t.id === showTerminateModal)?.securityDeposit || '0')}</strong>.
              </p>
              <p className="text-sm text-[#4A4A68] mb-2">
                A small gas/termination fee around <strong>$2</strong> will be deducted from your balance.
              </p>
              <p className="text-sm text-muted-foreground italic">
                If you wish to file a complaint or request a deduction from the security, please contact the Resolution Team through the Messages tab.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowTerminateModal(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => handleTerminate(showTerminateModal)}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm Termination
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Toast Notifications */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
          showToast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {showToast.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
          {showToast.message}
        </div>
      )}
      </>
      )}
    </div>
  );
}
