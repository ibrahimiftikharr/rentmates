import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  GraduationCap, 
  Wallet, 
  TrendingUp, 
  Shield, 
  Clock, 
  DollarSign,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  BookOpen,
  Target,
  BarChart3,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  tips: string[];
}

export function InvestmentTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [tutorialStarted, setTutorialStarted] = useState(false);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 0,
      title: "Welcome to RentMates Investment Dashboard",
      description: "Your complete guide to investing in rental properties",
      icon: <GraduationCap className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg p-6 border border-primary/20">
            <h3 className="text-xl font-semibold mb-3">What You'll Learn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Wallet Setup</p>
                  <p className="text-sm text-muted-foreground">Connect and manage your digital wallet</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Making Investments</p>
                  <p className="text-sm text-muted-foreground">Choose and invest in rental pools</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Escrow & Security</p>
                  <p className="text-sm text-muted-foreground">Understand fund protection</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Portfolio Tracking</p>
                  <p className="text-sm text-muted-foreground">Monitor your returns and analytics</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Pro Tip</p>
                <p className="text-sm text-yellow-800">
                  This tutorial takes about 10 minutes. You can pause anytime and return later.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Take your time to understand each concept",
        "Feel free to explore the dashboard while learning",
        "All investments shown are examples for learning"
      ]
    },
    {
      id: 1,
      title: "Understanding Your Wallet",
      description: "Learn how to connect and manage your digital wallet",
      icon: <Wallet className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="border rounded-lg p-5 bg-accent/30">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              What is a Wallet?
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              A digital wallet is your secure account that holds your cryptocurrency (like USDT) 
              and allows you to make investments on RentMates. Think of it like a bank account, 
              but for digital assets.
            </p>
            
            <div className="bg-card rounded-lg p-4 border">
              <p className="text-sm font-medium mb-2">Your wallet address looks like this:</p>
              <code className="text-xs bg-accent px-3 py-1.5 rounded block">
                0x742d35Cc6634C0532925a3b844Bc9e7595f89Ab
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                This is your unique identifier on the blockchain - like your account number
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <h5 className="font-semibold">Available Balance</h5>
              </div>
              <p className="text-2xl font-bold text-primary mb-1">2,450 USDT</p>
              <p className="text-xs text-muted-foreground">
                Funds ready to invest or withdraw
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <h5 className="font-semibold">Escrow Balance</h5>
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-1">45,800 USDT</p>
              <p className="text-xs text-muted-foreground">
                Funds locked in active investments
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">How to Add Funds</p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Click the "Deposit" button in your wallet</li>
                  <li>Choose your deposit method (bank transfer or crypto)</li>
                  <li>Follow the instructions to complete your deposit</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Always keep some funds in Available Balance for flexibility",
        "Escrow funds are automatically locked when you invest",
        "You can withdraw your Available Balance anytime"
      ]
    },
    {
      id: 2,
      title: "Exploring Investment Pools",
      description: "Discover different rental property investment opportunities",
      icon: <TrendingUp className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
            <h4 className="font-semibold mb-3">What are Investment Pools?</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Investment pools are collections of rental properties grouped by location, risk level, 
              and expected returns. By investing in a pool, you're essentially becoming a fractional 
              owner of multiple properties.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold">Example Investment Pools:</h5>
            
            {/* Conservative Pool */}
            <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h6 className="font-semibold">Conservative Growth Pool</h6>
                  <p className="text-xs text-muted-foreground">Downtown Austin, TX</p>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Low Risk
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Expected ROI</p>
                  <p className="font-semibold text-green-600">8-12%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p className="font-semibold">12 months</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Min. Investment</p>
                  <p className="font-semibold">$100</p>
                </div>
              </div>
            </div>

            {/* Balanced Pool */}
            <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h6 className="font-semibold">Balanced Returns Pool</h6>
                  <p className="text-xs text-muted-foreground">Miami, FL Suburbs</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                  Medium Risk
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Expected ROI</p>
                  <p className="font-semibold text-orange-600">15-22%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p className="font-semibold">18 months</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Min. Investment</p>
                  <p className="font-semibold">$500</p>
                </div>
              </div>
            </div>

            {/* Aggressive Pool */}
            <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h6 className="font-semibold">High-Growth Opportunity</h6>
                  <p className="text-xs text-muted-foreground">Denver, CO Development</p>
                </div>
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                  High Risk
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Expected ROI</p>
                  <p className="font-semibold text-purple-600">25-35%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p className="font-semibold">24 months</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Min. Investment</p>
                  <p className="font-semibold">$1,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Higher returns usually mean higher risk",
        "Diversify across multiple pools to spread risk",
        "Read the full pool details before investing"
      ]
    },
    {
      id: 3,
      title: "Making Your First Investment",
      description: "Step-by-step guide to investing in a rental pool",
      icon: <Target className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              How to Invest
            </h4>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Browse Investment Pools</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Go to the "Investments" page and explore available pools. 
                    Compare ROI, duration, and risk levels.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Review Pool Details</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "View Details" to see property locations, historical performance, 
                    and full investment terms.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Enter Investment Amount</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Invest Now" and enter how much you want to invest. 
                    Must be between minimum and maximum amounts.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-medium">Confirm & Sign Transaction</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review all details, then confirm. You'll sign the transaction with your wallet. 
                    Funds move from Available Balance to Escrow.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Track Your Investment</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your investment is now active! Track it on the Dashboard and Analytics pages.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Important Reminder</p>
                <p className="text-sm text-orange-800 mt-1">
                  Once invested, your funds are locked for the pool's duration. You'll receive 
                  monthly rental income payments and your principal back at the end.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Start with smaller amounts to learn the process",
        "Double-check all amounts before confirming",
        "Save transaction receipts for your records"
      ]
    },
    {
      id: 4,
      title: "Understanding Escrow & Security",
      description: "How your investments are protected",
      icon: <Shield className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              What is Escrow?
            </h4>
            <p className="text-sm text-muted-foreground">
              Escrow is a secure, neutral account where your investment funds are held. 
              The funds are protected and can only be released according to smart contract rules - 
              not by any single person or company.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <h5 className="font-semibold mb-2">Automatic Payments</h5>
              <p className="text-sm text-muted-foreground">
                Monthly rental income is automatically distributed to your wallet from escrow
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <h5 className="font-semibold mb-2">Blockchain Protected</h5>
              <p className="text-sm text-muted-foreground">
                All transactions are recorded on the blockchain for transparency and security
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
              <h5 className="font-semibold mb-2">Smart Contracts</h5>
              <p className="text-sm text-muted-foreground">
                Investment terms are coded into smart contracts that execute automatically
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <h5 className="font-semibold mb-2">Timed Release</h5>
              <p className="text-sm text-muted-foreground">
                Your principal is released back to you when the investment period ends
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h5 className="font-semibold mb-3">Escrow Lifecycle</h5>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 bg-primary/10 rounded px-3 py-2 text-center">
                <p className="font-medium">Investment Made</p>
                <p className="text-xs text-muted-foreground mt-1">Funds locked</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 bg-green-500/10 rounded px-3 py-2 text-center">
                <p className="font-medium">Monthly Payments</p>
                <p className="text-xs text-muted-foreground mt-1">Rental income</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 bg-blue-500/10 rounded px-3 py-2 text-center">
                <p className="font-medium">Term Ends</p>
                <p className="text-xs text-muted-foreground mt-1">Principal returned</p>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Escrow balance shows all your locked investments",
        "You can track escrow releases on the Blockchain page",
        "Smart contracts ensure automatic and timely payments"
      ]
    },
    {
      id: 5,
      title: "Monitoring Your Portfolio",
      description: "Track performance and manage your investments",
      icon: <BarChart3 className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-5">
            <h4 className="font-semibold mb-3">Dashboard Overview</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Your dashboard is your command center. It shows real-time data about your investments, 
              earnings, and portfolio performance.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
                <p className="text-xl font-bold text-primary">$45,800</p>
                <p className="text-xs text-green-600 mt-1">↑ Across 3 pools</p>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
                <p className="text-xl font-bold text-green-600">$4,234</p>
                <p className="text-xs text-green-600 mt-1">↑ +12.3% ROI</p>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Active Loans</p>
                <p className="text-xl font-bold text-blue-600">8</p>
                <p className="text-xs text-muted-foreground mt-1">All performing</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold">Key Dashboard Features:</h5>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h6 className="font-semibold">Portfolio Overview</h6>
                  <p className="text-sm text-muted-foreground mt-1">
                    See all your active investments, their current values, and performance metrics in one place
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h6 className="font-semibold">Repayment Schedule</h6>
                  <p className="text-sm text-muted-foreground mt-1">
                    View upcoming payments, due dates, and enable auto-repay to never miss a payment
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h6 className="font-semibold">Analytics & Reports</h6>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deep dive into your portfolio with charts, graphs, and detailed performance analytics
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h6 className="font-semibold">Transaction History</h6>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete blockchain record of all deposits, investments, and withdrawals
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Pro Tip: Set Up Auto-Repay</p>
                <p className="text-sm text-green-800 mt-1">
                  Enable auto-repay in the Repayments page to automatically handle monthly payments 
                  from your wallet. You'll never miss a payment and maintain a perfect record!
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Check your dashboard daily to stay updated",
        "Use the Analytics page for detailed performance insights",
        "Enable notifications to get alerts about important events"
      ]
    },
    {
      id: 6,
      title: "Tutorial Complete! 🎉",
      description: "You're ready to start investing",
      icon: <CheckCircle className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
            <p className="text-muted-foreground">
              You've completed the RentMates Investment Tutorial
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-primary/5">
              <h5 className="font-semibold mb-2">✅ What You've Learned</h5>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>How to set up and manage your wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Understanding investment pools and risk levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Making your first investment step-by-step</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>How escrow protects your investments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Tracking and managing your portfolio</span>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4 bg-blue-50">
              <h5 className="font-semibold mb-2">🚀 Recommended Next Steps</h5>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Connect your wallet if you haven't already</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Browse investment pools on the Investments page</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Review pool details and historical performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Start with a conservative pool for your first investment</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Enable auto-repay for hassle-free management</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-2 border-primary rounded-lg p-5 bg-primary/5">
            <h5 className="font-semibold mb-3 text-center">Need More Help?</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="outline" className="w-full" onClick={() => toast.info("Opening help center...")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help Center
              </Button>
              <Button variant="outline" className="w-full" onClick={() => toast.info("Opening FAQ...")}>
                <BookOpen className="mr-2 h-4 w-4" />
                Read FAQ
              </Button>
              <Button variant="outline" className="w-full" onClick={() => toast.info("Contacting support...")}>
                <AlertCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You can restart this tutorial anytime from the Demo page
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
              onClick={() => {
                toast.success("Ready to invest!", {
                  description: "Navigate to Investments page to get started"
                });
              }}
            >
              Start Investing Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ),
      tips: [
        "You can always return to this tutorial",
        "Start small and learn as you go",
        "Don't hesitate to reach out for help"
      ]
    }
  ];

  const progressPercentage = ((completedSteps.length) / tutorialSteps.length) * 100;

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setTutorialStarted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success("Tutorial restarted");
  };

  const currentTutorialStep = tutorialSteps[currentStep];

  if (!tutorialStarted) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl border-2 border-primary/20">
          <CardHeader className="text-center pb-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl mb-2">Welcome to Investment 101</CardTitle>
            <p className="text-muted-foreground">
              A complete beginner's guide to the RentMates Investment Dashboard
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg p-6 border border-primary/20">
              <h3 className="font-semibold mb-4 text-lg">In this tutorial you'll learn:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: <Wallet className="h-5 w-5" />, title: "Wallet Management", desc: "Set up and fund your account" },
                  { icon: <TrendingUp className="h-5 w-5" />, title: "Investment Pools", desc: "Choose the right opportunities" },
                  { icon: <Target className="h-5 w-5" />, title: "Making Investments", desc: "Step-by-step investment process" },
                  { icon: <Shield className="h-5 w-5" />, title: "Escrow & Security", desc: "How your funds are protected" },
                  { icon: <Clock className="h-5 w-5" />, title: "Repayment Tracking", desc: "Monitor returns and payments" },
                  { icon: <BarChart3 className="h-5 w-5" />, title: "Portfolio Analytics", desc: "Track performance & ROI" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900">Time to Complete</p>
                <p className="text-sm text-blue-700">Approximately 10 minutes • 7 interactive lessons</p>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-lg px-8"
                onClick={() => setTutorialStarted(true)}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Start Tutorial
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                You can pause and resume anytime
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Progress Bar */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Tutorial Progress</p>
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {tutorialSteps.length}
            </p>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between mt-3">
            <Badge variant="secondary" className="text-xs">
              {completedSteps.length} steps completed
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleRestart}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Tutorial Content */}
      <Card className="shadow-2xl border-2 border-primary/20">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-purple-500/5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white flex-shrink-0">
              {currentTutorialStep.icon}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-1">{currentTutorialStep.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{currentTutorialStep.description}</p>
            </div>
            {completedSteps.includes(currentStep) && (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Step Content */}
          <div className="mb-6">
            {currentTutorialStep.content}
          </div>

          {/* Tips Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <h4 className="font-semibold text-yellow-900">Quick Tips</h4>
            </div>
            <ul className="space-y-1.5 ml-7">
              {currentTutorialStep.tips.map((tip, index) => (
                <li key={index} className="text-sm text-yellow-800">• {tip}</li>
              ))}
            </ul>
          </div>
        </CardContent>

        <div className="border-t p-6 bg-accent/30">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-primary w-6"
                      : completedSteps.includes(index)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {currentStep < tutorialSteps.length - 1 ? (
              <Button
                className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
                onClick={handleNext}
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90"
                onClick={() => {
                  if (!completedSteps.includes(currentStep)) {
                    setCompletedSteps([...completedSteps, currentStep]);
                  }
                  toast.success("Tutorial completed! 🎉", {
                    description: "You're ready to start investing"
                  });
                }}
              >
                Complete Tutorial
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}