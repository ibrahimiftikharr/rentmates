# Platform ↔ Scam Detection Dataset Mapping

## Summary of Changes Made

### ✅ Backend Model Updated
- **Old Field**: `billPrices` (ambiguous - all bills)
- **New Field**: `billsCost` (only bills NOT included)
- **New Field**: `billsExtraCost` (total extra monthly cost)
- **New Field**: `priceRatio` (price / market average)
- **Renamed**: `billsIncludedCount` clarified as count of included bills

### ✅ Controller Logic Fixed
- **Before**: Summed ALL bill prices (confusing)
- **After**: Only sums costs for bills NOT in `billsIncluded` array
- **Result**: `billsExtraCost` represents true out-of-pocket bill costs

### ✅ Frontend Display Alignment
- Property type enum: `['flat', 'house', 'studio']` (apartment removed)
- Bills breakdown: Correctly shows included vs extra costs
- Total monthly estimate: `price + billsExtraCost`

---

## Dataset Feature Mapping

### CSV Dataset → Platform Property

```python
# If your CSV has these columns:
price → property.price
bedrooms → property.bedrooms
bathrooms → property.bathrooms
area → property.area
furnished → property.furnished
city → property.city
country → property.country
property_type → property.type

# These are CALCULATED by platform:
area_average_rent → property.areaAverageRent (from CSV lookup)
price_ratio → property.priceRatio (calculated)
amenities_count → property.amenitiesCount (length of array)
bills_included_count → property.billsIncludedCount (length of array)
bills_excluded_cost → property.billsExtraCost (sum of extra bills)
```

---

## API Response Structure

### Property Creation Response
```json
{
  "success": true,
  "property": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Modern 2-Bed Flat in City Centre",
    "type": "flat",
    "price": 850,
    "areaAverageRent": 1500,
    "priceRatio": 0.567,
    "amenitiesCount": 4,
    "billsIncludedCount": 2,
    "billsExtraCost": 25
  },
  "fraudDetectionFeatures": {
    "price": 850,
    "areaAverageRent": 1500,
    "priceRatio": 0.567,
    "amenitiesCount": 4,
    "billsIncludedCount": 2,
    "billsExtraCost": 25,
    "totalMonthlyEstimate": 875
  },
  "marketInsight": "Average rent for a 1-bedroom flat in London is 1500..."
}
```

---

## How to Generate Training Dataset

### Option 1: Export Real Platform Data
```javascript
// In backend script:
const properties = await Property.find();
const dataset = properties.map(p => ({
  price: p.price,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  area: p.area,
  furnished: p.furnished,
  city: p.city,
  country: p.country,
  property_type: p.type,
  area_average_rent: p.areaAverageRent,
  price_ratio: p.priceRatio,
  amenities_count: p.amenitiesCount,
  bills_included_count: p.billsIncludedCount,
  bills_excluded_cost: p.billsExtraCost,
  // Optional: from related data
  landlord_reputation: p.landlord?.reputationScore || 0,
  review_rating: p.reviews?.avgRating || null,
  review_count: p.reviews?.length || 0
  // DO NOT INCLUDE: is_scam (for training, label separately)
}));

CSV.stringify(dataset, { header: true }, (err, csv) => {
  fs.writeFileSync('platform_properties.csv', csv);
});
```

### Option 2: Update Your Synthetic Dataset
For `rental_scam_dataset_v3.csv`:

```csv
price,bedrooms,bathrooms,area,furnished,city,country,property_type,area_average_rent,price_ratio,amenities_count,bills_included_count,bills_excluded_cost,landlord_reputation,review_rating,is_scam
850,1,1,500,1,London,United Kingdom,flat,1500,0.567,4,2,25,85,4.2,0
1200,2,1,750,1,London,United Kingdom,flat,1500,0.8,5,1,80,90,4.5,0
600,1,1,600,0,London,United Kingdom,studio,1200,0.5,2,0,150,40,2.1,1
1800,3,2,1200,1,London,United Kingdom,house,1600,1.125,7,3,30,92,4.8,0
```

