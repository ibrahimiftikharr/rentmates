const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Rentmates';
    
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // List of collections to clear
    const collections = [
      'users', 'landlords', 'students', 'investors',
      'properties', 'rentals', 'joinrequests', 'visitrequests',
      'transactions', 'notifications', 'messages', 'conversations',
      'loans', 'investmentpools', 'poolinvestments', 'reviews'
    ];

    for (const collectionName of collections) {
      try {
        await mongoose.connection.collection(collectionName).deleteMany({});
        console.log(`✓ Cleared collection: ${collectionName}`);
      } catch (err) {
        console.log(`  (Collection ${collectionName} may not exist)`);
      }
    }

    console.log('\n✅ Database has been reset!');
    console.log('Run "node seedProperties.js" to add demo properties.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

resetDatabase();
