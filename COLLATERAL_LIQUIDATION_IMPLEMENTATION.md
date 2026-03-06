# Collateral Liquidation and Return System - Implementation Complete

## Overview
The complete collateral liquidation and return functionality has been implemented for the student loan platform. This system handles both successful loan completions and payment defaults with automatic collateral management.

---

## 🎯 Features Implemented

### 1. **Normal Loan Completion**
- ✅ Automatic collateral return marking when all installments are paid
- ✅ Notification system to inform students that collateral is available
- ✅ Frontend "Withdraw Collateral" button on Loan Center page
- ✅ Email notifications for loan completion

### 2. **Missed Repayment & Default Handling**
- ✅ 7-day grace period after missed payment
- ✅ Automatic notification schedule:
  - Days 1-3: Regular payment reminders (email + in-app)
  - Days 4-7: Urgent payment warnings (email + in-app)
  - Day 7+: Automatic collateral liquidation
- ✅ Smart liquidation priority:
  1. Principal recovery first
  2. Interest recovery second
  3. Excess returned to borrower
- ✅ Liquidated amounts added back to investment pool

### 3. **Collateral Valuation**
- ✅ Real-time PAXG to USDT conversion using CoinMarketCap API
- ✅ Accurate valuation during liquidation
- ✅ Excess collateral return to borrower

### 4. **UI/UX Implementation**
- ✅ Loan Center page integration
- ✅ "Withdraw Collateral" button (enabled only after loan completion)
- ✅ Status messages and visual indicators
- ✅ Real-time notifications via Socket.IO
- ✅ Responsive design for mobile and desktop

### 5. **Notifications System**
- ✅ In-app notifications for students and investors
- ✅ Email notifications for all parties
- ✅ Real-time Socket.IO events
- ✅ Notification types:
  - `loan_payment_reminder`
  - `loan_payment_overdue`
  - `collateral_liquidated`
  - `collateral_available_withdrawal`
  - `loan_completed`

---

## 📁 Files Created/Modified

### **Backend - New Files**
1. `backend/services/collateralLiquidationService.js`
   - Core liquidation and return logic
   - Collateral valuation functions
   - Payment reminder system
   - Notification distribution

2. `backend/jobs/loanMonitoringJob.js`
   - Scheduled job for daily overdue checks
   - Grace period monitoring
   - Automatic liquidation trigger
   - Reminder tracking system

### **Backend - Modified Files**
1. `backend/models/notificationModel.js`
   - Added new notification types for loans
   - Added 'Investor' to recipient models
   - Added 'Loan' to related models

2. `backend/controllers/collateralController.js`
   - Added `withdrawCollateral()` endpoint
   - Added `getCollateralStatus()` endpoint
   - Collateral withdrawal request handling

3. `backend/routes/collateralRoutes.js`
   - Added POST `/api/collateral/withdraw`
   - Added GET `/api/collateral/status/:loanId`

4. `backend/server.js`
   - Integrated loan monitoring scheduler
   - Initialized on server startup

### **Frontend - Modified Files**
1. `frontend/src/domains/student/services/collateralService.ts`
   - Added `withdrawCollateral()` function
   - Added `getCollateralStatus()` function

2. `frontend/src/domains/student/pages/LoanCenterPage.tsx`
   - Added collateral withdrawal state management
   - Added withdrawal card UI component
   - Added withdrawal handler function
   - Integrated completed loans display

---

## 🚀 How to Test

### **Prerequisites**
Ensure the backend server is running with MongoDB connected.

### **Test Scenario 1: Normal Loan Completion**

1. **Create and Complete a Loan**
   ```bash
   # In MongoDB, manually update a loan to completed status
   db.loans.updateOne(
     { _id: ObjectId("YOUR_LOAN_ID") },
     { 
       $set: { 
         status: "completed",
         collateralStatus: "returned",
         paymentsCompleted: 12  # or whatever the duration is
       } 
     }
   )
   ```

2. **Check Loan Center Page**
   - Navigate to the Loan Center
   - You should see a green "Collateral Available for Withdrawal" card
   - Click "Withdraw Collateral" button
   - Verify toast notification appears
   - Check in-app notifications for confirmation

3. **Verify Database**
   ```bash
   # Check that collateral status changed to 'withdrawn'
   db.loans.findOne({ _id: ObjectId("YOUR_LOAN_ID") })
   # Check notifications collection
   db.notifications.find({ type: "collateral_available_withdrawal" })
   ```

### **Test Scenario 2: Overdue Payment & Liquidation**

1. **Create an Overdue Installment**
   ```bash
   # In MongoDB, set an installment due date to 8+ days ago
   db.loans.updateOne(
     { _id: ObjectId("YOUR_LOAN_ID"), "repaymentSchedule.installmentNumber": 1 },
     { 
       $set: { 
         "repaymentSchedule.$.dueDate": new Date("2026-02-20"),  # 8+ days ago
         "repaymentSchedule.$.status": "pending"
       } 
     }
   )
   ```

