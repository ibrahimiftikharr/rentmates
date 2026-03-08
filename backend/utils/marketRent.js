const fs = require('fs');
const path = require('path');

// In-memory cache of lookup data
let rentLookup = null;
let rentLookupByCountry = null;
let countryAliasToCanonical = null;

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCountry(country) {
  const normalized = normalizeText(country);
  const aliases = {
    us: 'united states',
    usa: 'united states',
    america: 'united states',
    'united states of america': 'united states',
    'u s a': 'united states',
    'u s': 'united states',
    'u s of america': 'united states',
    'u s of a': 'united states',
    'u s a': 'united states',
    uk: 'united kingdom',
    'u k': 'united kingdom',
    uae: 'united arab emirates'
  };
  return aliases[normalized] || normalized;
}

function compactCountryText(value) {
  return normalizeText(value)
    .replace(/\b(the|of|and|republic|state|states|kingdom|federation|federal|democratic|people|peoples)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCountryAcronym(countryNorm) {
  const tokens = countryNorm.split(' ').filter(Boolean);
  if (tokens.length < 2) return '';
  return tokens.map(t => t[0]).join('');
}

function buildCountryAliasMap() {
  const aliases = {};
  const canonicals = Object.keys(rentLookupByCountry || {});

  for (const canonical of canonicals) {
    aliases[canonical] = canonical;

    const compact = compactCountryText(canonical);
    if (compact) aliases[compact] = canonical;

    const acronym = getCountryAcronym(canonical);
    if (acronym.length >= 2) {
      aliases[acronym] = canonical;
    }

    const noSpaces = canonical.replace(/\s+/g, '');
    if (noSpaces) aliases[noSpaces] = canonical;
  }

  // Keep explicit high-value aliases.
  aliases.uk = 'united kingdom';
  aliases.greatbritain = 'united kingdom';
  aliases.britain = 'united kingdom';
  aliases.us = 'united states';
  aliases.usa = 'united states';
  aliases.america = 'united states';
  aliases.unitedstatesofamerica = 'united states';
  aliases.uae = 'united arab emirates';

  countryAliasToCanonical = aliases;
}

function resolveCountry(country) {
  const normalized = normalizeCountry(country);
  if (!normalized) return normalized;

  if (!rentLookupByCountry) {
    return normalized;
  }

  if (rentLookupByCountry[normalized]) {
    return normalized;
  }

  if (countryAliasToCanonical && countryAliasToCanonical[normalized]) {
    return countryAliasToCanonical[normalized];
  }

  const compact = compactCountryText(normalized);
  if (compact && countryAliasToCanonical && countryAliasToCanonical[compact]) {
    return countryAliasToCanonical[compact];
  }

  const canonicals = Object.keys(rentLookupByCountry);
  const partial = canonicals.filter(c => c.includes(normalized) || normalized.includes(c));
  if (partial.length === 1) {
    return partial[0];
  }

  return normalized;
}

function normalizeCity(city) {
  let normalized = normalizeText(city);
  const aliases = {
    ny: 'new york',
    nyc: 'new york',
    'new york ny': 'new york',
    'new york city ny': 'new york',
    'new york city': 'new york',
    'washington dc': 'washington',
    'washington d c': 'washington',
    la: 'los angeles',
    sf: 'san francisco'
  };
  normalized = aliases[normalized] || normalized;

  // Drop trailing US state code in strings like "new york ny" if still present.
  const usStateCodes = new Set([
    'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la','me','md',
    'ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok','or','pa','ri','sc',
    'sd','tn','tx','ut','vt','va','wa','wv','wi','wy','dc'
  ]);
  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length > 1 && usStateCodes.has(tokens[tokens.length - 1])) {
    normalized = tokens.slice(0, -1).join(' ');
  }

  if (normalized.endsWith(' city')) {
    normalized = normalized.slice(0, -5).trim();
  }
  return normalized;
}

function buildCityCandidates(city) {
  const candidates = new Set();
  const raw = String(city || '').trim();
  const normalized = normalizeCity(raw);
  if (normalized) candidates.add(normalized);

  const commaParts = raw.split(',').map(p => p.trim()).filter(Boolean);
  if (commaParts.length > 0) {
    candidates.add(normalizeCity(commaParts[0]));
  }

  // Remove trailing short region tokens (e.g. "new york ny").
  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length > 1 && /^[a-z]{2,3}$/.test(tokens[tokens.length - 1])) {
    candidates.add(tokens.slice(0, -1).join(' '));
  }

  return Array.from(candidates).filter(Boolean);
}

