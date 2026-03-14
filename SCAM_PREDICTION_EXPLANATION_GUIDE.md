# Scam Prediction Quick Explanation Script

Use this short script when explaining any property risk result.

## 1) One-line summary
"This system uses a hybrid ML model combining numeric features (price/deposit ratios) with NLP-based text analysis to detect rental scams."

## 2) Core formulas (always show)
- `priceRatio = listed_price / area_average_rent`
- `depositRatio = security_deposit / monthly_rent`
- `depositTooHigh = 1 if depositRatio > 1.5 else 0`
- **TEXT ANALYSIS**: ML model analyzes description for scam patterns using learned word associations

Interpretation:
- `priceRatio < 0.7` => suspicious underpricing
- `priceRatio < 0.35` => extreme underpricing, rule-based guardrail can force very high risk
- `depositRatio > 1.5` => suspicious deposit demand
- **Scam keywords**: "low price", "very less", "urgent", "wire transfer", "bargain", "cheap" etc. detected by NLP

## 3) Vienna example (3-bedroom)
Inputs:
- City/Country: Vienna, Austria
- Bedrooms: 3
- Listed rent: 1000
- Security deposit: 1000
- Description: very short

Market baseline from `rent_lookup.csv`:
- Vienna 3-bedroom base rent = `3132`

Computed:
- `priceRatio = 1000 / 3132 = 0.319`
- `depositRatio = 1000 / 1000 = 1.0`
- `price difference = 3132 - 1000 = 2132` below market
- `% below market = (1 - 0.319) * 100 = 68.1%`

Why high scam risk:
- `priceRatio` is far below normal range.
- In API logic, very low price ratio can trigger an underpricing guardrail (`underpricing_risk_floor`) that raises minimum scam probability.
- Very short description (low `description_word_count` / `description_length`) adds extra risk.

## 4) Why PriceRatio may appear twice
It can show up as:
- Model contribution (SHAP/importance-based factor)
- Rule-based guardrail contribution (explicit risk floor message)

So duplicate `PriceRatio` rows are expected in extreme underpricing cases.

## 5) Concise general explanation template
"The model uses 12 features. It compares the listed rent with local market rent (`priceRatio`), checks deposit reasonableness (`depositRatio`), and evaluates trust/context signals like landlord verification, reputation, description quality, and feedback history. In this listing, rent is much lower than Vienna market level, so risk rises sharply. Short/low-information text further increases uncertainty, so final scam probability is high."

## 6) 30-second viva script
"For each listing, we compute structured features first. The most important one is `priceRatio`, which compares listing rent to local expected rent. In this Vienna case, 1000 vs 3132 gives 0.319, around 68% below market. That is a strong scam pattern. 

Additionally, the ML model analyzes the description text using NLP. The description '2-Bedroom flat, in very less price, low price' contains multiple scam-associated phrases that the model has learned to recognize. This isn't simple keyword matching - the model learned these associations from training data.

Because both numeric features (extreme underpricing) and text features (scam language) are present, the guardrail in our API raises the minimum risk level, resulting in high scam probability."

## 7) NLP Architecture
**Backend**: Sends raw description text to ML service  
**ML Service**: Analyzes text patterns using learned associations  
**Text Features**: Model detects phrases like "low price", "very less", "urgent", "wire transfer", "cheap", "bargain"  
**Hybrid Approach**: Combines 12 numeric features + text analysis for robust detection