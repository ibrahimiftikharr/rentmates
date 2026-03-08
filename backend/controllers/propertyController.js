const Property = require('../models/propertyModel');
const Landlord = require('../models/landlordModel');
const { cloudinary } = require('../config/cloudinary');
const { calculate_expected_rent } = require('../utils/marketRent');
const { predictScam } = require('../utils/mlClient');

function normalizePropertyType(value) {
  if (!value) return value;
  const normalized = String(value).toLowerCase();
  const supported = new Set(['flat', 'house', 'studio']);
  return supported.has(normalized) ? normalized : 'flat';
}

function hasCityLevelMarketData(market) {
  return ['city_exact', 'city_fuzzy'].includes(market?.lookup_source);
}

function clearScamAssessment(property) {
  property.scam_prediction = null;
  property.scam_probability = null;
  property.scam_explanations = [];
  property.scam_summary = null;
  property.scam_checked_at = new Date();
}

// Asynchronous function to run ML prediction without blocking property creation
async function predictScamAsync(property, landlord) {
  try {
    if (property.priceRatio === null || property.priceRatio === undefined) {
      clearScamAssessment(property);
      await property.save();
      console.warn(`⚠️  Skipping ML scoring for "${property.title}" due to missing city-level market data`);
      return;
    }

    // Keep create/update/refresh paths aligned through one payload builder.
    const payload = buildMlPayload(property, landlord);

    const mlres = await predictScam(payload);

    // Ensure explanations have all required fields
    const processedExplanations = (mlres.scam_explanations || []).map(exp => ({
      feature: exp.feature || 'Unknown',
      impact: exp.impact || '',
      score: typeof exp.score === 'number' ? exp.score : null,
      direction: exp.direction || 'neutral'
    }));

    console.log(`📊 Processed explanations (${processedExplanations.length} total):`, JSON.stringify(processedExplanations.slice(0, 3), null, 2));

    // Update property with ML results
    await Property.findByIdAndUpdate(property._id, {
      scam_prediction: mlres.scam_prediction,
      scam_probability: mlres.scam_probability,
      scam_explanations: processedExplanations,
      scam_summary: mlres.summary || null,
      scam_checked_at: new Date()
    });

    const confidence = mlres.summary?.confidence ?? (mlres.scam_prediction ? mlres.scam_probability : (1 - mlres.scam_probability));
    console.log(`📋 Property ML Summary (${property.title}):`);
    console.log(`🎯 Prediction: ${mlres.scam_prediction ? '❌ SCAM' : '✅ LEGITIMATE'}`);
    console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log(`   Scam Probability: ${(mlres.scam_probability * 100).toFixed(1)}%`);
    console.log(`📊 Top Contributing Factors:`);
    if (mlres.scam_explanations && mlres.scam_explanations.length > 0) {
      mlres.scam_explanations.slice(0, 5).forEach((exp, idx) => {
        const emoji = exp.direction === 'increases' ? '🔴' : exp.direction === 'decreases' ? '🟢' : '⚪';
        const score = typeof exp.score === 'number' ? `${exp.score >= 0 ? '+' : ''}${exp.score.toFixed(3)}` : '0.000';
        console.log(`   ${idx + 1}. ${emoji} ${exp.feature}: ${score}`);
        console.log(`      ${exp.impact}`);
      });
    }
  } catch (mlErr) {
    console.error('ML API error (non-blocking):', mlErr.message);
    // Property creation continues even if ML fails
  }
}

function buildMlPayload(property, landlord) {
  const isNewProperty = (property.thumbsUpCount || 0) === 0 && (property.thumbsDownCount || 0) === 0;
  
  // If market lookup is unavailable, keep the ML input neutral instead of force-flagging.
  let priceRatio = property.priceRatio;
  if (priceRatio === null || priceRatio === undefined) {
    console.warn(`⚠️  Price ratio missing for property "${property.title}" - defaulting to 1.0 (neutral)`);
    priceRatio = 1.0;
  }
  
  // Strict type coercion to ensure ML service receives correct data types
  const payload = {
    priceRatio: parseFloat(priceRatio) || 1.0,
    depositRatio: parseFloat(property.depositRatio) || 0.0,
    depositTooHigh: Boolean(property.depositTooHigh),
    landlordVerified: !!(landlord?.governmentId && landlord?.govIdDocument),
    reputationScore: parseFloat(landlord?.reputationScore) || 0.0,
    nationalityMismatch: false,
    thumbsRatio: parseFloat(isNewProperty ? 0.5 : (property.thumbsRatio || 0.0)),
    minStayMonths: parseInt(property.minimumStay, 10) || 12,
    description_length: parseInt(property.description_length, 10) || 0,
    description_word_count: parseInt(property.description_word_count, 10) || 0,
    has_scam_keywords: Boolean(property.has_scam_keywords),
    review_count: parseInt(property.review_count, 10) || 0,
    isNewListing: isNewProperty
  };
  
  return payload;
}

