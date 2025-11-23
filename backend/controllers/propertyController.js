const Property = require('../models/propertyModel');
const Landlord = require('../models/landlordModel');
const { cloudinary } = require('../config/cloudinary');

// ========================================
// CREATE PROPERTY
// ========================================
const createProperty = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find landlord
    const landlord = await Landlord.findOne({ user: userId });
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord profile not found' });
    }

    // Check if profile is complete
    if (!landlord.isProfileComplete) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please complete your profile information before adding a property' 
      });
    }

    const {
      title,
      description,
      type,
      address,
      bedrooms,
      bathrooms,
      area,
      furnished,
      price,
      deposit,
      amenities,
      billsIncluded,
      billPrices,
      availableFrom,
      minimumStay,
      maximumStay,
      availabilityDates,
      moveInBy,
      houseRules
    } = req.body;

    console.log('📅 Raw availabilityDates from request:', availabilityDates);
    console.log('📅 Type:', typeof availabilityDates);
    
    // Helper function to parse JSON or return value if already parsed
    const parseIfString = (value) => {
      if (!value) return undefined;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return value;
    };

    // Create property
    const property = new Property({
      landlord: landlord._id,
      title,
      description,
      type,
      address,
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      area: area ? parseFloat(area) : undefined,
      furnished: furnished === 'true' || furnished === true,
      price: parseFloat(price),
      deposit: deposit ? parseFloat(deposit) : undefined,
      amenities: parseIfString(amenities) || [],
      billsIncluded: parseIfString(billsIncluded) || [],
      billPrices: parseIfString(billPrices),
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
      minimumStay: minimumStay ? parseInt(minimumStay) : undefined,
      maximumStay: maximumStay ? parseInt(maximumStay) : undefined,
      availabilityDates: parseIfString(availabilityDates) ? parseIfString(availabilityDates).map((d) => new Date(d)) : [],
      moveInBy: moveInBy ? new Date(moveInBy) : undefined,
      houseRules: parseIfString(houseRules) || { petsAllowed: false, smokingAllowed: false, guestsAllowed: true },
      images: [],
      status: 'active'
    });

    console.log('Availability dates parsed:', property.availabilityDates);
    console.log('Move in by:', property.moveInBy);
    console.log('House rules:', property.houseRules);

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      property.images = req.files.map(file => file.path);
      property.mainImage = req.files[0].path; // First image as main
    }

    await property.save();

    // Add property to landlord's properties array
    landlord.properties.push(property._id);
    
    // Increase reputation score for adding a property
    landlord.reputationScore = Math.min(100, landlord.reputationScore + 5);
    await landlord.save();

    console.log('✓ Property created:', property.title);

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      property: {
        id: property._id,
        title: property.title,
        type: property.type,
        city: property.city,
        price: property.price,
        images: property.images,
        status: property.status
      }
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ success: false, message: 'Failed to create property', error: error.message });
  }
};

// ========================================
// GET ALL PROPERTIES FOR LANDLORD
// ========================================
const getMyProperties = async (req, res) => {
  try {
    const userId = req.user.id;

    const landlord = await Landlord.findOne({ user: userId });
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord profile not found' });
    }

    const properties = await Property.find({ landlord: landlord._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      properties: properties.map(prop => ({
        id: prop._id,
        title: prop.title,
        type: prop.type,
        address: prop.address,
        price: prop.price,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        mainImage: prop.mainImage,
        images: prop.images,
        status: prop.status,
        views: prop.views,
        wishlistCount: prop.wishlistCount,
        createdAt: prop.createdAt
      }))
    });
  } catch (error) {
    console.error('Get my properties error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch properties' });
  }
};

// ========================================
// GET SINGLE PROPERTY
// ========================================
const getProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id).populate({
      path: 'landlord',
      populate: {
        path: 'user',
        select: 'name email'
      }
    });
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.status(200).json({
      success: true,
      property
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch property' });
  }
};