**Key Rules for Realistic Data:**
- If `bills_included_count = 0-2`, typical `bills_excluded_cost` = $0-50
- If `bills_included_count = 3-4`, typical `bills_excluded_cost` = $0-10
- `price_ratio` between 0.6-1.4 is normal (0.4 or 1.8+ = suspicious)
- `landlord_reputation` 0-100 (higher = more trustworthy)
- `review_rating` 1-5 stars (more reviews = more trustworthy)

---

## Validation Checklist

### ✅ Platform Implementation
- [ ] `billsCost` contains only costs for bills NOT in `billsIncluded`
- [ ] `billsExtraCost` is calculated correctly
- [ ] `priceRatio` is stored in database
- [ ] `amenitiesCount` is auto-calculated from amenities array length
- [ ] `billsIncludedCount` is auto-calculated from billsIncluded array length
- [ ] API response includes `fraudDetectionFeatures` object
- [ ] Property type enum is `['flat', 'house', 'studio']`

### ✅ Dataset Alignment
- [ ] CSV has all required columns
- [ ] `price_ratio` values are in realistic range (0.4-2.0)
- [ ] `bills_excluded_cost` is 0 if `bills_included_count = 5`
- [ ] `area_average_rent` is from market lookup (not hardcoded)
- [ ] No `is_scam` field in production (only in training dataset)
- [ ] `landlord_reputation` and `review_rating` are populated

---

## Testing Commands

### Test Property Creation with Bills
```bash
curl -X POST http://localhost:5000/api/landlord/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "title": "2-Bed Flat",
    "city": "London",
    "country": "United Kingdom",
    "bedrooms": 2,
    "bathrooms": 1,
    "area": 750,
    "furnished": true,
    "price": 850,
    "billsIncluded": ["Electricity", "Gas"],
    "billsCost": {
      "wifi": 25,
      "water": 0,
      "electricity": 0,
      "gas": 0,
      "councilTax": 0
    }
  }'
```

### Expected Response
```json
{
  "fraudDetectionFeatures": {
    "price": 850,
    "areaAverageRent": 1500,
    "priceRatio": 0.567,
    "amenitiesCount": 0,
    "billsIncludedCount": 2,
    "billsExtraCost": 25,
    "totalMonthlyEstimate": 875
  }
}
```

---

## Common Issues & Solutions

### Issue: priceRatio showing as NaN
**Cause**: `areaAverageRent` is null (city/country not in CSV lookup)
**Solution**: Ensure city and country match CSV exactly (case-insensitive lookup)

### Issue: billsExtraCost not calculating correctly
**Cause**: billCost keys don't match (wifi vs WiFi, councilTax vs council_tax)
**Solution**: Use lowercase keys in billsCost: `wifi`, `water`, `electricity`, `gas`, `councilTax`

### Issue: Dataset shows unrealistic bills_included_count = 5
**Cause**: All 5 bill types included in rent
**Solution**: This is extremely rare. Flag as suspicious unless price_ratio matches

---

## Fraud Detection Algorithm

### Quick Score Calculation
```python
def calculate_fraud_score(property):
    score = 0
    
    # Price anomaly (0-30 points)
    if property['price_ratio'] > 1.5 or property['price_ratio'] < 0.5:
        score += 20
    if property['price_ratio'] > 1.8 or property['price_ratio'] < 0.3:
        score += 10
    
    # Bills suspicion (0-30 points)
    if property['bills_included_count'] == 0 and property['price_ratio'] < 0.65:
        score += 20  # Cheap AND no bills included = suspicious
    if property['bills_included_count'] >= 4:
        score += 10  # Unrealistically many bills included
    if property['bills_excluded_cost'] > 200:
        score += 10  # Hidden very high costs
    
    # Amenities unrealism (0-20 points)
    if property['amenities_count'] > 12:
        score += 15
    if property['amenities_count'] == 0 and property['price_ratio'] < 0.7:
        score += 10
    
    # Landlord/review history (0-20 points)
    if property.get('landlord_reputation', 50) < 40:
        score += 10
    if property.get('review_count', 0) == 0 and property.get('landlord_reputation', 50) < 30:
        score += 10
    
    return min(score, 100)

# Fraud likelihood:
# 0-30: Legitimate ✓
# 31-60: Potentially suspicious ?
# 61-100: Likely fraudulent ✗
```

This is ready for your fraud detection model!