function deriveCityCountry(address, city, country) {
  const nextCity = (city || '').trim();
  const nextCountry = (country || '').trim();
  if (nextCity && nextCountry) {
    return { city: nextCity, country: nextCountry };
  }

  const raw = (address || '').trim();
  if (!raw) {
    return { city: nextCity, country: nextCountry };
  }

  // Typical format: "street, city, state, country"
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
  const derivedCountry = nextCountry || (parts.length >= 1 ? parts[parts.length - 1] : '');
  // Handle common layouts:
  // - "street, city, state, country" -> city = 3rd from end
  // - "city, state, country" where state is short code (NY, CA) -> city = first part
  // - "city, region, country" -> city = first part
  // - "street, city, country" -> city = 2nd from end
  const looksLikeStateCode = (value) => /^[A-Za-z]{2,3}$/.test(String(value || '').trim());
  const looksLikeStreet = (value) => /\d/.test(String(value || ''));
  const derivedCity = nextCity || (
    parts.length >= 4
      ? parts[parts.length - 3]
      : (parts.length === 3 && looksLikeStateCode(parts[1])
        ? parts[0]
      : (parts.length === 3 && !looksLikeStreet(parts[0])
        ? parts[0]
      : (parts.length >= 2 ? parts[parts.length - 2] : '')
      )
      )
  );

  return { city: derivedCity, country: derivedCountry };
}

