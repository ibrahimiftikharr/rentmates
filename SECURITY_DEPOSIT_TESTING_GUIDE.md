# Security Deposit System - Quick Testing Guide

## Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`
- MongoDB connected
- Test accounts: 1 student, 1 landlord

---

## Test Scenario 1: Complete Payment Flow

### Step 1: Create Rental Agreement
1. **Landlord:** Create and publish a property
2. **Student:** Send join request to the property
3. **Landlord:** Accept the join request (contract generated)
4. **Student:** Sign the contract
5. **Landlord:** Sign the contract
   - ✅ Rental record created with `securityDepositStatus: 'pending'`
   - ✅ Security deposit due date set to 7 days from now
   - ✅ Email sent to student with payment instructions

### Step 2: Student Pays Security Deposit
1. **Student:** Navigate to Security Deposit page
2. Verify the following is displayed:
   - Security deposit amount (2x monthly rent)
   - Payment due date (7 days from contract signing)
   - Days remaining countdown
   - Moving date
3. Click "Pay Security Deposit Now"
4. Confirm payment in dialog
5. ✅ Verify:
   - Payment successful toast message
   - Wallet balance deducted
   - Status changes to "Paid"
   - Payment date displayed

### Step 3: Landlord Receives Notification
1. **Landlord:** Check notifications
   - ✅ In-app notification: "Security Deposit Received"
   - ✅ Email notification received
2. **Landlord:** Navigate to Security Deposit Management page
   - ✅ Rental shows status: "Paid"
   - ✅ Payment date displayed
   - ✅ Refund button enabled (before moving date)

---

## Test Scenario 2: Refund Flow

### Prerequisites
- Rental exists with paid security deposit
- Current date is before moving date

### Step 1: Landlord Initiates Refund
1. **Landlord:** Navigate to Security Deposit Management page
2. Find the rental with paid deposit
3. Click "Refund Security Deposit"
4. Select a refund reason (e.g., "Visa Rejection or Travel Issue")
5. Confirm refund in dialog
6. ✅ Verify:
   - Success toast message
   - Status changes to "Refunded"
   - Contract status shows "Terminated"

### Step 2: Student Receives Refund
1. **Student:** Navigate to Security Deposit page
   - ✅ Status shows "Refunded"
   - ✅ Refund reason displayed
   - ✅ Refund date displayed
   - ✅ Contract status: "Terminated"
2. **Student:** Check wallet
   - ✅ Balance increased by security deposit amount
3. **Student:** Check notifications
   - ✅ In-app notification: "Security Deposit Refunded"
   - ✅ Email notification received

---

## Test Scenario 3: Reminder System

### Manual Test (Adjust Dates)
To test without waiting 7 days, modify the rental record in MongoDB:

```javascript
// In MongoDB, update the rental's securityDepositDueDate:
db.rentals.updateOne(
  { _id: ObjectId("rental_id") },
  { 
    $set: { 
      securityDepositDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
    }
  }
)
```

### Step 1: Trigger 3-Day Reminder
1. Set `securityDepositDueDate` to 4 days from now
2. Wait for hourly scheduler or restart server
3. ✅ Verify student receives:
   - In-app notification: "Security Deposit Payment Reminder - 3 Days Left"
   - Email with subject: "Security Deposit Reminder - 3 Days Left"

### Step 2: Trigger Daily Reminder
1. Set `securityDepositDueDate` to 2 days from now
2. Wait for hourly scheduler
3. ✅ Verify student receives:
   - In-app notification: "Security Deposit Payment Reminder - 2 Days Left"
   - Email notification

### Step 3: Trigger Urgent Reminder
1. Set `securityDepositDueDate` to 1 day from now
2. Wait for hourly scheduler
3. ✅ Verify student receives:
   - In-app notification: "⚠️ URGENT: Security Deposit Due Tomorrow!"
   - Email with subject: "URGENT: Security Deposit Due Tomorrow"

---

## Test Scenario 4: Automatic Termination

### Manual Test
```javascript
// In MongoDB, set the due date to the past:
db.rentals.updateOne(
  { _id: ObjectId("rental_id") },
  { 
    $set: { 
      securityDepositDueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    }
  }
)
```

### Step 1: Wait for Scheduler
1. Wait for hourly check or restart server
2. ✅ Verify in MongoDB:
   ```javascript
   {
     status: "terminated",
     terminationReason: "Security deposit not paid within 7 days",
     securityDepositStatus: "overdue",
     terminatedAt: <timestamp>
   }
   ```

### Step 2: Verify Notifications
1. **Student:** Check notifications
   - ✅ In-app notification: "Rental Contract Terminated"
   - ✅ Email: "Rental Contract Terminated - RentMates"
2. **Landlord:** Check notifications
   - ✅ In-app notification: "Rental Contract Terminated"
   - ✅ Email notification received

### Step 3: Verify UI Updates
1. **Student:** Navigate to Security Deposit page
   - ✅ Shows "No active rental" or "Contract Terminated"
2. **Student:** Check wallet/rent payment page
   - ✅ Rental removed from rent payment schedule

---

## Test Scenario 5: Edge Cases

### Test 5.1: Insufficient Balance
1. **Student:** Ensure wallet balance < security deposit amount
2. **Student:** Try to pay security deposit
3. ✅ Verify error: "Insufficient balance"

### Test 5.2: Double Payment Attempt
1. **Student:** Pay security deposit successfully
2. **Student:** Try to pay again
3. ✅ Verify error: "Security deposit already paid"