// ========================================
// UPDATE PROPERTY
// ========================================
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const landlord = await Landlord.findOne({ user: userId });
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord profile not found' });
    }

    const property = await Property.findOne({ _id: id, landlord: landlord._id });
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found or unauthorized' });
    }

    // Update fields
    const allowedUpdates = [
      'title', 'description', 'type', 'address', 'city', 'country', 'postalCode',
      'university', 'distance', 'bedrooms', 'bathrooms', 'area', 'furnished',
      'price', 'deposit', 'amenities', 'billsIncluded', 'billPrices', 'availableFrom',
      'minimumStay', 'maximumStay', 'availabilityDates', 'moveInBy', 'houseRules', 'status'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'availabilityDates' && Array.isArray(req.body[field])) {
          property[field] = req.body[field].map(d => new Date(d));
        } else if (field === 'moveInBy' && req.body[field]) {
          property[field] = new Date(req.body[field]);
        } else {
          property[field] = req.body[field];
        }
      }
    });

    console.log('✓ Property updated:', property.title);
    console.log('Updated fields:', Object.keys(req.body));
    if (req.body.availabilityDates) {
      console.log('📅 Availability dates updated:', property.availabilityDates);
    }
    if (req.body.houseRules) {
      console.log('🏠 House rules updated:', property.houseRules);
    }
    if (req.body.billPrices) {
      console.log('💰 Bill prices updated:', property.billPrices);
    }

    property.updatedAt = Date.now();
    await property.save();

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      property
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ success: false, message: 'Failed to update property' });
  }
};

// ========================================
// DELETE PROPERTY
// ========================================
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const landlord = await Landlord.findOne({ user: userId });
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord profile not found' });
    }

    const property = await Property.findOne({ _id: id, landlord: landlord._id });
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found or unauthorized' });
    }

    // Delete images from Cloudinary
    if (property.images && property.images.length > 0) {
      for (const imageUrl of property.images) {
        try {
          const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      }
    }

    // Remove property from landlord's properties array
    landlord.properties = landlord.properties.filter(propId => propId.toString() !== id);
    await landlord.save();

    // Delete property
    await Property.findByIdAndDelete(id);

    console.log('✓ Property deleted:', property.title);

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete property' });
  }
};

// ========================================
// GET ALL ACTIVE PROPERTIES (For Students)
// ========================================
const getAllProperties = async (req, res) => {
  try {
    console.log('Fetching all active properties...');
    
    const properties = await Property.find({ status: 'active' })
      .populate({
        path: 'landlord',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    console.log(`Found ${properties.length} active properties`);
    
    // Log any properties without landlord populated
    properties.forEach((prop, idx) => {
      if (!prop.landlord) {
        console.warn(`Property ${idx + 1} (${prop.title}) has no landlord!`);
      }
    });

    res.status(200).json({
      success: true,
      properties: properties.map(prop => ({
        id: prop._id,
        title: prop.title,
        description: prop.description,
        type: prop.type,
        address: prop.address,
        price: prop.price,
        deposit: prop.deposit,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        area: prop.area,
        furnished: prop.furnished,
        amenities: prop.amenities,
        billsIncluded: prop.billsIncluded,
        billPrices: prop.billPrices,
        mainImage: prop.mainImage,
        images: prop.images,
        availableFrom: prop.availableFrom,
        minimumStay: prop.minimumStay,
        maximumStay: prop.maximumStay,
        availabilityDates: prop.availabilityDates,
        moveInBy: prop.moveInBy,
        houseRules: prop.houseRules,
        status: prop.status,
        views: prop.views,
        wishlistCount: prop.wishlistCount,
        landlord: prop.landlord,
        createdAt: prop.createdAt
      }))
    });
  } catch (error) {
    console.error('Get all properties error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch properties' });
  }
};

module.exports = {
  createProperty,
  getMyProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  getAllProperties
};
