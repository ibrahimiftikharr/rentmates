/**
 * Migration script to initialize rent cycles for existing rentals
 * Run this once to populate currentRentCycle field for all active rentals
 */

const mongoose = require('mongoose');
const Rental = require('../models/rentalModel');
require('dotenv').config();

async function migrateRentCycles() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Find all rentals without currentRentCycle initialized
    const rentals = await Rental.find({
      status: { $in: ['registered', 'active'] },
      $or: [
        { currentRentCycle: { $exists: false } },
        { 'currentRentCycle.forMonth': { $exists: false } }
      ]
    });

    console.log(`\nFound ${rentals.length} rentals to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const rental of rentals) {
      try {
        console.log(`\nProcessing rental ${rental._id}...`);
        console.log(`  Property: ${rental.propertyInfo.title}`);
        console.log(`  Lease Start: ${rental.leaseStartDate}`);
        console.log(`  Monthly Rent: $${rental.monthlyRentAmount}`);

        // Initialize rent cycle
        rental.initializeRentCycle();

        // Save the rental
        await rental.save();

        console.log('  ✓ Initialized:', {
          forMonth: rental.currentRentCycle.forMonth,
          forYear: rental.currentRentCycle.forYear,
          dueDate: rental.currentRentCycle.dueDate.toISOString(),
          paymentWindowStart: rental.currentRentCycle.paymentWindowStart.toISOString(),
          amount: rental.currentRentCycle.amount
        });

        successCount++;
      } catch (error) {
        console.error(`  ✗ Error processing rental ${rental._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`✓ Successfully migrated: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`Total processed: ${rentals.length}`);

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateRentCycles();
