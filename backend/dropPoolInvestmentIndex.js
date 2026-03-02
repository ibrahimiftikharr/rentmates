const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Rentmates';

async function dropIndex() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('poolinvestments');

    // Get existing indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the unique compound index
    try {
      await collection.dropIndex('investor_1_pool_1');
      console.log('\n✅ Successfully dropped unique index: investor_1_pool_1');
      console.log('✨ Users can now invest multiple times in the same pool!');
    } catch (error) {
      if (error.code === 27) {
        console.log('\n⚠️  Index not found (already dropped or never existed)');
      } else {
        throw error;
      }
    }

    // Show updated indexes
    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await collection.indexes();
    updatedIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n🎉 Index management completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error dropping index:', error);
    process.exit(1);
  }
}

// Run the script
dropIndex();
