/**
 * Test Script: Investor Notification System
 * 
 * This script tests that investor notifications are properly created and retrieved
 * 
 * Run with: node backend/test-investor-notifications.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Investor = require('./models/investorModel');
const PoolInvestment = require('./models/poolInvestmentModel');
const InvestmentPool = require('./models/investmentPoolModel');
const Notification = require('./models/notificationModel');
const User = require('./models/userModel');

async function testInvestorNotifications() {
  try {
    console.log('🧪 Testing Investor Notification System\n');
    console.log('=' .repeat(60));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Step 1: Find an investor
    console.log('📊 Step 1: Finding test investor...');
    const investorProfile = await Investor.findOne().populate('user');
    
    if (!investorProfile) {
      console.log('❌ No investors found in database');
      console.log('💡 Please create an investor account first');
      process.exit(0);
    }
    
    const user = await User.findById(investorProfile.user);
    console.log(`✅ Found investor: ${user.email}`);
    console.log(`   - Investor Profile ID: ${investorProfile._id}`);
    console.log(`   - User ID: ${user._id}\n`);
    
    // Step 2: Check their investments
    console.log('📊 Step 2: Checking investor\'s active investments...');
    const investments = await PoolInvestment.find({
      investor: user._id,
      status: 'active'
    }).populate('pool');
    
    console.log(`✅ Found ${investments.length} active investment(s)`);
    investments.forEach((inv, idx) => {
      console.log(`   ${idx + 1}. Pool: ${inv.pool.name}`);
      console.log(`      - Amount: $${inv.amountInvested}`);
      console.log(`      - Shares: ${inv.shares}`);
    });
    console.log('');
    
    // Step 3: Check existing notifications
    console.log('📊 Step 3: Checking existing notifications...');
    const existingNotifs = await Notification.find({
      recipient: investorProfile._id,
      recipientModel: 'Investor'
    }).sort({ createdAt: -1 }).limit(10);
    
    console.log(`✅ Found ${existingNotifs.length} notification(s) for this investor`);
    existingNotifs.forEach((notif, idx) => {
      console.log(`   ${idx + 1}. [${notif.type}] ${notif.title}`);
      console.log(`      - Message: ${notif.message}`);
      console.log(`      - Read: ${notif.read}`);
      console.log(`      - Created: ${notif.createdAt.toLocaleString()}`);
    });
    console.log('');
    
    // Step 4: Check notification preferences
    console.log('📊 Step 4: Checking notification preferences...');
    const userWithPrefs = await User.findById(user._id).select('notificationPreferences');
    
    if (userWithPrefs.notificationPreferences) {
      console.log('✅ Notification preferences found:');
      console.log(`   - Loan Activity: ${userWithPrefs.notificationPreferences.loanActivity}`);
      console.log(`   - Repayments: ${userWithPrefs.notificationPreferences.repayments}`);
      console.log(`   - Profits: ${userWithPrefs.notificationPreferences.profits}`);
      console.log(`   - Defaults: ${userWithPrefs.notificationPreferences.defaults}`);
      console.log(`   - Pool Updates: ${userWithPrefs.notificationPreferences.poolUpdates}`);
      console.log(`   - System Alerts: ${userWithPrefs.notificationPreferences.systemAlerts}`);
    } else {
      console.log('⚠️  No preferences set (will use defaults)');
    }
    console.log('');
    
    // Step 5: Create a test notification
    console.log('📊 Step 5: Creating test notification...');
    const { notifyInvestorProfitEarned } = require('./services/notificationService');
    
    if (investments.length > 0) {
      const testPool = investments[0].pool;
      await notifyInvestorProfitEarned(
        investorProfile._id,
        testPool._id,
        '15.50',
        '150.75'
      );
      console.log('✅ Test notification created successfully');
      
      // Verify it was created
      const newNotif = await Notification.findOne({
        recipient: investorProfile._id,
        recipientModel: 'Investor',
        type: 'investor_profit_earned'
      }).sort({ createdAt: -1 });
      
      if (newNotif) {
        console.log('✅ Notification verified in database:');
        console.log(`   - ID: ${newNotif._id}`);
        console.log(`   - Title: ${newNotif.title}`);
        console.log(`   - Message: ${newNotif.message}`);
      }
    } else {
      console.log('⚠️  No active investments found, skipping test notification');
    }
    console.log('');
    
    // Step 6: Summary
    console.log('=' .repeat(60));
    console.log('📋 SUMMARY:');
    console.log(`   - Investor Profile ID: ${investorProfile._id}`);
    console.log(`   - User ID: ${user._id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Active Investments: ${investments.length}`);
    console.log(`   - Total Notifications: ${existingNotifs.length}`);
    console.log(`   - Unread Notifications: ${existingNotifs.filter(n => !n.read).length}`);
    console.log('');
    
    if (existingNotifs.length === 0) {
      console.log('⚠️  WARNING: No notifications found for this investor!');
      console.log('💡 This could mean:');
      console.log('   1. The investor hasn\'t had any loan activity yet');
      console.log('   2. Notifications are not being created properly');
      console.log('   3. The investor profile ID doesn\'t match notification recipient');
      console.log('');
      console.log('🔍 Try:');
      console.log('   - Creating a loan and disbursing it');
      console.log('   - Making a loan repayment');
      console.log('   - Check backend logs for notification creation errors');
    }
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the test
testInvestorNotifications();
