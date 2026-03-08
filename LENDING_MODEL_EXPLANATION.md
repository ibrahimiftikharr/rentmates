# RentMates Lending Model - Complete Technical Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Investment Pool Structure](#investment-pool-structure)
3. [Borrower Side (Students)](#borrower-side-students)
4. [Investor Side](#investor-side)
5. [Share-Based Accounting System](#share-based-accounting-system)
6. [Pool Value Calculation](#pool-value-calculation)
7. [Mathematical Formulas](#mathematical-formulas)
8. [Complete Example Walkthrough](#complete-example-walkthrough)
9. [Key Terminology](#key-terminology)

---

## System Overview

RentMates is a **peer-to-pool lending platform** that connects student borrowers with investors through investment pools. The system uses a **share-based accounting model** where investors receive shares that appreciate in value as loans earn interest.

### Key Characteristics
- **Pool-Based Lending**: Multiple investors fund pools; students borrow from pools
- **Share-Based Returns**: Investors hold shares whose value increases with pool performance
- **Open-Ended Investments**: Investors can withdraw anytime (subject to available liquidity)
- **Amortized Loan Repayments**: Students make fixed monthly payments over loan duration
- **Collateral-Backed**: Loans secured by PAXG (gold-backed token) to protect investors

---

## Investment Pool Structure

### Pool Types
The system has **3 investment pools** with different risk/return profiles:

| Pool Name | LTV Ratio | Duration | Base APR | Risk Level |
|-----------|-----------|----------|----------|------------|
| Conservative Growth | 70% | 6 months | 12.60% | Low |
| Balanced Portfolio | 80% | 9 months | 14.90% | Medium |
| High Yield Growth | 90% | 12 months | 17.20% | High |

### Pool Parameters

#### 1. **LTV (Loan-to-Value) Ratio**
- **Definition**: Maximum loan amount as a percentage of collateral value
- **Formula**: `Loan Amount = Collateral Value × LTV`
- **Purpose**: Controls risk; lower LTV = safer (more collateral per dollar borrowed)
- **Example**: 
  - Conservative: 70% LTV → $100 loan requires ~$143 collateral
  - High Yield: 90% LTV → $100 loan requires ~$111 collateral

#### 2. **Duration (Months)**
- **Definition**: Loan repayment period
- **Values**: 6, 9, or 12 months
- **Purpose**: Matches pool duration to loan term for predictable returns
- **Impact**: Longer duration = higher time premium = higher APR

#### 3. **APR Calculation**
The Annual Percentage Rate is calculated using:

```javascript
APR = Base Rate + Risk Premium + Time Premium

Where:
- Base Rate = 4% (fixed)
- Risk Premium = 8% × LTV (ranges from 5.6% to 7.2%)
- Time Premium = 0.5% × Duration in months
```

**Examples:**
- Conservative (6m, 70% LTV): `4 + (8 × 0.7) + (0.5 × 6) = 12.60%`
- Balanced (9m, 80% LTV): `4 + (8 × 0.8) + (0.5 × 9) = 14.90%`
- High Yield (12m, 90% LTV): `4 + (8 × 0.9) + (0.5 × 12) = 17.20%`

#### 4. **Investment Limits**
- **Min Investment**: $1 USDT per transaction
- **Max Investment**: $1,000 USDT per transaction
- **Max Pool Capital**: $5,000 USDT total capacity per pool

---

## Borrower Side (Students)

### Loan Application Process

#### Step 1: Loan Availability Check
Student requests a loan with:
- **Requested Amount**: 1-1000 USDT
- **Duration**: 6, 9, or 12 months
- **Purpose**: Rent, tuition, books, living expenses

System checks each pool to find matches based on:
- Pool has sufficient **available balance** to fund the loan
- Pool **duration matches** requested duration

#### Step 2: Collateral Calculation

**Formula:**
```javascript
Required Collateral (USDT) = Loan Amount ÷ LTV
Required Collateral (PAXG) = Required Collateral (USDT) ÷ PAXG Price
```

**Example:** Borrow $50 from Conservative Growth (70% LTV)
- Collateral in USDT: $50 ÷ 0.7 = $71.43
- If PAXG = $2,000/token: $71.43 ÷ $2,000 = 0.0357 PAXG

**Collateral Protection:**
- Stored in smart contract (RentMatesCollateralHolder)
- Locked until loan fully repaid
- Returned to student after final payment
- Can be liquidated if loan defaults (not implemented yet)

#### Step 3: Monthly Repayment Calculation

Uses **amortized loan formula** to ensure fixed monthly payments:

```javascript
Monthly Payment = P × [r(1+r)^n] ÷ [(1+r)^n - 1]

Where:
- P = Principal (loan amount)
- r = Monthly interest rate (APR ÷ 12 ÷ 100)
- n = Number of months
```

**Example:** $50 loan at 12.6% APR for 6 months
```
Monthly rate = 12.6% ÷ 12 ÷ 100 = 0.0105
Monthly payment = 50 × [0.0105(1.0105)^6] ÷ [(1.0105)^6 - 1]
                = 50 × 0.172794 ÷ 0.064303
                = 8.64 USDT/month
```

Total repayment: `8.64 × 6 = 51.84 USDT`  
Total interest: `51.84 - 50 = 1.84 USDT`

#### Step 4: Loan Disbursement

When loan is approved:
1. **Pool Updates:**
   - `availableBalance -= loanAmount` (cash leaves pool)
   - `disbursedLoans += loanAmount` (tracks outstanding loans)

2. **Student Receives:**
   - Loan amount deposited to off-chain balance
   - Can use funds immediately

3. **Loan Status:** `active` (ready for repayments)

#### Step 5: Monthly Repayments

Each month, student pays fixed amount:
1. Payment splits into:
   - **Principal portion** (reduces loan balance)
   - **Interest portion** (profit for investors)

2. **Pool Updates:**
   - `disbursedLoans -= principalAmount`
   - `availableBalance += totalPayment`
   - `accruedInterest = 0` (prevented double-counting)

3. **Share Price Increases** (investors earn returns)

---

## Investor Side

### Investment Process

#### Step 1: Choose Pool
Investor reviews pools and selects based on:
- **APR**: Annual percentage rate (e.g., 12.60%)
- **Effective ROI**: Actual return for the duration
- **Risk Level**: Based on LTV (Low/Medium/High)
- **Duration**: How long loans are issued for
- **Available Capital**: How much can still be invested

#### Step 2: Invest Amount

**Share Calculation:**
```javascript
Current Share Price = Pool Total Value ÷ Total Shares
Shares Received = Investment Amount ÷ Current Share Price

// For first investment in empty pool:
Initial Share Price = 1.00 USDT
Shares Received = Investment Amount ÷ 1.00
```

**Example:** First investor puts in $50
- Share price = $1.00 (pool is empty)
- Shares received = 50 ÷ 1.00 = **50 shares**

**Pool Updates:**
```javascript
pool.totalInvested += amount       // Historical tracking
pool.availableBalance += amount    // Cash in pool
pool.totalShares += shares         // Total shares outstanding
```

#### Step 3: Earning Returns

Returns are earned through **share price appreciation**:

**Before Loan Interest:**
- Pool value: $50
- Total shares: 50
- Share price: $50 ÷ 50 = $1.00

**After Loan Earns $1.84 Interest:**
- Pool value: $51.84
- Total shares: 50 (unchanged)
- Share price: $51.84 ÷ 50 = $1.0368

**Investor's Value:**
- Shares owned: 50
- Current value: 50 × $1.0368 = **$51.84**
- Profit: $51.84 - $50.00 = **$1.84** ✅

#### Step 4: Compounding (Auto-Reinvestment)

**Key Feature:** Returns are automatically reinvested!

- Interest increases pool value
- Share price rises for ALL investors
- No need to manually reinvest
- Compounding happens with each loan repayment

**Example with Multiple Cycles:**

**Cycle 1:** Original investment of $50
- Loan earns $1.84 → Value becomes $51.84

**Cycle 2:** $51.84 is reinvested (automatically)
- New loan earns 3.68% on $51.84 = $1.91
- Value becomes $53.75

**Cycle 3:** And so on...

This is **compound interest** in action!

#### Step 5: Withdrawal

**Formula:**
```javascript
Withdrawal Amount = Shares Sold × Current Share Price
```

**Process:**
1. Investor specifies amount to withdraw (e.g., $25)
2. System calculates shares to sell:
   ```javascript
   Shares to Sell = Withdrawal Amount ÷ Share Price
   ```
3. **Pool Updates:**
   ```javascript
   pool.availableBalance -= withdrawalAmount
   pool.totalShares -= sharesSold
   ```
4. **Important:** Share price remains stable!
   ```javascript
   Old Price = Old Pool Value ÷ Old Total Shares
   New Price = New Pool Value ÷ New Total Shares
   // These are equal! No price change from withdrawals
   ```

**Withdrawal Constraints:**
- Can only withdraw up to `pool.availableBalance`
- If funds are locked in active loans (`disbursedLoans`), must wait for repayments
- When all loans repaid, 100% of share value is withdrawable

---

## Share-Based Accounting System

### Why Shares?

Traditional systems track "amount invested + earnings" separately. This creates complexity:
- ❌ Need to track each earning event
- ❌ Complicated withdrawal calculations
- ❌ Hard to handle partial withdrawals

**Share-based system is elegant:**
- ✅ One number: shares owned
- ✅ Price automatically reflects all earnings
- ✅ Easy partial withdrawals (sell some shares)
- ✅ Works like stock/mutual fund shares

### Share Price Mechanics

**Initial State (Empty Pool):**
```javascript
Pool Value = $0
Total Shares = 0
Share Price = $1.00 (default)
```

**After First Investment ($50):**
```javascript
Pool Value = $50
Total Shares = 50
Share Price = $50 ÷ 50 = $1.00
```

**After Second Investment ($30):**
```javascript
Pool Value = $80
Total Shares = 50 + 30 = 80
Share Price = $80 ÷ 80 = $1.00
```

**After Loan Earns Interest ($3):**
```javascript
Pool Value = $83
Total Shares = 80 (unchanged!)
Share Price = $83 ÷ 80 = $1.0375
```

**Key Insight:** 
- Investments add shares proportionally → price stays same
- Interest adds value without shares → price increases
- This is how investors earn returns!

### Share Price Increase Formula

```javascript
Share Price Increase % = (Interest Earned ÷ Pool Value Before) × 100

Example:
Pool value before: $80
Interest earned: $3
Share price increase: ($3 ÷ $80) × 100 = 3.75%
```

Each investor's shares increase by same percentage!

---

## Pool Value Calculation

### Critical Formula

```javascript
Pool Total Value = Available Balance + Disbursed Loans
```

**That's it!** No accrued interest added separately.

### Why No Accrued Interest?

**Old (Buggy) Formula:**
```javascript
Pool Value = Available Balance + Disbursed Loans + Accrued Interest
```

**Problem:** Double-counting!
- When loan is repaid, interest is added to `availableBalance`
- If also added to `accruedInterest`, it's counted twice
- Share prices inflate beyond actual pool cash
- Investors can't withdraw (pool doesn't have enough)

**Fixed Formula:**
```javascript
Pool Value = Available Balance + Disbursed Loans
// No accrued interest field needed!
```

**Why This Works:**
- `availableBalance`: Cash currently in pool (includes all repaid interest)
- `disbursedLoans`: Outstanding loan principal (will become cash when repaid)
- Sum = Total economic value investors can claim ✅

### Pool Balance Components

#### 1. **Available Balance**
- **Definition**: Liquid cash in the pool right now
- **Can be used for**: New loans, withdrawals
- **Increases when**: 
  - Investors deposit funds
  - Loans are repaid (principal + interest)
- **Decreases when**:
  - Loans are disbursed
  - Investors withdraw

#### 2. **Disbursed Loans** (Outstanding Principal)
- **Definition**: Total principal amount of active loans
- **Represents**: Money owed back to pool (excluding interest)
- **Increases when**: Loans are disbursed
- **Decreases when**: Loan payments received (principal portion)
- **Note**: This is "illiquid value" - can't withdraw until repaid

#### 3. **Total Invested**
- **Definition**: Historical sum of all investments ever made
- **Purpose**: Analytics only - **NOT used in pool value calculation**
- **Increases when**: New investments made
- **Never decreases**: Even when investors withdraw

#### 4. **Accrued Interest**
- **Definition**: In our fixed system, always **$0**
- **Purpose**: Previously tracked unpaid interest, but caused double-counting
- **Current Usage**: Kept at 0 to prevent bugs
- **Why Unused**: Interest is already in `availableBalance` when paid

#### 5. **Total Shares**
- **Definition**: Sum of all investor shares outstanding
- **Increases when**: Investments made (new shares issued)
- **Decreases when**: Withdrawals made (shares burned)
- **Critical Use**: Calculates share price

### Pool Capacity Metrics

#### Pool Filled Percentage
```javascript
Pool Filled % = (Total Invested ÷ Max Capital) × 100

Example: Conservative Growth
Total Invested: $2,000
Max Capital: $5,000
Filled: ($2,000 ÷ $5,000) × 100 = 40%
```

#### Remaining Capacity
```javascript
Remaining Capacity = Max Capital - Total Invested

Example:
$5,000 - $2,000 = $3,000 remaining
```

#### Utilization Rate
```javascript
Utilization % = (Disbursed Loans ÷ Available Balance) × 100

Example:
Disbursed Loans: $1,500
Available Balance: $500
Total Pool Value: $2,000
Utilization: ($1,500 ÷ $2,000) × 100 = 75%
```

High utilization = efficient capital deployment  
Low utilization = funds sitting idle

---

## Mathematical Formulas

### 1. APR (Annual Percentage Rate)
```javascript
APR = Base Rate + Risk Premium + Time Premium
    = 4% + (8% × LTV) + (0.5% × Duration)

Example (Conservative, 6mo, 70% LTV):
    = 4 + (8 × 0.7) + (0.5 × 6)
    = 4 + 5.6 + 3
    = 12.6% APR
```

### 2. Effective ROI (Actual Return)
```javascript
// Calculate total interest using amortization
Monthly Rate (r) = APR ÷ 12 ÷ 100
Monthly Payment = Principal × [r(1+r)^n] ÷ [(1+r)^n - 1]
Total Repayment = Monthly Payment × n
Total Interest = Total Repayment - Principal

Effective ROI % = (Total Interest ÷ Principal) × 100

Example ($50, 12.6% APR, 6 months):
Monthly Rate = 12.6 ÷ 12 ÷ 100 = 0.0105
Monthly Payment = 50 × [0.0105(1.0105)^6] ÷ [(1.0105)^6 - 1]
                = 8.64 USDT
Total Interest = (8.64 × 6) - 50 = 1.84 USDT
Effective ROI = (1.84 ÷ 50) × 100 = 3.68%
```

**Note:** 12.6% APR over 6 months = 3.68% effective ROI (not 6.3%!)

### 3. Required Collateral
```javascript
Collateral (USDT) = Loan Amount ÷ LTV Ratio
Collateral (PAXG) = Collateral (USDT) ÷ Live PAXG Price

Example ($50 loan, 70% LTV, PAXG = $2,000):
Collateral (USDT) = 50 ÷ 0.7 = 71.43 USDT
Collateral (PAXG) = 71.43 ÷ 2000 = 0.0357 PAXG
```

### 4. Monthly Payment (Amortized)
```javascript
M = P × [r(1+r)^n] ÷ [(1+r)^n - 1]

Where:
M = Monthly payment
P = Principal (loan amount)
r = Monthly interest rate (APR ÷ 12 ÷ 100)
n = Number of months

Example ($100, 12.6% APR, 6 months):
r = 12.6 ÷ 12 ÷ 100 = 0.0105
M = 100 × [0.0105(1.0105)^6] ÷ [(1.0105)^6 - 1]
  = 100 × 0.172794 ÷ 0.064303
  = 17.28 USDT/month
```

### 5. Share Price
```javascript
Share Price = Pool Total Value ÷ Total Shares
           = (Available Balance + Disbursed Loans) ÷ Total Shares

Example:
Available Balance = $1,000
Disbursed Loans = $500
Total Shares = 1,200
Share Price = ($1,000 + $500) ÷ 1,200 = $1.25/share
```

### 6. Investment Value
```javascript
Current Value = Shares Owned × Current Share Price
Total Earnings = Current Value - Amount Invested
Actual ROI % = (Total Earnings ÷ Amount Invested) × 100

Example (invested $100, received 100 shares):
Current Share Price = $1.05
Current Value = 100 × $1.05 = $105
Total Earnings = $105 - $100 = $5
Actual ROI = ($5 ÷ $100) × 100 = 5%
```

### 7. Withdrawal Calculations
```javascript
// Full withdrawal
Shares to Sell = All shares owned
Amount Received = Shares × Current Share Price

// Partial withdrawal
Shares to Sell = Withdrawal Amount ÷ Current Share Price
Remaining Shares = Original Shares - Shares Sold

Example (withdraw $50, own 100 shares at $1.05):
Shares to Sell = $50 ÷ $1.05 = 47.619 shares
Remaining Shares = 100 - 47.619 = 52.381 shares
Remaining Value = 52.381 × $1.05 = $55
```

---

## Complete Example Walkthrough

### Scenario: Single Investor, Single Borrower

**Initial State:**
- Conservative Growth Pool: Empty
- Investor: Has $50 USDT
- Student: Needs $50 USDT for 6 months

---

### Phase 1: Investment

**Investor deposits $50:**

```javascript
// Before
Pool {
  availableBalance: 0,
  disbursedLoans: 0,
  totalShares: 0,
  totalInvested: 0
}

// Calculate shares
sharePrice = 1.00 (default for empty pool)
sharesToIssue = 50 ÷ 1.00 = 50 shares

// After
Pool {
  availableBalance: 50.00,    // +50 (cash in)
  disbursedLoans: 0,
  totalShares: 50.00,          // +50 (new shares)
  totalInvested: 50.00         // +50 (tracking)
}

Investor {
  shares: 50,
  amountInvested: 50.00,
  currentValue: 50 × 1.00 = 50.00
}

Pool Value = 50 + 0 = $50.00
Share Price = 50 ÷ 50 = $1.00
```

---

### Phase 2: Loan Disbursement

**Student borrows $50 (12.6% APR, 6 months):**

```javascript
// Loan calculation
APR = 12.6%
Monthly Payment = 8.64 USDT
Total Repayment = 8.64 × 6 = 51.84 USDT
Total Interest = 51.84 - 50 = 1.84 USDT

// Collateral required (70% LTV)
Collateral = 50 ÷ 0.7 = 71.43 USDT worth
          = 0.0357 PAXG (at $2,000/PAXG)

// After loan disbursement
Pool {
  availableBalance: 0,         // -50 (loan out)
  disbursedLoans: 50.00,       // +50 (tracking loan)
  totalShares: 50.00,          // unchanged
  totalInvested: 50.00         // unchanged
}

Pool Value = 0 + 50 = $50.00    // Still $50 (loan is asset)
Share Price = 50 ÷ 50 = $1.00   // Still $1.00 ✓

Investor Value = 50 × 1.00 = $50.00  // Unchanged ✓
```

**Key Insight:** Disbursing loan doesn't change pool value!
- Lost $50 cash
- Gained $50 loan receivable
- Net: $0 change

---

### Phase 3: Repayment #1 (Month 1)

**Student pays $8.64:**

```javascript
// Payment breakdown
monthlyPayment = 8.64
principalPortion = 7.98  // Reduces loan balance
interestPortion = 0.66   // Profit for pool

// Pool updates
Pool {
  availableBalance: 8.64,       // +8.64 (payment received)
  disbursedLoans: 42.02,        // -7.98 (principal paid)
  totalShares: 50.00,           // unchanged
  accruedInterest: 0            // always 0 (no double-counting)
}

Pool Value = 8.64 + 42.02 = $50.66  // +0.66 (interest earned)
Share Price = 50.66 ÷ 50 = $1.0132  // UP from $1.00! 📈

Investor Value = 50 × 1.0132 = $50.66
Investor Earnings = 50.66 - 50.00 = $0.66 ✓
```

**First profit earned!** 🎉

---

### Phase 4: Repayment #2 (Month 2)

**Student pays another $8.64:**

```javascript
principalPortion = 8.06
interestPortion = 0.58

Pool {
  availableBalance: 17.28,      // +8.64
  disbursedLoans: 33.96,        // -8.06
  totalShares: 50.00
}

Pool Value = 17.28 + 33.96 = $51.24
Share Price = 51.24 ÷ 50 = $1.0248

Investor Value = 50 × 1.0248 = $51.24
Investor Earnings = $1.24 total
```

---

### Phase 5: Complete Repayment (Month 6)

**After all 6 payments ($8.64 × 6 = $51.84):**

```javascript
Pool {
  availableBalance: 51.84,      // All money back + interest
  disbursedLoans: 0,            // Loan fully repaid
  totalShares: 50.00,           // No change
  accruedInterest: 0            // Always 0
}

Pool Value = 51.84 + 0 = $51.84
Share Price = 51.84 ÷ 50 = $1.0368

Investor Value = 50 × 1.0368 = $51.84
Investor Earnings = 51.84 - 50.00 = $1.84 ✓
Investor ROI = (1.84 ÷ 50) × 100 = 3.68%
```

**Perfect match!**
- Student paid: $51.84 total ✓
- Pool has: $51.84 available ✓
- Investor shares worth: $51.84 ✓
- Investor can withdraw: **$51.84** (100% of value) ✓

---

### Phase 6: Withdrawal

**Investor withdraws full amount:**

```javascript
sharesToSell = 50 (all shares)
withdrawalAmount = 50 × 1.0368 = 51.84 USDT

Pool {
  availableBalance: 0,          // -51.84 (withdrawn)
  disbursedLoans: 0,
  totalShares: 0,               // -50 (shares burned)
  totalInvested: 50.00          // historical only
}

Investor receives: $51.84 USDT
Profit: $1.84
ROI: 3.68%
Duration: 6 months
```

**Pool back to empty, ready for next cycle!** 🔄

---

## Key Terminology

### Pool Terms

**Available Balance**
- Liquid cash in pool
- Can be used for loans or withdrawals
- Includes all repaid principal and interest

**Disbursed Loans** (Outstanding Principal)
- Total amount of active loan principal
- Money owed to pool (excluding interest)
- Illiquid until loans are repaid

**Total Shares**
- Sum of all investor shares
- Increases with investments
- Decreases with withdrawals

**Share Price**
- Value of one share in USDT
- = Pool Value ÷ Total Shares
- Increases as pool earns interest

**Total Invested**
- Historical sum of all investments
- Used for analytics only
- Not used in pool value calculation

**Accrued Interest**
- Should always be $0 in our system
- Previously caused double-counting bug
- Interest is in available balance instead

**Pool Value** (Total Pool Value)
- Economic value of all pool assets
- = Available Balance + Disbursed Loans
- What all investors' shares are worth

**Max Capital**
- Maximum total investment allowed per pool
- Currently $5,000 per pool
- Limits pool size for risk management

### Investment Terms

**Shares**
- Units representing ownership in pool
- Issued when investing, burned when withdrawing
- Value = shares × share price

**Entry Share Price**
- Share price when investment was made
- Used to calculate original cost basis
- Stored for each investment

**Current Value**
- Present worth of investment
- = Shares × Current Share Price
- Changes as share price changes

**Total Earnings**
- Profit earned so far
- = Current Value - Amount Invested
- Can be negative if share price drops (rare)

**Actual ROI**
- Percentage return on investment
- = (Earnings ÷ Amount Invested) × 100
- Different from pool's advertised APR

### Loan Terms

**APR (Annual Percentage Rate)**
- Annualized interest rate for loans
- Used to calculate monthly payments
- Borrower pays this rate

**Effective ROI**
- Actual return percentage for the loan duration
- Less than APR for periods < 1 year
- What investors actually earn per loan cycle

**LTV (Loan-to-Value) Ratio**
- Loan amount as % of collateral value
- Lower = safer (more collateral)
- 70% = need $143 collateral for $100 loan

**Monthly Payment**
- Fixed amount paid each month
- Calculated using amortization formula
- Includes principal + interest

**Principal**
- Original loan amount borrowed
- Portion of payment reducing loan balance
- Increases each month (amortization)

**Interest**
- Portion of payment that is profit
- Goes to investors (increases pool value)
- Decreases each month (amortization)

**Collateral**
- PAXG tokens locked as security
- Returned when loan fully repaid
- Can be liquidated if default (not implemented)

### Risk Terms

**Risk Level**
- Low: 70% LTV (Conservative Growth)
- Medium: 80% LTV (Balanced Portfolio)
- High: 90% LTV (High Yield Growth)

**Risk Premium**
- Extra APR for taking more risk
- Formula: 8% × LTV
- Compensates for higher default risk

**Collateralization Ratio**
- Inverse of LTV
- = Collateral Value ÷ Loan Amount
- Higher = safer for investors

---

## System Invariants

These must ALWAYS be true:

### 1. Pool Value Integrity
```javascript
Pool Value = availableBalance + disbursedLoans
// Never include accruedInterest (prevents double-counting)
```

### 2. Share Price Stability on Investment/Withdrawal
```javascript
// When investor deposits/withdraws:
Share Price Before = Share Price After
// Only interest changes share price
```

### 3. Conservation of Value
```javascript
Sum of All Investor Share Values = Pool Value
// Always balanced (can always withdraw)
```

### 4. Loan Payment Accounting
```javascript
// Each payment:
disbursedLoans -= principalPortion
availableBalance += (principalPortion + interestPortion)
accruedInterest = 0  // Never accumulates

// Net change in pool value:
Pool Value Increase = interestPortion only
```

### 5. Withdrawability
```javascript
// After all loans fully repaid:
availableBalance = Total Value Owed to Investors
disbursedLoans = 0
// Investors can withdraw 100% of share value ✓
```

---

## Advantages of This Model

### For Investors
✅ **Compounding Returns**: Automatic reinvestment of interest  
✅ **Flexible Withdrawals**: Exit anytime (subject to liquidity)  
✅ **Transparent Pricing**: Share price shows real-time value  
✅ **Diversification**: Multiple investors share risk  
✅ **Collateral Protection**: Loans backed by PAXG  

### For Borrowers
✅ **Fixed Payments**: Predictable monthly amounts  
✅ **Competitive Rates**: Based on risk profile  
✅ **Flexible Amounts**: $1-$1,000 per loan  
✅ **Fast Approval**: Pool-based (no individual matching)  
✅ **Collateral Return**: Get PAXG back after repayment  

### For Platform
✅ **Scalable**: Pools handle multiple investors/borrowers  
✅ **Efficient**: Share-based accounting is simple  
✅ **Stable**: Mathematical model is closed and balanced  
✅ **Auditable**: All transactions transparent on blockchain  

---

## Common Scenarios

### Scenario 1: Multiple Investors, One Loan

**Setup:**
- Investor A: Invests $30 (receives 30 shares)
- Investor B: Invests $70 (receives 70 shares)
- Pool: $100 total, 100 shares, price = $1.00

**Loan:** Student borrows $50, earns $2 interest

**Result:**
- Pool value: $102
- Share price: $1.02
- Investor A: 30 shares × $1.02 = $30.60 (earned $0.60)
- Investor B: 70 shares × $1.02 = $71.40 (earned $1.40)
- Total: $102 ✓

**Fair split:** 30/70 ratio maintained!

### Scenario 2: Investment During Active Loan

**Setup:**
- Pool has $20 available + $80 in loans = $100 value
- 100 shares outstanding
- Share price = $100 ÷ 100 = $1.00

**New investor adds $50:**
- Receives: 50 ÷ 1.00 = 50 shares
- New pool value: $150
- New total shares: 150
- New share price: $150 ÷ 150 = $1.00 (unchanged) ✓

**Existing investors unaffected!**

### Scenario 3: Partial Withdrawal

**Setup:**
- Own 100 shares at $1.05 = $105 value
- Want to withdraw $50

**Calculation:**
- Shares to sell: $50 ÷ $1.05 = 47.619 shares
- Keep: 100 - 47.619 = 52.381 shares
- Remaining value: 52.381 × $1.05 = $55

**Pool update:**
- availableBalance -= $50
- totalShares -= 47.619
- Share price remains $1.05 ✓

---

**Document Version:** 1.0  
**Last Updated:** March 5, 2026  
**System Status:** Production-Ready ✅
