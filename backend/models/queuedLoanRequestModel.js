const mongoose = require('mongoose');

/**
 * QueuedLoanRequest Model
 * Stores loan requests from students when no matching pool is available
 * Used for Investment Opportunities analytics in Investor Dashboard
 */
const queuedLoanRequestSchema = new mongoose.Schema({
  // Student Information
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  
  // Loan Requirements
  requestedAmount: { 
    type: Number, 
    required: true 
  },
  
  duration: { 
    type: Number, 
    required: true 
  }, // in months
  
  purpose: { 
    type: String, 
    required: true 
  },
  
  // Preferences (from search criteria)
  maxAcceptableAPR: { 
    type: Number 
  }, // Maximum APR student is willing to accept
  
  preferredRiskLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'any'],
    default: 'any'
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['queued', 'matched', 'expired', 'cancelled'],
    default: 'queued'
  },
  
  // Matched Pool (when a suitable pool becomes available)
  matchedPool: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'InvestmentPool' 
  },
  
  matchedAt: { 
    type: Date 
  },
  
  // Timestamps
  requestedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  expiresAt: { 
    type: Date,
    default: function() {
      // Queue requests expire after 30 days
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  
  // Student Contact (for notification when pool becomes available)
  notificationSent: { 
    type: Boolean, 
    default: false 
  },
  
  // Analytics metadata
  attemptedPools: [{
    poolId: mongoose.Schema.Types.ObjectId,
    poolName: String,
    reason: String // Why it didn't match (e.g., "Insufficient liquidity", "Duration mismatch")
  }],
  
  // Priority score (calculated based on demand, amount, duration)
  priorityScore: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
queuedLoanRequestSchema.index({ status: 1, requestedAt: -1 });
queuedLoanRequestSchema.index({ student: 1, status: 1 });
queuedLoanRequestSchema.index({ expiresAt: 1 });

// Virtual for checking if request is expired
queuedLoanRequestSchema.virtual('isExpired').get(function() {
  return this.status === 'queued' && this.expiresAt < new Date();
});

// Method to calculate priority score
queuedLoanRequestSchema.methods.calculatePriorityScore = function() {
  // Higher score = higher priority
  // Factors: Amount (30%), Duration (20%), Days waiting (50%)
  const amountScore = Math.min(this.requestedAmount / 10000, 1) * 30; // Normalized to max 10k
  const durationScore = Math.min(this.duration / 24, 1) * 20; // Normalized to max 24 months
  
  const daysWaiting = Math.floor((Date.now() - this.requestedAt) / (1000 * 60 * 60 * 24));
  const waitingScore = Math.min(daysWaiting / 30, 1) * 50; // Normalized to 30 days
  
  this.priorityScore = amountScore + durationScore + waitingScore;
  return this.priorityScore;
};

// Static method to get queued requests by purpose
queuedLoanRequestSchema.statics.getQueuedByPurpose = function() {
  return this.aggregate([
    { $match: { status: 'queued', expiresAt: { $gt: new Date() } } },
    { 
      $group: { 
        _id: '$purpose', 
        count: { $sum: 1 },
        totalAmount: { $sum: '$requestedAmount' },
        avgAmount: { $avg: '$requestedAmount' }
      } 
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get demand by amount range
queuedLoanRequestSchema.statics.getDemandByAmountRange = function() {
  return this.aggregate([
    { $match: { status: 'queued', expiresAt: { $gt: new Date() } } },
    {
      $bucket: {
        groupBy: '$requestedAmount',
        boundaries: [0, 2000, 5000, 10000, 20000, 50000, 100000],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    }
  ]);
};

// Static method to cleanup expired requests
queuedLoanRequestSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    { 
      status: 'queued', 
      expiresAt: { $lt: new Date() } 
    },
    { 
      $set: { status: 'expired' } 
    }
  );
  return result;
};

const QueuedLoanRequest = mongoose.model('QueuedLoanRequest', queuedLoanRequestSchema);

module.exports = QueuedLoanRequest;