2. **Manually Trigger Liquidation Check**
   ```javascript
   // In backend, create a test endpoint or run via Node REPL
   const { manualOverdueCheck } = require('./jobs/loanMonitoringJob');
   const io = require('./server').io;  // Get socket.io instance
   
   manualOverdueCheck(io).then(result => console.log(result));
   ```

3. **Verify Liquidation**
   - Check console logs for liquidation process
   - Verify loan status changed to "defaulted"
   - Verify collateral status changed to "liquidated"
   - Check investment pool balance increased
   - Verify notifications sent to student and investors

### **Test Scenario 3: Payment Reminders**

1. **Create Overdue Installment (1-7 days)**
   ```bash
   # Set due date to 3 days ago
   db.loans.updateOne(
     { _id: ObjectId("YOUR_LOAN_ID"), "repaymentSchedule.installmentNumber": 1 },
     { 
       $set: { 
         "repaymentSchedule.$.dueDate": new Date("2026-03-03"),  # 3 days ago
         "repaymentSchedule.$.status": "pending"
       } 
     }
   )
   ```

2. **Trigger Reminder Check**
   ```javascript
   const { manualOverdueCheck } = require('./jobs/loanMonitoringJob');
   manualOverdueCheck(io).then(result => console.log(result));
   ```

3. **Verify Reminders**
   - Check console for "📧 Reminder sent for day X"
   - Check student's email inbox
   - Check in-app notifications
   - Verify loan status changed to "overdue" for that installment

### **Test Scenario 4: Scheduled Job**

1. **Enable Test Mode**
   ```javascript
   // In backend/jobs/loanMonitoringJob.js, uncomment test schedule:
   // Line 94-97 for every 5 minutes OR
   // Line 89-92 for every hour
   ```

2. **Restart Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

3. **Monitor Logs**
   - Watch for "⏰ Daily/Hourly/5-minute overdue payment check triggered"
   - Monitor automatic check execution
   - Verify reminders and liquidations happen automatically

---

## 🔧 Configuration

### **Scheduler Settings**
Located in `backend/jobs/loanMonitoringJob.js`:

```javascript
// Production: Daily at 9:00 AM
cron.schedule('0 9 * * *', ...);

// Testing: Every hour
cron.schedule('0 * * * *', ...);

// Intensive testing: Every 5 minutes
cron.schedule('*/5 * * * *', ...);
```

### **Timezone Configuration**
```javascript
// Line 88 in loanMonitoringJob.js
timezone: 'Asia/Kuala_Lumpur'  // Adjust to your timezone
```

### **Grace Period**
Currently hardcoded to 7 days. To modify:
- Change logic in `backend/jobs/loanMonitoringJob.js` line 46
- Update comparison: `if (daysOverdue <= 7)`

---

## 📊 API Endpoints

### **Collateral Withdrawal**
```http
POST /api/collateral/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "loanId": "65f8a9b1c2d3e4f5g6h7i8j9"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Collateral withdrawal initiated",
  "collateral": {
    "amount": 5.2345,
    "walletAddress": "0x123...",
    "status": "withdrawn"
  }
}
```

### **Get Collateral Status**
```http
GET /api/collateral/status/:loanId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "collateral": {
    "amount": 5.2345,
    "valueUSDT": 10469.00,
    "status": "returned",
    "deposited": true,
    "depositedAt": "2026-02-01T10:00:00.000Z",
    "txHash": "0xabc...",
    "walletAddress": "0x123...",
    "canWithdraw": true
  },
  "loan": {
    "id": "65f8a9b1c2d3e4f5g6h7i8j9",
    "status": "completed",
    "paymentsCompleted": 12,
    "totalPayments": 12,
    "amountRepaid": 12000,
    "remainingBalance": 0
  }
}
```

---

## ⚡ Socket.IO Events

### **Client Receives:**

1. **`collateral_available`** - When loan completed
   ```javascript
   {
     loanId: "...",
     collateralAmount: 5.2345,
     timestamp: Date
   }
   ```

2. **`collateral_withdrawn`** - After withdrawal
   ```javascript
   {
     loanId: "...",
     collateralAmount: 5.2345,
     walletAddress: "0x...",
     timestamp: Date
   }
   ```

3. **`payment_reminder`** - Overdue payment
   ```javascript
   {
     loanId: "...",
     daysOverdue: 3,
     daysRemaining: 4,
     severity: "medium",
     timestamp: Date
   }
   ```

4. **`new_notification`** - General notification
   ```javascript
   {
     type: "collateral_liquidated",
     message: "...",
     timestamp: Date
   }
   ```

