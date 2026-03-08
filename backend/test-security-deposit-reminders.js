const mongoose = require('mongoose');
const Rental = require('./models/rentalModel');
const User = require('./models/userModel');
const Student = require('./models/studentModel');
const Landlord = require('./models/landlordModel');
const Notification = require('./models/notificationModel');
const emailService = require('./services/emailService');

// Import the actual reminder logic from the scheduler
const securityDepositScheduler = require('./services/securityDepositScheduler');

/**
 * Test script for security deposit reminder system
 * This allows you to test the 7-day reminder system and auto-termination
 */

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Rentmates', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

/**
 * Create a test rental with security deposit pending
 */
const createTestRental = async (daysUntilDue) => {
  try {
    console.log('\n=== Creating Test Rental ===');

    // Find or create test users
    let studentUser = await User.findOne({ email: 'test.student@example.com' });
    if (!studentUser) {
      studentUser = await User.create({
        name: 'Test Student',
        email: 'test.student@example.com',
        password: 'testpass123',
        role: 'student'
      });
      await Student.create({
        user: studentUser._id,
        institution: 'Test University',
        phoneNumber: '+1234567890'
      });
    }

    let landlordUser = await User.findOne({ email: 'test.landlord@example.com' });
    if (!landlordUser) {
      landlordUser = await User.create({
        name: 'Test Landlord',
        email: 'test.landlord@example.com',
        password: 'testpass123',
        role: 'landlord'
      });
      await Landlord.create({
        user: landlordUser._id,
        phoneNumber: '+1987654321'
      });
    }

    // Calculate due date
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + daysUntilDue);

    // Calculate other dates
    const contractSignedDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
    const leaseStartDate = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000); // 8 days from now
    const leaseEndDate = new Date(now.getTime() + 370 * 24 * 60 * 60 * 1000); // ~1 year
    const movingDate = new Date(leaseStartDate); // Same as lease start

    // Create rental
    const rental = await Rental.create({
      property: new mongoose.Types.ObjectId(),
      student: studentUser._id,
      landlord: landlordUser._id,
      joinRequest: new mongoose.Types.ObjectId(), // Dummy join request ID
      status: 'registered',
      monthlyRentAmount: 1000,
      securityDepositAmount: 500,
      securityDepositStatus: 'pending',
      securityDepositDueDate: dueDate,
      securityDepositReminders: [],
      monthlyRentDueDate: 1, // 1st of each month
      contractSignedDate: contractSignedDate,
      leaseStartDate: leaseStartDate,
      leaseEndDate: leaseEndDate,
      movingDate: movingDate,
      signedContract: {
        content: 'Test rental contract for security deposit testing purposes.',
        studentSignature: 'Test Student Signature',
        landlordSignature: 'Test Landlord Signature',
        generatedAt: contractSignedDate
      },
      propertyInfo: {
        title: 'Test Property - Security Deposit Test',
        address: '123 Test Street',
        city: 'Test City',
        bedrooms: 2,
        bathrooms: 1,
        furnishingStatus: 'Furnished'
      },
      studentInfo: {
        name: studentUser.name,
        email: studentUser.email
      },
      landlordInfo: {
        name: landlordUser.name,
        email: landlordUser.email
      },
      actionHistory: [{
        action: 'Contract Created for Testing',
        date: new Date(),
        notes: `Test rental with security deposit due in ${daysUntilDue} days`
      }]
    });

    console.log(`✓ Test rental created: ${rental._id}`);
    console.log(`  Security Deposit: $${rental.securityDepositAmount}`);
    console.log(`  Due Date: ${rental.securityDepositDueDate.toLocaleString()}`);
    console.log(`  Days Until Due: ${daysUntilDue}`);
    
    return rental;
  } catch (error) {
    console.error('Error creating test rental:', error);
    throw error;
  }
};

/**
 * Run the actual reminder check (same as cron job)
 */
const runReminderCheck = async () => {
  console.log('\n=== Running Security Deposit Deadline Check (Manual Trigger) ===');
  
  try {
    const now = new Date();
    console.log(`Current Time: ${now.toLocaleString()}`);

    // Find all rentals with pending security deposits
    const rentals = await Rental.find({
      status: 'registered',
      securityDepositStatus: 'pending'
    })
      .populate('student')
      .populate('landlord');

    console.log(`\nFound ${rentals.length} rental(s) with pending security deposits\n`);

    for (const rental of rentals) {
      const dueDate = new Date(rental.securityDepositDueDate);
      const timeDiff = dueDate - now;
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      console.log(`--- Rental ${rental._id} ---`);
      console.log(`  Property: ${rental.propertyInfo.title}`);
      console.log(`  Security Deposit: $${rental.securityDepositAmount}`);
      console.log(`  Due Date: ${dueDate.toLocaleString()}`);
      console.log(`  Days Remaining: ${daysRemaining}`);
      console.log(`  Reminders Sent: ${rental.securityDepositReminders.length}`);
      
      if (rental.securityDepositReminders.length > 0) {
        console.log(`  Last Reminder: ${rental.securityDepositReminders[rental.securityDepositReminders.length - 1].sentAt.toLocaleString()}`);
      }

      // Determine action
      if (daysRemaining < 0) {
        console.log(`  ⚠️  ACTION: OVERDUE - Will terminate rental`);
      } else if (daysRemaining === 4) {
        console.log(`  📧 ACTION: Will send 3-day reminder`);
      } else if (daysRemaining >= 1 && daysRemaining <= 3) {
        console.log(`  📧 ACTION: Will send daily reminder`);
      } else {
        console.log(`  ℹ️  ACTION: No action needed yet`);
      }
      console.log('');
    }

    // Actually run the check logic from the scheduler
    // We'll use the method from securityDepositScheduler
    await securityDepositScheduler.checkSecurityDepositDeadlines();

    console.log('=== Check Complete ===\n');
  } catch (error) {
    console.error('Error running reminder check:', error);
  }
};