function loadLookup() {
  if (rentLookup) return rentLookup;
  // file lives alongside this module in backend/utils
  const csvPath = path.resolve(__dirname, 'rent_lookup.csv');
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  // first line header (split while ignoring commas inside quotes)
  const header = lines.shift().split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(h => h.trim().toLowerCase());
  // determine indices
  const cityIdx = header.findIndex(h => h.includes('city'));
  const regionIdx = header.findIndex(h => h.includes('region'));
  const idx = {
    country: header.findIndex(h => h.includes('country')),
    // Use region as fallback only when city is absent
    city: cityIdx !== -1 ? cityIdx : regionIdx,
    rent1: header.findIndex(h => h.includes('rent_1')),
    rent2: header.findIndex(h => h.includes('rent_2')),
    rent3: header.findIndex(h => h.includes('rent_3'))
  };
  rentLookup = {};
  rentLookupByCountry = {};
  lines.forEach(line => {
    // split on commas not within quotes
    const parts = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(p => p.trim().replace(/^\"|\"$/g, ''));
    const country = parts[idx.country] || '';
    const city = parts[idx.city] || '';
    const r1 = parts[idx.rent1] || '0';
    const r2 = parts[idx.rent2] || '0';
    const r3 = parts[idx.rent3] || '0';
    const countryNorm = normalizeCountry(country);
    const cityNorm = normalizeCity(city);
    const key = `${countryNorm}|${cityNorm}`;
    // remove thousands separators
    const clean = (s) => parseFloat(s.replace(/,/g, '')) || 0;
    const record = {
      rent1: clean(r1),
      rent2: clean(r2),
      rent3: clean(r3),
      rawCountry: country,
      rawCity: city,
      countryNorm,
      cityNorm
    };
    rentLookup[key] = record;

    if (!rentLookupByCountry[countryNorm]) {
      rentLookupByCountry[countryNorm] = [];
    }
    rentLookupByCountry[countryNorm].push(record);
  });

  buildCountryAliasMap();
  return rentLookup;
}

function selectRentByBedrooms(entry, bedrooms) {
  if (!entry) return null;
  if (bedrooms === 1) return entry.rent1;
  if (bedrooms === 2) return entry.rent2;
  if (bedrooms >= 3) return entry.rent3;
  return entry.rent1;
}

function getBaseRentDetails(country, city, bedrooms) {
  const lookup = loadLookup();
  const countryNorm = resolveCountry(country);
  const cityCandidates = buildCityCandidates(city);

  let entry = null;
  let matchedCityNorm = null;
  for (const candidate of cityCandidates) {
    const key = `${countryNorm}|${candidate}`;
    if (lookup[key]) {
      entry = lookup[key];
      matchedCityNorm = candidate;
      break;
    }
  }
  let source = 'not_found';

  if (entry) {
    source = 'city_exact';
  }

  // Try tolerant city matching inside the same country (e.g. "New York City" -> "New York").
  if (!entry && rentLookupByCountry[countryNorm]) {
    const candidates = rentLookupByCountry[countryNorm];
    entry = candidates.find(row => cityCandidates.some(cityNorm => row.cityNorm.includes(cityNorm) || cityNorm.includes(row.cityNorm)));
    if (entry) {
      source = 'city_fuzzy';
      matchedCityNorm = entry.cityNorm;
    }

    // Fall back to country-level average if city-level lookup is unavailable.
    if (!entry && candidates.length > 0) {
      const avg = (field) => {
        const values = candidates.map(r => r[field]).filter(v => Number.isFinite(v) && v > 0);
        if (values.length === 0) return 0;
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      };
      entry = {
        rent1: avg('rent1'),
        rent2: avg('rent2'),
        rent3: avg('rent3'),
        rawCountry: country,
        rawCity: 'country-average'
      };
      source = 'country_fallback';
    }
  }

  if (!entry) {
    return {
      baseRent: null,
      lookupSource: source,
      matchedCity: null,
      matchedCountry: countryNorm || null
    };
  }

  return {
    baseRent: selectRentByBedrooms(entry, bedrooms),
    lookupSource: source,
    matchedCity: entry.rawCity || matchedCityNorm || null,
    matchedCountry: entry.rawCountry || countryNorm || null
  };
}

function getBaseRent(country, city, bedrooms) {
  const details = getBaseRentDetails(country, city, bedrooms);
  return details.baseRent;
}

/**
 * Calculate the expected market rent for a listing and return insight text.
 *
 * @param {string} city
 * @param {string} country
 * @param {number} bedrooms
 * @param {string} propertyType - flat/house/studio
 * @param {boolean} furnished
 * @param {number} includedBillsTotal
 * @returns {{area_average_rent: number|null, price_ratio?:number, insight: string, lookup_source?: string, lookup_city?: string|null, lookup_country?: string|null}}
 */
function calculate_expected_rent(city, country, bedrooms, propertyType, furnished, includedBillsTotal) {
  const details = getBaseRentDetails(country, city, bedrooms);
  const baseRent = details.baseRent;
  if (baseRent === null) {
    return {
      area_average_rent: null,
      lookup_source: details.lookupSource,
      lookup_city: details.matchedCity,
      lookup_country: details.matchedCountry,
      insight: `no market data available for ${city}, ${country}`
    };
  }

  // adjust by property type
  let adjusted = baseRent;
  if (propertyType === 'house') adjusted *= 1.15;
  else if (propertyType === 'studio') adjusted *= 0.80;
  // flats unchanged

  // furnishing
  if (furnished) adjusted *= 1.15;

  // add bills
  const expected = adjusted + (includedBillsTotal || 0);

  const ratio = null; // price is not known here, compute externally if available

  const insight = `Average rent for a ${bedrooms}-bedroom flat in ${city} is ${baseRent}. After adjustments, the expected rent is ${expected.toFixed(2)}.`;

  return {
    area_average_rent: expected,
    price_ratio: ratio,
    lookup_source: details.lookupSource,
    lookup_city: details.matchedCity,
    lookup_country: details.matchedCountry,
    insight
  };
}

module.exports = {
  calculate_expected_rent,
  // exported for testing/debugging
  loadLookup,
  getBaseRent,
  getBaseRentDetails
};