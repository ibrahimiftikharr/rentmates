const mongoose = require('mongoose');
const Property = require('./models/propertyModel');
require('dotenv').config();

const LANDLORD_ID = '6910bf31216bb1f03a50cf6f';

const mockProperties = [
  {
    title: 'Modern Studio near Campus',
    price: 850,
    type: 'studio',
    images: [
      'https://images.unsplash.com/photo-1610123172763-1f587473048f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    mainImage: 'https://images.unsplash.com/photo-1610123172763-1f587473048f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwc3R1ZGlvJTIwYXBhcnRtZW50fGVufDF8fHx8MTc2MjMyMTM3OXww&ixlib=rb-4.1.0&q=80&w=1080',
    address: '42 Park End Street, Oxford, OX1 1HP',
    billsIncluded: ['Gas', 'Electricity'],
    bedrooms: 1,
    bathrooms: 1,
    area: 450,
    description: 'A beautiful modern studio apartment located just 0.5 miles from Oxford University campus. Perfect for students looking for a comfortable and convenient living space. Features contemporary design, ample natural light, and all essential amenities.',
    furnished: true,
    deposit: 850,
    amenities: ['WiFi', 'Central Heating', 'Double Glazing', 'Study Desk', 'Wardrobe'],
    availableFrom: new Date('2025-09-01'),
    minimumStay: 6,
    maximumStay: 12,
    status: 'active',
    billPrices: {
      wifi: 0,
      water: 25,
      electricity: 0,
      gas: 0,
      councilTax: 0
    }
  },
  {
    title: 'Spacious 2-Bed Flat with Garden',
    price: 1200,
    type: 'flat',
    images: [
      'https://images.unsplash.com/photo-1757780993465-7f1923296763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    mainImage: 'https://images.unsplash.com/photo-1757780993465-7f1923296763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBmbGF0JTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYyNDI2ODg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    address: '28 Mill Road, Cambridge, CB1 2AD',
    billsIncluded: [],
    bedrooms: 2,
    bathrooms: 1,
    area: 750,
    description: 'Spacious 2-bedroom flat with access to a private garden, ideal for sharing. Located 1.2 miles from Cambridge University, this property offers generous living space and outdoor area perfect for relaxation and study.',
    furnished: true,
    deposit: 1200,
    amenities: ['WiFi', 'Garden Access', 'Parking Space', 'Washing Machine', 'Dishwasher', 'Central Heating'],
    availableFrom: new Date('2025-08-15'),
    minimumStay: 12,
    maximumStay: 24,
    status: 'active',
    billPrices: {
      wifi: 30,
      water: 35,
      electricity: 60,
      gas: 50,
      councilTax: 0
    }
  },
  {
    title: 'Cozy Student House - 4 Bedrooms',
    price: 1800,
    type: 'house',
    images: [
      'https://images.unsplash.com/photo-1583430312373-0fb9d4e0c4ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    mainImage: 'https://images.unsplash.com/photo-1583430312373-0fb9d4e0c4ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwaG91c2UlMjByZW50YWx8ZW58MXx8fHwxNzYyNDM0ODQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    address: '156 Cowley Road, Oxford, OX4 1UE',
    billsIncluded: ['Gas', 'Electricity'],
    bedrooms: 4,
    bathrooms: 2,
    area: 1200,
    description: 'Perfect student house for a group of 4, featuring spacious rooms and communal areas. Just 0.8 miles from Oxford University. Ideal for students seeking a home-like environment with plenty of space.',
    furnished: true,
    deposit: 1800,
    amenities: ['WiFi', 'Garden', 'Living Room', 'Kitchen Diner', 'Parking', 'Storage Space', 'Central Heating'],
    availableFrom: new Date('2025-09-01'),
    minimumStay: 12,
    maximumStay: 24,
    status: 'active',
    billPrices: {
      wifi: 35,
      water: 45,
      electricity: 0,
      gas: 0,
      councilTax: 0
    },
    views: 45,
    wishlistCount: 8
  },
  {
    title: 'Luxury Apartment in City Centre',
    price: 1500,
    type: 'flat',
    images: [
      'https://images.unsplash.com/photo-1758471576052-a7e3d287a7ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1574643156929-51fa098b0394?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    mainImage: 'https://images.unsplash.com/photo-1758471576052-a7e3d287a7ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwYXBhcnRtZW50JTIwZXh0ZXJpb3J8ZW58MXx8fHwxNzYyNDM0ODQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    address: '8 Market Street, Cambridge, CB2 3QE',
    billsIncluded: ['Gas'],
    bedrooms: 3,
    bathrooms: 2,
    area: 950,
    description: 'Luxury 3-bedroom apartment in the heart of Cambridge city centre. High-spec finishes throughout, modern appliances, and excellent transport links. Located 2.1 miles from Cambridge University.',
    furnished: true,
    deposit: 1500,
    amenities: ['WiFi', 'Gym Access', 'Concierge', 'Balcony', 'Modern Kitchen', 'Ensuite', 'Central Heating', 'Double Glazing'],
    availableFrom: new Date('2025-07-01'),
    minimumStay: 6,
    maximumStay: 18,
    status: 'active',
    billPrices: {
      wifi: 40,
      water: 40,
      electricity: 70,
      gas: 0,
      councilTax: 0
    },
    views: 67,
    wishlistCount: 12
  },
  {
    title: 'Affordable Studio Close to Library',
    price: 650,
    type: 'studio',
    images: [
      'https://images.unsplash.com/photo-1610123172763-1f587473048f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    mainImage: 'https://images.unsplash.com/photo-1610123172763-1f587473048f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwc3R1ZGlvJTIwYXBhcnRtZW50fGVufDF8fHx8MTc2MjMyMTM3OXww&ixlib=rb-4.1.0&q=80&w=1080',
    address: '90 High Street, Oxford, OX1 4BG',
    billsIncluded: ['Gas', 'Electricity'],
    bedrooms: 1,
    bathrooms: 1,
    area: 400,
    description: 'Compact and affordable studio apartment perfect for budget-conscious students. Only 0.3 miles from Oxford University and very close to the main library. Great location for academic life.',
    furnished: true,
    deposit: 650,
    amenities: ['WiFi', 'Kitchenette', 'Study Area', 'Storage', 'Central Heating'],
    availableFrom: new Date('2025-09-15'),
    minimumStay: 6,
    maximumStay: 12,
    status: 'active',
    billPrices: {
      wifi: 0,
      water: 20,
      electricity: 0,
      gas: 0,
      councilTax: 0
    },
    views: 23,
    wishlistCount: 3
  },
  {
    title: 'Victorian House Share',
    price: 950,
    type: 'house',
    images: [
      'https://images.unsplash.com/photo-1583430312373-0fb9d4e0c4ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    ],
    mainImage: 'https://images.unsplash.com/photo-1583430312373-0fb9d4e0c4ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwaG91c2UlMjByZW50YWx8ZW58MXx8fHwxNzYyNDM0ODQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    address: '34 Victoria Avenue, Cambridge, CB4 3DU',
    billsIncluded: [],
    bedrooms: 3,
    bathrooms: 2,
    area: 1000,
    description: 'Charming Victorian house with period features and modern conveniences. Perfect for 3 students looking for character and space. Located 1.5 miles from Cambridge University with excellent bus links.',
    furnished: true,
    deposit: 950,
    amenities: ['WiFi', 'Garden', 'Original Features', 'Living Room', 'Dining Room', 'Off-Street Parking', 'Central Heating'],
    availableFrom: new Date('2025-08-01'),
    minimumStay: 12,
    maximumStay: 24,
    status: 'active',
    billPrices: {
      wifi: 30,
      water: 40,
      electricity: 65,
      gas: 55,
      councilTax: 0
    },
    views: 31,
    wishlistCount: 5
  }
];

async function seedProperties() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ibrahimiftikhar0864_db_user:iUKh7mLZxiEUYjbQ@rentmates.a4rija4.mongodb.net/?appName=RentMates';
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    // Verify landlord ID format
    if (!mongoose.Types.ObjectId.isValid(LANDLORD_ID)) {
      throw new Error('Invalid landlord ID format');
    }

    // Add landlord ID to all properties
    const propertiesWithLandlord = mockProperties.map(property => ({
      ...property,
      landlord: LANDLORD_ID
    }));

    // Clear existing properties for this landlord (optional - comment out if you want to keep existing)
    // await Property.deleteMany({ landlord: LANDLORD_ID });
    // console.log('Cleared existing properties for landlord');

    // Insert new properties
    const result = await Property.insertMany(propertiesWithLandlord);
    
    console.log(`\n✅ Successfully seeded ${result.length} properties!`);
    console.log('\nProperty IDs:');
    result.forEach((property, index) => {
      console.log(`  ${index + 1}. ${property.title} - ID: ${property._id}`);
    });

    // Display summary
    console.log('\n📊 Summary:');
    console.log(`  - Total Properties: ${result.length}`);
    console.log(`  - Studios: ${result.filter(p => p.type === 'studio').length}`);
    console.log(`  - Flats: ${result.filter(p => p.type === 'flat').length}`);
    console.log(`  - Houses: ${result.filter(p => p.type === 'house').length}`);
    console.log(`  - Price Range: £${Math.min(...result.map(p => p.price))} - £${Math.max(...result.map(p => p.price))}`);
    
  } catch (error) {
    console.error('❌ Error seeding properties:', error.message);
    console.error(error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed function
seedProperties();