// ========================================
// CREATE PROPERTY
// ========================================
// helper to compute engineered features on a property instance
function computeFeatures(prop) {
  prop.type = normalizePropertyType(prop.type);

  // amenities count
  prop.amenitiesCount = (prop.amenities || []).length;
  // bills included count
  prop.billsIncludedCount = (prop.billsIncluded || []).length;
  // bills extra cost (sum of all billsCost values)
  let extra = 0;
  if (prop.billsCost) {
    for (let v of Object.values(prop.billsCost)) {
      extra += parseFloat(v) || 0;
    }
  }
  prop.billsExtraCost = extra;
  // included bills total
  let totalBillsCost = 0;
  if (prop.billsCost) {
    for (let v of Object.values(prop.billsCost)) {
      totalBillsCost += parseFloat(v) || 0;
    }
  }
  prop.includedBillsTotal = totalBillsCost - prop.billsExtraCost;

  // Derive location from address when possible to avoid missing market-rent lookups.
  const normalizedLocation = deriveCityCountry(prop.address, prop.city, prop.country);
  if (normalizedLocation.city && normalizedLocation.country) {
    prop.city = normalizedLocation.city;
    prop.country = normalizedLocation.country;
  }

  // Keep market rent and price ratio in sync with latest property fields.
  if (prop.city && prop.country && prop.bedrooms) {
    try {
      const market = calculate_expected_rent(
        prop.city,
        prop.country,
        parseInt(prop.bedrooms) || 0,
        prop.type,
        !!prop.furnished,
        prop.billsExtraCost || 0
      );
      if (hasCityLevelMarketData(market) && market.area_average_rent) {
        prop.areaAverageRent = market.area_average_rent;
      } else {
        prop.areaAverageRent = null;
      }
    } catch (marketErr) {
      console.warn('Market rent lookup failed during feature computation:', marketErr.message);
      prop.areaAverageRent = null;
    }
  }

  // deposit ratio
  if (prop.deposit && prop.price) {
    prop.depositRatio = prop.deposit / prop.price;
    // flag suspiciously high deposit
    prop.depositTooHigh = prop.depositRatio > 1.5;
  } else {
    prop.depositRatio = null;
    prop.depositTooHigh = false;
  }
  // price ratio (using areaAverageRent)
  if (prop.areaAverageRent && prop.price) {
    prop.priceRatio = prop.price / prop.areaAverageRent;
  } else {
    prop.priceRatio = null;
  }
  // thumbs ratio
  prop.thumbsRatio = (prop.thumbsUpCount || 0) / ((prop.thumbsUpCount || 0) + (prop.thumbsDownCount || 0) + 1);
  // has reviews
  prop.hasReviews = (prop.reviews || '').length > 2;
  // is new listing
  prop.isNewListing = ((prop.thumbsUpCount || 0) === 0) && ((prop.thumbsDownCount || 0) === 0);
  // scam keyword count
  const scamKeywords = ['urgent', 'amazing', 'wire transfer', 'western union', 'overseas', 'no viewing', 'cash only', 'cryptocurrency'];
  prop.scamKeywordCount = scamKeywords.reduce((count, kw) => count + ((prop.description || '').toLowerCase().includes(kw.toLowerCase()) ? 1 : 0), 0);

  // Aggregated text features for hybrid approach
  prop.description_length = (prop.description || '').length;
  prop.description_word_count = (prop.description || '').split(/\s+/).filter(word => word.length > 0).length;
  prop.has_scam_keywords = /urgent|wire|paypal|bitcoin|western union|gift card/i.test(prop.description || '');
  prop.review_count = (prop.reviews || '').split(/\s+/).filter(word => word.length > 0).length;
}

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
      city,
      country,
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

    const normalizedType = normalizePropertyType(type);

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

    // Compute extra bills cost (bills NOT included in base rent)
    let billsExtraTotal = 0;
    const parsedBillsIncludedRaw = parseIfString(billsIncluded);
    const parsedBillsIncluded = Array.isArray(parsedBillsIncludedRaw) ? parsedBillsIncludedRaw : [];
    const billKeyMap = { 'wifi': 'wifi', 'water': 'water', 'electricity': 'electricity', 'gas': 'gas', 'council tax': 'councilTax', 'counciltax': 'councilTax' };
    
    if (billPrices || (req.body.billsCost)) {
      // Use billsCost if provided (new structure), fall back to billPrices (legacy)
      const costObjRaw = parseIfString(req.body.billsCost) || parseIfString(billPrices);
      const costObj = costObjRaw && typeof costObjRaw === 'object' ? costObjRaw : null;
      if (costObj) {
        for (const billName of Object.keys(billKeyMap)) {
          const billKey = billKeyMap[billName];
          // Only count bills that are NOT in the billsIncluded array
          const isIncluded = parsedBillsIncluded.some(b => b.toLowerCase() === billName);
          if (!isIncluded && costObj[billKey]) {
            billsExtraTotal += parseFloat(costObj[billKey]) || 0;
          }
        }
      }
    }

    // Fill missing city/country from address so rent lookup can work.
    const normalizedLocation = deriveCityCountry(address, city, country);

    // Compute market rent insights using lookup table
    const bedroomCount = parseInt(bedrooms) || 0;
    const furnishedBool = furnished === 'true' || furnished === true;
    let market = { area_average_rent: null, insight: 'market lookup unavailable' };
    try {
      market = calculate_expected_rent(
        normalizedLocation.city,
        normalizedLocation.country,
        bedroomCount,
        normalizedType,
        furnishedBool,
        billsExtraTotal
      );
    } catch (marketErr) {
      console.warn('Market rent lookup failed during createProperty:', marketErr.message);
    }
    let finalAreaAverageRent = hasCityLevelMarketData(market) ? market.area_average_rent : null;

    // Create property
    const property = new Property({
      landlord: landlord._id,
      title,
      description,
      type: normalizedType,
      address,
      city: normalizedLocation.city,
      country: normalizedLocation.country,
      bedrooms: bedroomCount,
      bathrooms: parseInt(bathrooms),
      area: area ? parseFloat(area) : undefined,
      furnished: furnishedBool,
      price: parseFloat(price),
      deposit: deposit ? parseFloat(deposit) : undefined,
      areaAverageRent: finalAreaAverageRent,
      // other counts will be recomputed below
      amenities: parseIfString(amenities) || [],
      billsIncluded: parsedBillsIncluded,
      billsCost: parseIfString(req.body.billsCost) || parseIfString(billPrices),
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

    // recompute and persist engineered features
    computeFeatures(property);

    // Save property with computed features
    await property.save();

    console.log('✓ Property created successfully');

    // consult ML API if property is active (non-blocking)
    if (property.status === 'active') {
      // Run ML prediction asynchronously - don't block property creation
      predictScamAsync(property, landlord);
    }

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      property: {
        id: property._id,
        title: property.title,
        type: property.type,
        address: property.address,
        city: property.city,
        country: property.country,
        price: property.price,
        deposit: property.deposit,
        areaAverageRent: finalAreaAverageRent,
        priceRatio: property.priceRatio,
        depositRatio: property.depositRatio,
        amenitiesCount: property.amenitiesCount,
        billsIncludedCount: property.billsIncludedCount,
        billsExtraCost: property.billsExtraCost,
        scam_prediction: property.scam_prediction,
        scam_probability: property.scam_probability,
        scam_explanations: property.scam_explanations,
        scam_summary: property.scam_summary,
        images: property.images,
        status: property.status
      },
      fraudDetectionFeatures: {
        price: property.price,
        deposit: property.deposit,
        areaAverageRent: finalAreaAverageRent,
        priceRatio: property.priceRatio,
        depositRatio: property.depositRatio,
        amenitiesCount: property.amenitiesCount,
        billsIncludedCount: property.billsIncludedCount,
        billsExtraCost: property.billsExtraCost,
        totalMonthlyEstimate: property.price + property.billsExtraCost
      },
      marketInsight: market.insight
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
        city: prop.city,
        country: prop.country,
        price: prop.price,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        mainImage: prop.mainImage,
        images: prop.images,
        status: prop.status,
        deposit: prop.deposit,
        depositRatio: prop.depositRatio,
        areaAverageRent: prop.areaAverageRent,
        priceRatio: prop.priceRatio,
        amenitiesCount: prop.amenitiesCount,
        billsIncludedCount: prop.billsIncludedCount,
        billsExtraCost: prop.billsExtraCost,
        views: prop.views,
        wishlistCount: prop.wishlistCount,
        scam_prediction: prop.scam_prediction,
        scam_probability: prop.scam_probability,
        scam_explanations: prop.scam_explanations,
        scam_summary: prop.scam_summary,
        scam_checked_at: prop.scam_checked_at,
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

    // Debug: Log scam fields before response
    console.log(`✅ GET /properties/${id} - Scam fields being sent:`);
    console.log(`   scam_prediction: ${property.scam_prediction}`);
    console.log(`   scam_probability: ${property.scam_probability}`);
    console.log(`   scam_explanations: ${property.scam_explanations ? JSON.stringify(property.scam_explanations.slice(0, 1)) : 'null'}`);
    console.log(`   scam_summary: ${property.scam_summary ? JSON.stringify(property.scam_summary).substring(0, 100) : 'null'}`);
    console.log(`   scam_checked_at: ${property.scam_checked_at}`);

    // Apply privacy settings if landlord has them configured
    if (property.landlord && property.landlord.privacySettings) {
      const privacySettings = property.landlord.privacySettings;
      
      // Create a sanitized landlord object respecting privacy settings
      const sanitizedLandlord = {
        ...property.landlord.toObject(),
        email: privacySettings.showEmail ? property.landlord.user?.email : null,
        phone: privacySettings.showPhone ? property.landlord.phone : null,
        nationality: privacySettings.showNationality ? property.landlord.nationality : null,
        user: {
          ...property.landlord.user?.toObject(),
          email: privacySettings.showEmail ? property.landlord.user?.email : null
        }
      };
      
      // Return property with sanitized landlord data
      const propertyObj = property.toObject();
      propertyObj.landlord = sanitizedLandlord;
      
      return res.status(200).json({
        success: true,
        property: propertyObj
      });
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
      'title', 'description', 'type', 'address', 'city', 'country',
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
        } else if (field === 'type') {
          property[field] = normalizePropertyType(req.body[field]);
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
    if (req.body.billPrices || req.body.billsCost) {
      console.log('💰 Bill prices updated:', property.billPrices || req.body.billsCost);
    }

    // recompute engineered features now that updates are applied
    computeFeatures(property);

    // if property is active run scam check
    if (property.status === 'active') {
      try {
        if (property.priceRatio === null || property.priceRatio === undefined) {
          clearScamAssessment(property);
          console.warn(`⚠️  Skipping ML scoring for "${property.title}" during update: city market data unavailable`);
        } else {
          const payload = buildMlPayload(property, landlord);
          const mlres = await predictScam(payload);
          property.scam_prediction = mlres.scam_prediction;
          property.scam_probability = mlres.scam_probability;
          property.scam_explanations = mlres.scam_explanations || [];
          property.scam_summary = mlres.summary || null;
          property.scam_checked_at = new Date();
        }
      } catch (mlErr) {
        console.error('ML API error during update:', mlErr.message);
      }
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
// REFRESH PROPERTY SCAM ANALYSIS
// ========================================
const refreshPropertyScam = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id).populate('landlord');

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only active properties can be assessed' });
    }

    if (!property.landlord) {
      return res.status(400).json({ success: false, message: 'Property landlord details missing' });
    }

    // Recompute features and market-rent dependent ratios before prediction.
    computeFeatures(property);
    const beds = parseInt(property.bedrooms) || 0;
    const refreshDebug = {
      cityUsed: property.city || null,
      countryUsed: property.country || null,
      lookupSource: 'not_attempted',
      computedAreaAverageRent: property.areaAverageRent ?? null,
      finalPriceRatio: property.priceRatio ?? null
    };

    let marketDataUnavailable = false;
    let marketDataMessage = '';

    try {
      const market = calculate_expected_rent(
        property.city,
        property.country,
        beds,
        property.type,
        !!property.furnished,
        property.billsExtraCost || 0
      );

      refreshDebug.lookupSource = market.lookup_source || 'not_found';

      if (hasCityLevelMarketData(market) && market.area_average_rent) {
        property.areaAverageRent = market.area_average_rent;
        property.priceRatio = property.price && property.areaAverageRent
          ? (property.price / property.areaAverageRent)
          : null;
      } else {
        property.areaAverageRent = null;
        property.priceRatio = null;
        marketDataUnavailable = true;
        marketDataMessage = 'Market data for this city is not available at the moment.';
      }

      refreshDebug.computedAreaAverageRent = property.areaAverageRent ?? null;
      refreshDebug.finalPriceRatio = property.priceRatio ?? null;
    } catch (marketErr) {
      console.warn('Market rent lookup failed during refreshPropertyScam:', marketErr.message);
      refreshDebug.lookupSource = 'lookup_error';
      property.areaAverageRent = null;
      property.priceRatio = null;
      marketDataUnavailable = true;
      marketDataMessage = 'Market data for this city is not available at the moment.';
    }

    if (marketDataUnavailable || property.priceRatio === null || property.priceRatio === undefined) {
      clearScamAssessment(property);
      await property.save();
      return res.status(200).json({
        success: true,
        marketDataUnavailable: true,
        message: marketDataMessage || 'Market data for this city is not available at the moment.',
        property,
        debug: refreshDebug
      });
    }

    const landlord = property.landlord;
    const payload = buildMlPayload(property, landlord);
    let mlres;
    try {
      mlres = await predictScam(payload);
    } catch (mlErr) {
      console.error('ML API error during refreshPropertyScam:', mlErr.message);
      // Persist recomputed market features/type normalization even when ML is temporarily unavailable.
      await property.save();
      return res.status(503).json({
        success: false,
        message: 'Scam analysis service unavailable. Please try again in a moment.',
        error: mlErr.message,
        debug: refreshDebug
      });
    }

    property.scam_prediction = mlres.scam_prediction;
    property.scam_probability = mlres.scam_probability;
    property.scam_explanations = mlres.scam_explanations || [];
    property.scam_summary = mlres.summary || null;
    property.scam_checked_at = new Date();

    await property.save();

    return res.status(200).json({
      success: true,
      message: 'Scam analysis refreshed',
      property,
      debug: refreshDebug
    });
  } catch (error) {
    console.error('Refresh property scam error:', error);
    return res.status(500).json({ success: false, message: 'Failed to refresh scam analysis', error: error.message });
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
    
    // Debug: Log first property's scam fields
    if (properties.length > 0) {
      const firstProp = properties[0];
      console.log(`✅ SCAM FIELDS for first property (${firstProp.title}):`);
      console.log(`   scam_prediction: ${firstProp.scam_prediction}`);
      console.log(`   scam_probability: ${firstProp.scam_probability}`);
      console.log(`   scam_explanations count: ${firstProp.scam_explanations?.length || 0}`);
      console.log(`   scam_summary present: ${!!firstProp.scam_summary}`);
      console.log(`   scam_checked_at: ${firstProp.scam_checked_at}`);
    }
    
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
        city: prop.city,
        country: prop.country,
        price: prop.price,
        deposit: prop.deposit,
        depositRatio: prop.depositRatio,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        area: prop.area,
        furnished: prop.furnished,
        areaAverageRent: prop.areaAverageRent,
        priceRatio: prop.priceRatio,
        amenities: prop.amenities,
        amenitiesCount: prop.amenitiesCount,
        billsIncluded: prop.billsIncluded,
        billsIncludedCount: prop.billsIncludedCount,
        billsCost: prop.billsCost,
        billsExtraCost: prop.billsExtraCost,
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
        // Include scam detection data
        scam_prediction: prop.scam_prediction,
        scam_probability: prop.scam_probability,
        scam_explanations: prop.scam_explanations,
        scam_summary: prop.scam_summary,
        scam_checked_at: prop.scam_checked_at,
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
  getAllProperties,
  refreshPropertyScam
};
