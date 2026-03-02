const mongoose = require('mongoose');
const dotenv = require('dotenv');
const InvestmentPool = require('./models/investmentPoolModel.js');

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Rentmates';

// Three investment pools with different risk profiles
const investmentPools = [
  {
    name: 'Conservative Growth',
    ltv: 0.7,
    durationMonths: 6,
    baseRate: 4, // 4% base
    riskMultiplier: 8, // 8% risk factor
    timePremiumRate: 0.5, // 0.5% per month
    minInvestment: 1,
    maxInvestment: 1000,
    maxCapital: 5000
  },
  {
    name: 'Balanced Portfolio',
    ltv: 0.8,
    durationMonths: 9,
    baseRate: 4,
    riskMultiplier: 8,
    timePremiumRate: 0.5,
    minInvestment: 1,
    maxInvestment: 1000,
    maxCapital: 5000
  },
  {
    name: 'High Yield Growth',
    ltv: 0.9,
    durationMonths: 12,
    baseRate: 4,
    riskMultiplier: 8,
    timePremiumRate: 0.5,
    minInvestment: 1,
    maxInvestment: 1000,
    maxCapital: 5000
  }
];

async function seedInvestmentPools() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing pools
    console.log('🧹 Clearing existing investment pools...');
    await InvestmentPool.deleteMany({});
    console.log('✅ Cleared existing pools\n');

    // Insert new pools
    console.log('📊 Inserting investment pools...');
    const createdPools = await InvestmentPool.insertMany(investmentPools);
    
    console.log('✅ Successfully created investment pools:\n');
    
    createdPools.forEach(pool => {
      const roi = pool.calculateROI();
      console.log(`📈 ${pool.name}`);
      console.log(`   - LTV Ratio: ${(pool.ltv * 100).toFixed(0)}%`);
      console.log(`   - Duration: ${pool.durationMonths} months`);
      console.log(`   - Expected ROI: ${roi.toFixed(2)}%`);
      console.log(`   - Investment Range: $${pool.minInvestment} - $${pool.maxInvestment}`);
      console.log(`   - Max Pool Capital: $${pool.maxCapital}`);
      console.log('');
    });

    console.log('🎉 Investment pool seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding investment pools:', error);
    process.exit(1);
  }
}

// Run the seeding script
seedInvestmentPools();
