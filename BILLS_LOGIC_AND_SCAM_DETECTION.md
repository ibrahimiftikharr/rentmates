# Bills Logic & Scam Detection Alignment

## 🔧 Platform Implementation (CORRECTED)

### Database Schema

```javascript
// NEW CORRECTED STRUCTURE
billsIncluded: [String]  // Bills covered in base rent
  // Example: ['Electricity', 'Gas']
  // These are INCLUDED in the monthly price

billsCost: {
  // Cost of bills NOT included (extra monthly costs)
  wifi: Number,           // $25 (paid extra)
  water: Number,          // $15 (paid extra)
  electricity: Number,    // $0 (included, so nothing here)
  gas: Number,            // $0 (included, so nothing here)
  councilTax: Number      // $120 (paid extra)
}

billsExtraCost: Number  // Sum of extra bill costs
  // Example: 25 + 15 + 0 + 0 + 120 = $160
```

### What Your Frontend Shows (CORRECT)

```
Base Rent with Included Bills
├─ Electricity: INCLUDED (included in $850)
├─ Gas: INCLUDED (included in $850)
└─ $850/month

Excluded Bills (Pay Separately)
├─ WiFi: $25/mo (NOT included, extra cost)
├─ Water: $25/mo (NOT included, extra cost)
└─ Council Tax: $0/mo (NOT included, but $0 cost)
└─ $25 extra/month

Total Estimated Monthly Cost
└─ $875/month (rent + extra bills only)
```

---

## 📊 Scam Detection Dataset Alignment

### Features Your Platform Provides

| Dataset Feature | Platform Field | Value Type | Example |
|---|---|---|---|
| `price` | `property.price` | Number | 850 |
| `bedrooms` | `property.bedrooms` | Number | 1-5 |
| `bathrooms` | `property.bathrooms` | Number | 1-3 |
| `area` | `property.area` | Number (sq ft) | 500, 750, 1200 |
| `furnished` | `property.furnished` | Boolean | true, false |
| `city` | `property.city` | String | London, Oxford |
| `country` | `property.country` | String | United Kingdom |
| `property_type` | `property.type` | 'flat'\|'house'\|'studio' | flat |
| `amenities_count` | `property.amenitiesCount` | Number | 3, 5, 8 |
| `area_average_rent` | `property.areaAverageRent` | Number | 1500, 1800 |
| `price_ratio` | `property.priceRatio` | Number (0.5-2.0) | 0.57, 1.2 |
| `bills_included_count` | `property.billsIncludedCount` | Number (0-5) | 0, 2, 3 |
| `bills_excluded_cost` | `property.billsExtraCost` | Number | 0, 25, 160 |

---

## 🚨 Fraud Detection Indicators

### Red Flags Your System Can Now Detect

#### 1. **Price Ratio Anomalies**
```
price_ratio = price / area_average_rent

RED FLAG IF:
├─ price_ratio > 1.5  (overly expensive)
├─ price_ratio < 0.5  (suspiciously cheap)
└─ FRAUDULENT PATTERN: Super cheap with NO included bills
    Example: price_ratio=0.4, bills_included_count=0
```

#### 2. **Bills Suspicion Scores**
```
Suspicious if:
├─ bills_included_count = 0 (no bills included, but price seems normal)
│   → Might be hiding costs
├─ bills_included_count >= 4 (too many expensive bills included)
│   → Unrealistic/loss-making property
└─ bills_excluded_cost >> area_average (very high extra costs)
    → Hidden charges beyond rent
```

#### 3. **Combined Indicators**
```
FRAUD LIKELIHOOD INCREASES if:
  • price_ratio < 0.6 AND bills_included_count = 0
  • price_ratio > 1.4 AND amenities_count > 8
  • bills_included_count = 4 AND bills_excluded_cost = 0
  • price_ratio < 0.5 AND area > 1000 sq ft (too cheap for large space)
```

---

## 📋 Example Scenarios

### Scenario 1: Legitimate Property
```json
{
  "price": 850,
  "areaAverageRent": 1500,
  "priceRatio": 0.57,  // Low but reasonable with bills included
  "billsIncludedCount": 2,  // Electricity, Gas included
  "billsExtraCost": 25,  // Only WiFi extra ($25)
  "amenitiesCount": 4,
  "fraudScore": "LOW ✓"
}
```

### Scenario 2: Suspicious Scam Listing
```json
{
  "price": 600,
  "areaAverageRent": 1500,
  "priceRatio": 0.40,  // Too cheap
  "billsIncludedCount": 0,  // No bills included
  "billsExtraCost": 150,  // Hidden high costs
  "amenitiesCount": 12,  // Unrealistic
  "fraudScore": "HIGH ✗"
}
```

### Scenario 3: Mixed Signals
```json
{
  "price": 1200,
  "areaAverageRent": 1000,
  "priceRatio": 1.20,  // Slightly expensive
  "billsIncludedCount": 4,  // Many bills included
  "billsExtraCost": 0,  // No extra costs
  "amenitiesCount": 6,
  "fraudScore": "MEDIUM ? (Check amenities quality)"
}
```

---

## ✅ Your Dataset Accuracy

### Complete Features
- ✓ Price
- ✓ Bedrooms, Bathrooms, Area
- ✓ Furnished status
- ✓ City, Country
- ✓ Property type (flat, house, studio - apartment removed)
- ✓ Amenities count
- ✓ Market average rent
- ✓ Price ratio
- ✓ Bills included count
- ✓ Bills extra cost
- ✓ Landlord reputation (via related model)
- ✓ Reviews & ratings (via related model)

### Missing Features (Optional)
- Reviews count (can derive from related model)
- Photos count (available but not used in model)
- Response time to inquiries (not tracked)
- Previous scam reports (not tracked)

---

## 🔄 Data Flow for Scam Detection

```
Property Created by Landlord
    ↓
Controller calculates:
├─ billsIncludedCount = length of billsIncluded array
├─ billsExtraCost = sum of costs for bills NOT in billsIncluded
├─ priceRatio = price / area_average_rent
├─ amenitiesCount = length of amenities array
    ↓
API Response includes:
├─ fraudDetectionFeatures object
├─ All calculated fields
├─ totalMonthlyEstimate = price + billsExtraCost
    ↓
Client can:
├─ Display realistic cost breakdown
├─ Show landlord warning if suspicious
├─ Flag property in backend for review
```

---

## 💡 Next Steps

1. **Add Fraud Detection Endpoint**
   - POST `/api/properties/:id/check-fraud`
   - Returns fraud_score (0-100)
   - Lists red flags detected

2. **Frontend Alerts**
   - Show green ✓ for legitimate listings
   - Show orange ⚠️ for suspicious patterns
   - Show red ✗ for high-fraud listings

3. **Dataset Export**
   - Use this corrected logic for training data
   - All features now align with platform reality
   - Can generate synthetic data with realistic patterns
