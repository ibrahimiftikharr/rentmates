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
    enum: ['pending', 'deposited', 'returned', 'liquidated'],
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

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