---

## 🔐 Security Considerations

1. **Blockchain Transfers**: Currently, the actual PAXG transfer from collateral holder to student is marked as "initiated" but requires admin approval with the collateral holder contract's private key. In production, integrate with a secure admin dashboard or automated signing service.

2. **Authorization**: All endpoints use JWT authentication. Only the loan borrower can withdraw their collateral.

3. **Status Checks**: Multiple validation layers ensure collateral can only be withdrawn when:
   - Loan status is "completed"
   - Collateral status is "returned"
   - All payments have been made

4. **Grace Period Tracking**: Uses a persistent tracker to avoid duplicate notifications.

---

## 📝 Database Schema Updates

### **Notification Types Added:**
- `loan_payment_reminder`
- `loan_payment_overdue`
- `loan_default_warning`
- `collateral_liquidated`
- `collateral_available_withdrawal`
- `loan_completed`

### **Recipient Models Added:**
- `Investor` (for liquidation notifications)

### **Related Models Added:**
- `Loan`

---

## 🎨 UI Components

### **Collateral Withdrawal Card** (Loan Center Page)
- **Color**: Green gradient (indicates success/completion)
- **Icon**: Unlock icon
- **Shows**: 
  - Congratulatory message
  - Collateral amount in PAXG
  - Pool name
  - "Withdraw Collateral" button
- **State**: 
  - Disabled during withdrawal (shows loading spinner)
  - Only visible when collateral is available

### **Warning Messages**
- Payments overdue: Orange/amber color scheme
- Liquidation warnings: Red color scheme
- Completion: Green color scheme

---

## 🐛 Troubleshooting

### **Scheduler Not Running**
- Check server logs for "📅 Initializing scheduled jobs..."
- Ensure MongoDB connection is successful
- Verify `initializeLoanMonitoringJobs(io)` is called in server.js

### **No Notifications Sent**
- Check email service configuration (nodemailer)
- Verify Socket.IO connection on frontend
- Check notification model for created records

### **Liquidation Not Triggered**
- Verify loan has `collateralDeposited: true`
- Check installment status is 'pending' or 'overdue'
- Ensure due date is more than 7 days in the past
- Check console logs for error messages

### **Withdrawal Button Not Showing**
- Verify loan status is "completed"
- Check collateralStatus is "returned"
- Ensure frontend is fetching completed loans correctly
- Check browser console for errors

---

## 🚦 Production Deployment Checklist

- [ ] Update scheduler timezone to production timezone
- [ ] Set scheduler to run daily (9:00 AM recommended)
- [ ] Configure email service with production credentials
- [ ] Set up secure admin dashboard for blockchain transfers
- [ ] Implement monitoring/alerting for liquidations
- [ ] Set up proper logging (Winston/Morgan recommended)
- [ ] Configure rate limiting on withdrawal endpoint
- [ ] Set up database backups before liquidations
- [ ] Test notification delivery on production email service
- [ ] Configure environment variables for all services

---

## 📞 Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify database records match expected states
3. Test with manual trigger functions first
4. Review Socket.IO connection status

---

## ✅ Implementation Status

| Feature | Status | Test Status |
|---------|--------|-------------|
| Loan Completion Handling | ✅ Complete | ⏳ Manual Test Required |
| Collateral Return Logic | ✅ Complete | ⏳ Manual Test Required |
| Collateral Withdrawal API | ✅ Complete | ⏳ Manual Test Required |
| Payment Grace Period | ✅ Complete | ⏳ Manual Test Required |
| Reminder Notifications (Days 1-7) | ✅ Complete | ⏳ Manual Test Required |
| Automatic Liquidation | ✅ Complete | ⏳ Manual Test Required |
| PAXG to USDT Conversion | ✅ Complete | ✅ Using CoinMarketCap API |
| Priority Distribution (Principal → Interest → Excess) | ✅ Complete | ⏳ Manual Test Required |
| Pool Balance Update | ✅ Complete | ⏳ Manual Test Required |
| Student Notifications | ✅ Complete | ⏳ Manual Test Required |
| Investor Notifications | ✅ Complete | ⏳ Manual Test Required |
| Email Notifications | ✅ Complete | ⏳ Manual Test Required |
| Socket.IO Real-time Updates | ✅ Complete | ⏳ Manual Test Required |
| Frontend Withdrawal Button | ✅ Complete | ⏳ Manual Test Required |
| Scheduled Job System | ✅ Complete | ⏳ Manual Test Required |
| Status Display & Messages | ✅ Complete | ⏳ Manual Test Required |

---

**Implementation Date**: March 6, 2026  
**System Version**: 1.0.0  
**Framework**: Node.js + Express.js + MongoDB + React + TypeScript