### Test 5.3: Refund After Moving Date
1. **Landlord:** Try to refund after moving date
2. ✅ Verify:
   - Refund button is disabled
   - Message: "Refund is no longer available (moving date has passed)"

### Test 5.4: Payment After Deadline
1. Set security deposit due date to the past
2. **Student:** Try to pay security deposit
3. ✅ Verify:
   - Payment button disabled
   - Message: "Payment Overdue"
   - Error: "Security deposit payment deadline has passed"

---

## Test Scenario 6: Real-Time Updates

### Prerequisites
- Two browser windows: one for student, one for landlord
- Both logged in and on their respective pages

### Step 1: Payment Real-Time Update
1. **Student (Window 1):** Pay security deposit
2. **Landlord (Window 2):** Observe in real-time
   - ✅ Notification badge updates
   - ✅ Toast notification appears
   - ✅ Security deposit page auto-refreshes

### Step 2: Refund Real-Time Update
1. **Landlord (Window 1):** Refund security deposit
2. **Student (Window 2):** Observe in real-time
   - ✅ Notification badge updates
   - ✅ Toast notification appears
   - ✅ Security deposit page updates to "Refunded"

---

## Verification Checklist

### Database Verification
```javascript
// Check rental record
db.rentals.findOne({ _id: ObjectId("rental_id") })

// Check notifications
db.notifications.find({ 
  type: { $in: ['security_deposit_paid', 'security_deposit_reminder', 'security_deposit_refunded', 'contract_terminated'] }
}).sort({ createdAt: -1 })

// Check transactions
db.transactions.find({ 
  type: 'rent_payment',
  description: { $regex: 'security deposit' }
}).sort({ createdAt: -1 })

// Check user wallet balance
db.users.findOne({ _id: ObjectId("user_id") }, { offChainBalance: 1 })
```

### API Testing with cURL

#### Get Security Deposit Status (Student)
```bash
curl -X GET http://localhost:5000/api/security-deposit/status \
  -H "Authorization: Bearer <student_token>"
```

#### Pay Security Deposit (Student)
```bash
curl -X POST http://localhost:5000/api/security-deposit/pay \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json"
```

#### Get Rental Deposit Info (Landlord)
```bash
curl -X GET http://localhost:5000/api/security-deposit/landlord/<rental_id> \
  -H "Authorization: Bearer <landlord_token>"
```

#### Refund Security Deposit (Landlord)
```bash
curl -X POST http://localhost:5000/api/security-deposit/refund \
  -H "Authorization: Bearer <landlord_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rentalId": "<rental_id>",
    "reason": "Visa Rejection or Travel Issue"
  }'
```

---

## Scheduler Testing

### Check Scheduler Logs
The scheduler logs appear in the backend console:
```
=== Initializing Security Deposit Scheduled Jobs ===
✓ Security deposit scheduled jobs initialized
- Hourly check: Every hour at minute 0
- Initial check: 10 seconds after startup
```

### Manual Scheduler Trigger
If you need to test without waiting, you can call the function directly in the backend:

```javascript
// In backend/server.js or a test script:
const { checkSecurityDepositDeadlines } = require('./services/securityDepositScheduler');

// Trigger manually
checkSecurityDepositDeadlines();
```

---

## Expected Results Summary

| Action | Expected Result |
|--------|----------------|
| Contract signed by both parties | Rental created, deposit status: pending, due date: +7 days |
| Student pays deposit | Balance deducted, status: paid, landlord notified |
| Day 4 after signing | 3-day reminder sent to student |
| Days 5-7 after signing | Daily reminders sent to student |
| 7 days passed (unpaid) | Contract auto-terminated, both parties notified |
| Landlord refunds (before move-in) | Deposit refunded, contract terminated, student notified |
| Landlord tries refund (after move-in) | Button disabled, error message |
| Student insufficient balance | Payment fails with error |
| Student tries double payment | Error: already paid |

---

## Common Issues & Solutions

### Issue: Reminders not being sent
**Solution:** 
- Verify scheduler is initialized (check server logs)
- Check `securityDepositDueDate` in database
- Ensure MongoDB connection is stable

### Issue: Payment succeeds but balance not updated
**Solution:**
- Check transaction was created in database
- Verify `offChainBalance` field in user model
- Check console for any error logs

### Issue: Socket events not working
**Solution:**
- Verify client is connected to socket (check browser console)
- Ensure user joined their room (`join_room` event sent)
- Check `io` object is available in `req.app.get('io')`

### Issue: Emails not being sent
**Solution:**
- Check email service configuration in `.env`
- Verify nodemailer credentials are correct
- Check spam folder

---

## Performance Testing

To simulate multiple rentals:
1. Create 10+ test rental agreements
2. Set various due dates (past, near future, far future)
3. Run scheduler and verify it processes all correctly
4. Check server performance and response times

---

## Next Steps After Testing

1. ✅ Verify all test scenarios pass
2. ✅ Check database consistency
3. ✅ Review email templates and notifications
4. ✅ Test on different browsers (Chrome, Firefox, Safari)
5. ✅ Test on mobile devices
6. ✅ Run performance tests with multiple concurrent users
7. ✅ Review security (authentication, authorization)
8. ✅ Deploy to staging environment
9. ✅ Conduct user acceptance testing (UAT)
10. ✅ Deploy to production

---

Happy Testing! 🚀