/**
 * View status of all test rentals
 */
const viewTestRentals = async () => {
  console.log('\n=== Current Test Rentals ===');
  
  const rentals = await Rental.find({
    'propertyInfo.title': /Test Property/
  }).sort({ securityDepositDueDate: 1 });

  if (rentals.length === 0) {
    console.log('No test rentals found.');
    return;
  }

  const now = new Date();
  
  for (const rental of rentals) {
    const dueDate = new Date(rental.securityDepositDueDate);
    const timeDiff = dueDate - now;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    console.log(`\n--- Rental ${rental._id} ---`);
    console.log(`  Status: ${rental.status}`);
    console.log(`  Security Deposit Status: ${rental.securityDepositStatus}`);
    console.log(`  Due Date: ${dueDate.toLocaleString()}`);
    console.log(`  Days Remaining: ${daysRemaining}`);
    console.log(`  Reminders Sent: ${rental.securityDepositReminders.length}`);
    
    if (rental.securityDepositReminders.length > 0) {
      console.log(`  Reminder History:`);
      rental.securityDepositReminders.forEach(rem => {
        console.log(`    - ${rem.reminderType} (${rem.daysRemaining} days) at ${rem.sentAt.toLocaleString()}`);
      });
    }
    
    if (rental.status === 'terminated') {
      console.log(`  ❌ TERMINATED: ${rental.terminationReason}`);
      console.log(`  Terminated At: ${rental.terminatedAt.toLocaleString()}`);
    }
  }
};

/**
 * View notifications generated by the system
 */
const viewNotifications = async () => {
  console.log('\n=== Recent Notifications ===');
  
  const notifications = await Notification.find({
    type: { $in: ['security_deposit_reminder', 'contract_terminated'] }
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('recipient');

  if (notifications.length === 0) {
    console.log('No notifications found.');
    return;
  }

  for (const notif of notifications) {
    console.log(`\n[${notif.type}] ${notif.title}`);
    console.log(`  To: ${notif.recipient ? notif.recipient.user : 'Unknown'}`);
    console.log(`  Date: ${notif.createdAt.toLocaleString()}`);
    console.log(`  Read: ${notif.isRead ? 'Yes' : 'No'}`);
    console.log(`  Message: ${notif.message.substring(0, 100)}...`);
  }
};

/**
 * Clean up test rentals
 */
const cleanupTestRentals = async () => {
  console.log('\n=== Cleaning Up Test Rentals ===');
  
  const result = await Rental.deleteMany({
    'propertyInfo.title': /Test Property/
  });

  console.log(`✓ Deleted ${result.deletedCount} test rental(s)`);
  
  // Also clean up test notifications
  const notifResult = await Notification.deleteMany({
    type: { $in: ['security_deposit_reminder', 'contract_terminated'] },
    relatedModel: 'Rental'
  });
  
  console.log(`✓ Deleted ${notifResult.deletedCount} test notification(s)`);
};

/**
 * Main test menu
 */
const runTests = async () => {
  await connectDB();

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const showMenu = () => {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║     Security Deposit Reminder Testing System                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n📋 Test Scenarios:');
    console.log('  1. Create rental due in 7 days (no reminders yet)');
    console.log('  2. Create rental due in 4 days (3-day reminder)');
    console.log('  3. Create rental due in 3 days (daily reminder)');
    console.log('  4. Create rental due in 2 days (daily reminder)');
    console.log('  5. Create rental due in 1 day (urgent reminder)');
    console.log('  6. Create rental due TODAY (should terminate)');
    console.log('  7. Create rental OVERDUE by 1 day (should terminate immediately)');
    console.log('\n🔧 Actions:');
    console.log('  8. Run reminder check NOW (trigger the cron job manually)');
    console.log('  9. View all test rentals and their status');
    console.log('  10. View notifications generated');
    console.log('  11. Clean up all test rentals');
    console.log('  0. Exit');
    console.log('\n══════════════════════════════════════════════════════════════════');
  };

  const handleChoice = async (choice) => {
    try {
      switch (choice) {
        case '1':
          await createTestRental(7);
          break;
        case '2':
          await createTestRental(4);
          break;
        case '3':
          await createTestRental(3);
          break;
        case '4':
          await createTestRental(2);
          break;
        case '5':
          await createTestRental(1);
          break;
        case '6':
          await createTestRental(0);
          break;
        case '7':
          await createTestRental(-1);
          break;
        case '8':
          await runReminderCheck();
          break;
        case '9':
          await viewTestRentals();
          break;
        case '10':
          await viewNotifications();
          break;
        case '11':
          await cleanupTestRentals();
          break;
        case '0':
          console.log('\nExiting test system...');
          rl.close();
          await mongoose.connection.close();
          process.exit(0);
          break;
        default:
          console.log('\n❌ Invalid choice. Please try again.');
      }
    } catch (error) {
      console.error('\n❌ Error:', error.message);
    }

    // Show menu again
    showMenu();
    rl.question('\nEnter your choice: ', handleChoice);
  };

  // Start the menu
  showMenu();
  rl.question('\nEnter your choice: ', handleChoice);
};

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\n\nShutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the test system
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
