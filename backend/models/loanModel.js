const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  // Borrower Information
  borrower: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  
  // Loan Details
  loanAmount: { type: Number, required: true },
  purpose: { type: String, required: true },
  duration: { type: Number, required: true }, // in months
  
  // Pool Information
  pool: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentPool', required: true },
  poolName: { type: String, required: true },
  
  // Financial Terms (locked at time of application)
  lockedAPR: { type: Number, required: true }, // Interest rate locked at application time
  lockedLTV: { type: Number, required: true }, // LTV ratio from pool
  monthlyRepayment: { type: Number, required: true }, // Calculated monthly payment
  totalRepayment: { type: Number, required: true }, // Total amount to be repaid
  
  // Collateral
  requiredCollateral: { type: Number, required: true }, // PAXG amount
  collateralDeposited: { type: Boolean, default: false },
  collateralTxHash: { type: String }, // Blockchain transaction hash
  collateralDepositedAt: { type: Date },
  walletAddress: { type: String }, // Student's wallet address used for deposit
  collateralStatus: { 
    type: String, 
    enum: ['pending', 'deposited', 'returned', 'liquidated', 'withdrawn'],
    default: 'pending'
  },
  
  // Loan Status
  status: { 
    type: String, 
    enum: ['pending', 'collateral_pending', 'active', 'repaying', 'completed', 'defaulted', 'cancelled'],
    default: 'pending'
  },
  
  // Dates
  applicationDate: { type: Date, default: Date.now },
  approvalDate: { type: Date },
  disbursementDate: { type: Date },
  maturityDate: { type: Date },
  
  // Repayment Tracking
  amountRepaid: { type: Number, default: 0 },
  remainingBalance: { type: Number },
  nextPaymentDate: { type: Date },
  paymentsCompleted: { type: Number, default: 0 },
  
  // Repayment Schedule
  repaymentSchedule: [{
    installmentNumber: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    principalAmount: { type: Number, required: true },
    interestAmount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'overdue', 'defaulted'],
      default: 'pending'
    },
    paidAt: { type: Date },
    paidAmount: { type: Number, default: 0 }
  }],
  
  // Auto-Payment Settings
  autoRepaymentEnabled: { type: Boolean, default: false },
  autoRepaymentLastAttempt: { type: Date },
  autoRepaymentLastStatus: { 
    type: String, 
    enum: ['success', 'insufficient_funds', 'error'],
  },
  
  // Payment History
  payments: [{
    amount: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
    installmentNumber: { type: Number },
    balanceAfter: { type: Number },
    notes: { type: String }
  }],
  
  // Smart Contract
  loanContractAddress: { type: String },
  
  // Metadata
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for efficient queries
loanSchema.index({ borrower: 1, status: 1 });
loanSchema.index({ pool: 1, status: 1 });

// Helper method to generate repayment schedule
loanSchema.methods.generateRepaymentSchedule = function() {
  const schedule = [];
  const startDate = this.disbursementDate || new Date();
  const monthlyPayment = this.monthlyRepayment;
  const totalAmount = this.loanAmount;
  const annualRate = this.lockedAPR / 100;
  const monthlyRate = annualRate / 12;
  
  let remainingPrincipal = totalAmount;
  
  for (let i = 1; i <= this.duration; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    // Calculate interest and principal portions
    const interestAmount = remainingPrincipal * monthlyRate;
    const principalAmount = monthlyPayment - interestAmount;
    remainingPrincipal -= principalAmount;
    
    schedule.push({
      installmentNumber: i,
      dueDate: dueDate,
      amount: monthlyPayment,
      principalAmount: Math.max(0, principalAmount),
      interestAmount: interestAmount,
      status: 'pending'
    });
  }
  
  this.repaymentSchedule = schedule;
  this.nextPaymentDate = schedule[0].dueDate;
  this.remainingBalance = this.totalRepayment;
};

// Get current installment info
loanSchema.methods.getCurrentInstallment = function() {
  const now = new Date();
  
  // Find the first unpaid installment
  const currentInstallment = this.repaymentSchedule.find(inst => inst.status === 'pending' || inst.status === 'overdue');
  
  if (!currentInstallment) {
    return null; // All paid
  }
  
  const dueDate = new Date(currentInstallment.dueDate);
  const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilDue < 0;
  
  // Payment window opens 20 days before due date
  const paymentWindowStart = new Date(dueDate);
  paymentWindowStart.setDate(paymentWindowStart.getDate() - 20);
  
  const canPayNow = now >= paymentWindowStart || isOverdue;
  const daysUntilWindowOpens = canPayNow ? 0 : Math.ceil((paymentWindowStart - now) / (1000 * 60 * 60 * 24));
  
  return {
    ...currentInstallment.toObject(),
    daysUntilDue: Math.abs(daysUntilDue),
    isOverdue,
    canPayNow,
    paymentWindowStart,
    daysUntilWindowOpens
  };
};

// Mark installment as paid and move to next
loanSchema.methods.markInstallmentPaidAndMoveNext = function() {
  const currentInstallment = this.repaymentSchedule.find(inst => inst.status === 'pending' || inst.status === 'overdue');
  
  if (currentInstallment) {
    currentInstallment.status = 'paid';
    currentInstallment.paidAt = new Date();
    currentInstallment.paidAmount = currentInstallment.amount;
    
    this.amountRepaid += currentInstallment.amount;
    this.remainingBalance = this.totalRepayment - this.amountRepaid;
    this.paymentsCompleted += 1;
    
    // Find next unpaid installment
    const nextInstallment = this.repaymentSchedule.find(inst => inst.status === 'pending');
    
    if (nextInstallment) {
      this.nextPaymentDate = nextInstallment.dueDate;
      this.status = 'repaying';
    } else {
      // All installments paid
      this.nextPaymentDate = null;
      this.status = 'completed';
      this.remainingBalance = 0;
    }
  }
};

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
