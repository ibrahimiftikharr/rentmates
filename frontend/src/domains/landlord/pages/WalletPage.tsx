import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  connectMetaMask, 
  connectWalletToBackend, 
  getWalletBalance, 
  depositToVault, 
  recordDeposit,
  withdrawFromVault,
  getUSDTBalance,
  USDT_ADDRESS,
  VAULT_ADDRESS
} from '@/shared/services/walletService';


export function WalletPage() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [onChainBalance, setOnChainBalance] = useState<string>('0');
  const [offChainBalance, setOffChainBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setIsRefreshing(true);
      const data = await getWalletBalance();
      
      if (data.success) {
        setWalletAddress(data.walletAddress || '');
        setOnChainBalance(data.onChainBalance || '0');
        setOffChainBalance(data.offChainBalance || 0);
      }
    } catch (error: any) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setMessage(null);

    try {
      const address = await connectMetaMask();
      await connectWalletToBackend(address);
      
      setWalletAddress(address);
      toast.success('Wallet connected successfully!');
      setMessage({ type: 'success', text: 'Wallet connected successfully!' });
      
      await fetchBalance();
      
      const balance = await getUSDTBalance(address);
      setOnChainBalance(balance);
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
      setMessage({ type: 'error', text: error.message || 'Failed to connect wallet' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    setIsDepositing(true);
    setMessage(null);

    try {
      toast.info('Please confirm the transaction in MetaMask...');
      setMessage({ type: 'success', text: 'Please confirm the transaction in MetaMask...' });
      
      const txHash = await depositToVault(depositAmount);
      await recordDeposit(depositAmount, txHash);
      
      toast.success(`Successfully deposited ${depositAmount} USDT!`);
      setMessage({ type: 'success', text: `Successfully deposited ${depositAmount} USDT!` });
      setDepositAmount('');
      
      await fetchBalance();
      const balance = await getUSDTBalance(walletAddress);
      setOnChainBalance(balance);
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || 'Deposit failed');
      setMessage({ type: 'error', text: error.message || 'Deposit failed' });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    if (parseFloat(withdrawAmount) > offChainBalance) {
      toast.error('Insufficient balance');
      setMessage({ type: 'error', text: 'Insufficient balance' });
      return;
    }

    setIsWithdrawing(true);
    setMessage(null);

    try {
      toast.info('Processing withdrawal...');
      setMessage({ type: 'success', text: 'Processing withdrawal...' });
      
      await withdrawFromVault(withdrawAmount);
      
      toast.success(`Successfully withdrew ${withdrawAmount} USDT!`);
      setMessage({ type: 'success', text: `Successfully withdrew ${withdrawAmount} USDT!` });
      setWithdrawAmount('');
      
      await fetchBalance();
      const balance = await getUSDTBalance(walletAddress);
      setOnChainBalance(balance);
    } catch (error: any) {
      console.error('Withdraw error:', error);
      toast.error(error.message || 'Withdrawal failed');
      setMessage({ type: 'error', text: error.message || 'Withdrawal failed' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchBalance();
    if (walletAddress) {
      const balance = await getUSDTBalance(walletAddress);
      setOnChainBalance(balance);
    }
    toast.success('Balances refreshed');
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="mb-2">Wallet Management</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your USDT deposits and withdrawals
          </p>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Connect Wallet Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Wallet Connection
          </CardTitle>
          <CardDescription>
            Connect your MetaMask wallet to manage funds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!walletAddress ? (
            <Button 
              onClick={handleConnectWallet} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? 'Connecting...' : 'Connect MetaMask Wallet'}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Connected Wallet</span>
                <span className="text-sm font-mono">{shortenAddress(walletAddress)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Full address: {walletAddress}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Wallet Balance</CardTitle>
            <CardDescription>USDT in your MetaMask wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{parseFloat(onChainBalance).toFixed(2)} USDT</div>
            <div className="text-xs text-muted-foreground mt-1">Available for deposit</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Available Balance</CardTitle>
            <CardDescription>Your balance in RentMates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{offChainBalance.toFixed(2)} USDT</div>
            <div className="text-xs text-muted-foreground mt-1">Available for rent payments</div>
          </CardContent>
        </Card>
      </div>

      {/* Manage Funds Card */}
      {walletAddress && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              USDT Deposits & Withdrawals
            </CardTitle>
            <CardDescription>
              Manage your USDT balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deposit Section */}
              <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <ArrowDownToLine className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Deposit</h3>
                    <p className="text-sm text-muted-foreground">Add USDT to your wallet</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Amount (USDT)"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={!walletAddress || isDepositing}
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleDeposit}
                  disabled={!walletAddress || isDepositing || !depositAmount}
                >
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  {isDepositing ? 'Depositing...' : 'Deposit Now'}
                </Button>
                <div className="text-xs text-muted-foreground">
                  Vault Contract: {shortenAddress(VAULT_ADDRESS)}
                </div>
              </div>

              {/* Withdraw Section */}
              <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <ArrowUpFromLine className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Withdraw</h3>
                    <p className="text-sm text-muted-foreground">Withdraw USDT from your wallet</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Amount (USDT)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={!walletAddress || isWithdrawing}
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={handleWithdraw}
                  disabled={!walletAddress || isWithdrawing || !withdrawAmount}
                >
                  <ArrowUpFromLine className="w-4 h-4 mr-2" />
                  {isWithdrawing ? 'Withdrawing...' : 'Withdraw Now'}
                </Button>
                <div className="text-xs text-muted-foreground">
                  Available: {offChainBalance.toFixed(2)} USDT
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Info */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm">Contract Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">USDT Token:</span>
            <span className="font-mono">{shortenAddress(USDT_ADDRESS)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vault Contract:</span>
            <span className="font-mono">{shortenAddress(VAULT_ADDRESS)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network:</span>
            <span>Polygon Amoy Testnet</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
