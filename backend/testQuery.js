const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/student-housing')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false }));
    
    const count = await Property.countDocuments({ status: 'active' });
    console.log(`\nTotal active properties: ${count}`);
    
    const latest = await Property.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    
    console.log('\nLatest 3 active properties:');
    latest.forEach((prop, idx) => {
      console.log(`\n${idx + 1}. ${prop.title}`);
      console.log(`   ID: ${prop._id}`);
      console.log(`   Status: ${prop.status}`);
      console.log(`   Landlord: ${prop.landlord}`);
      console.log(`   Created: ${prop.createdAt}`);
    });
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
