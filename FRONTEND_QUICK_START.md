# Frontend Quick Start Guide 🚀

## Using the Join Request API

The complete backend is ready. Import and use the service:

```typescript
import {
  checkStudentProfile,
  checkPropertyVisit,
  checkHigherBids,
  createJoinRequest,
  getStudentJoinRequests,
  deleteJoinRequest,
  studentSignContract,
  getLandlordJoinRequests,
  checkLandlordProfile,
  acceptJoinRequest,
  rejectJoinRequest,
  landlordSignContract
} from '@/shared/services/joinRequestService';
```

---

## Common Usage Patterns

### 1. Student Submits Join Request

```typescript
// Step 1: Check profile
const { isComplete, missingFields } = await checkStudentProfile();
if (!isComplete) {
  showError("Please complete your profile first:", missingFields);
  return;
}

// Step 2: Check visit (optional warning)
const { hasVisited } = await checkPropertyVisit(propertyId);
if (!hasVisited) {
  const proceed = await showWarning("You haven't visited this property yet. Continue?");
  if (!proceed) return;
}

// Step 3: Check higher bids (optional warning)
const { hasHigherBids, highestBid } = await checkHigherBids(propertyId, bidAmount);
if (hasHigherBids) {
  const proceed = await showWarning(`Landlord has a higher bid of $${highestBid}. Continue?`);
  if (!proceed) return;
}

// Step 4: Submit request
await createJoinRequest({
  propertyId,
  movingDate: "2024-03-01",
  bidAmount: 1200,
  message: "I'm interested in renting this property..."
});

showSuccess("Join request submitted!");
```

### 2. Student Views Requests

```typescript
// Get all pending requests
const { joinRequests } = await getStudentJoinRequests('pending');

// Get all approved requests
const { joinRequests } = await getStudentJoinRequests('approved');

// Get ALL requests (no filter)
const { joinRequests } = await getStudentJoinRequests();
```

### 3. Student Deletes Pending Request

```typescript
const confirmed = await confirmDialog("Delete this join request?");
if (confirmed) {
  await deleteJoinRequest(requestId);
  showSuccess("Request deleted");
  refreshList();
}
```

### 4. Student Signs Contract

```typescript
// Show contract from joinRequest.contract.content
const signature = await getSignatureFromUser();

await studentSignContract(requestId, signature);
showSuccess("Contract signed! Waiting for landlord signature.");
```

### 5. Landlord Views Requests

```typescript
// Get all pending requests
const { joinRequests } = await getLandlordJoinRequests('pending');

// Each request has:
// - student info (name, email)
// - property info
// - bidAmount, movingDate, message
```

### 6. Landlord Accepts Request

```typescript
// Check profile first
const { isComplete, missingFields } = await checkLandlordProfile();
if (!isComplete) {
  showBlockingError("Complete your profile first:", missingFields);
  return;
}

// Accept request
await acceptJoinRequest(requestId);
showSuccess("Request accepted! Contract generated and sent to student.");
```

### 7. Landlord Rejects Request

```typescript
const reason = await promptForReason();
if (!reason) return;

await rejectJoinRequest(requestId, reason);
showSuccess("Request rejected");
```

### 8. Landlord Signs Contract

```typescript
// Show contract from joinRequest.contract.content
const signature = await getSignatureFromUser();

const { rental } = await landlordSignContract(requestId, signature);

// rental object contains:
// - movingDate
// - monthlyRentAmount
// - securityDepositAmount
// - securityDepositDueDate
// - monthlyRentDueDate (day of month, e.g., 10)
// - status: "registered"

showSuccess("Contract signed! Rental agreement complete.");
```

---

## Response Structures

### JoinRequest Object
```typescript
{
  _id: string;
  student: ObjectId | User;
  landlord: ObjectId | User;
  property: ObjectId | Property;
  movingDate: Date;
  bidAmount: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'waiting_completion' | 'completed';
  contract?: {
    generatedAt: Date;
    content: string;
    studentSignature: {
      signed: boolean;
      signedAt?: Date;
      signature?: string;
    };
    landlordSignature: {
      signed: boolean;
      signedAt?: Date;
      signature?: string;
    };
  };
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rental Object
```typescript
{
  _id: string;
  student: ObjectId;
  landlord: ObjectId;
  property: ObjectId;
  monthlyRentAmount: number;
  securityDepositAmount: number;
  movingDate: Date;
  monthlyRentDueDate: number; // 1-31 (day of month)
  securityDepositDueDate: Date;
  contractSignedDate: Date;
  signedContract: {
    content: string;
    studentSignature: string;
    landlordSignature: string;
    generatedAt: Date;
  };
  propertyInfo: {
    title: string;
    address: string;
    propertyType: string;
  };
  studentInfo: {
    name: string;
    email: string;
    phone: string;
    governmentId: string;
    university: string;
  };
  landlordInfo: {
    name: string;
    email: string;
    phone: string;
    governmentId: string;
  };
  status: 'registered' | 'active' | 'terminated' | 'completed';
  payments: Array<{
    amount: number;
    type: 'rent' | 'deposit' | 'other';
    paidAt: Date;
    status: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## UI Components Needed

### 1. Profile Pages (Student & Landlord)

Add a new input field:

```tsx
<div className="form-field">
  <label htmlFor="governmentId">Government ID *</label>
  <input
    id="governmentId"
    type="text"
    value={governmentId}
    onChange={(e) => setGovernmentId(e.target.value)}
    placeholder="Enter your government ID number"
    required
  />
</div>
```

### 2. Property Details - Join Request Button

```tsx
<button onClick={handleRequestToJoin}>Request to Join</button>

const handleRequestToJoin = async () => {
  // Check profile
  const { isComplete } = await checkStudentProfile();
  if (!isComplete) {
    showProfileIncompleteModal();
    return;
  }
  
  // Check visit
  const { hasVisited } = await checkPropertyVisit(propertyId);
  if (!hasVisited) {
    const proceed = await showVisitWarningModal();
    if (!proceed) return;
  }
  
  // Show request form modal
  showJoinRequestModal();
};
```

### 3. Student Join Requests Page with Tabs

```tsx
<Tabs defaultValue="pending">
  <TabsList>
    <TabsTrigger value="pending">Pending</TabsTrigger>
    <TabsTrigger value="approved">Approved</TabsTrigger>
    <TabsTrigger value="waiting">Waiting Completion</TabsTrigger>
    <TabsTrigger value="rejected">Rejected</TabsTrigger>
    <TabsTrigger value="completed">Completed</TabsTrigger>
  </TabsList>

  <TabsContent value="pending">
    {requests.map(req => (
      <RequestCard 
        key={req._id}
        request={req}
        actions={
          <button onClick={() => handleDelete(req._id)}>Delete</button>
        }
      />
    ))}
  </TabsContent>

  <TabsContent value="approved">
    {requests.map(req => (
      <RequestCard 
        key={req._id}
        request={req}
        contract={req.contract?.content}
        actions={
          <button onClick={() => handleSign(req._id)}>Sign Contract</button>
        }
      />
    ))}
  </TabsContent>

  <TabsContent value="waiting">
    {requests.map(req => (
      <RequestCard 
        key={req._id}
        request={req}
        contract={req.contract?.content}
        message="Waiting for landlord to sign..."
      />
    ))}
  </TabsContent>

  <TabsContent value="rejected">
    {requests.map(req => (
      <RequestCard 
        key={req._id}
        request={req}
        rejectionReason={req.rejectionReason}
      />
    ))}
  </TabsContent>

  <TabsContent value="completed">
    {requests.map(req => (
      <RequestCard 
        key={req._id}
        request={req}
        contract={req.contract?.content}
        fullySignedIndicator
      />
    ))}
  </TabsContent>
</Tabs>
```

### 4. Landlord Join Requests Page

```tsx
<div className="join-requests">
  {requests.map(req => (
    <div key={req._id} className="request-card">
      <h3>{req.student.name}</h3>
      <p>Property: {req.property.title}</p>
      <p>Bid: ${req.bidAmount}/month</p>
      <p>Moving Date: {new Date(req.movingDate).toLocaleDateString()}</p>
      <p>Message: {req.message}</p>
      
      {req.status === 'pending' && (
        <>
          <button onClick={() => handleAccept(req._id)}>Accept</button>
          <button onClick={() => handleReject(req._id)}>Reject</button>
        </>
      )}
      
      {req.status === 'waiting_completion' && (
        <>
          <div className="contract">{req.contract.content}</div>
          <button onClick={() => handleSignContract(req._id)}>Sign Contract</button>
        </>
      )}
    </div>
  ))}
</div>
```

### 5. Signature Modal Component

```tsx
import SignatureCanvas from 'react-signature-canvas';

const SignatureModal = ({ onSign, onCancel }) => {
  const sigCanvas = useRef();
  
  const handleSave = () => {
    const signatureData = sigCanvas.current.toDataURL();
    onSign(signatureData);
  };
  
  return (
    <Dialog open>
      <DialogContent>
        <h2>Sign Contract</h2>
        <SignatureCanvas 
          ref={sigCanvas}
          penColor='black'
          canvasProps={{ width: 500, height: 200 }}
        />
        <div className="actions">
          <button onClick={() => sigCanvas.current.clear()}>Clear</button>
          <button onClick={handleSave}>Save Signature</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### 6. Landlord Tenants Page Update

```tsx
// Fetch rentals instead of just join requests
const fetchTenants = async () => {
  // You may need to create a new endpoint: GET /api/rentals/landlord
  // For now, you can query completed join requests
  const { joinRequests } = await getLandlordJoinRequests('completed');
  
  const tenants = joinRequests.map(req => ({
    id: req._id,
    name: req.student.name,
    property: req.property.title,
    moveInDate: req.movingDate,
    rentAmount: req.bidAmount,
    status: 'Registered', // or from rental.status
    securityDepositDue: req.rental?.securityDepositDueDate
  }));
  
  setTenants(tenants);
};
```

---

## Socket.IO Real-Time Updates

Listen for these events:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// Join room when user logs in
socket.emit('join_room', { 
  userId: user._id, 
  role: user.role // 'student' or 'landlord'
});

// For students:
socket.on('join_request_approved', (data) => {
  // Refresh join requests list
  // Show notification
});

socket.on('contract_landlord_signed', (data) => {
  // Refresh join requests list
  // Show success message
});

socket.on('join_request_rejected', (data) => {
  // Refresh join requests list
  // Show rejection reason
});

socket.on('rental_completed', (data) => {
  // Show success message with rental details
});

// For landlords:
socket.on('new_join_request', (data) => {
  // Refresh join requests list
  // Show notification
});

socket.on('contract_student_signed', (data) => {
  // Refresh pending signatures list
  // Show notification
});
```

---

## Error Handling

All functions throw errors with this structure:

```typescript
try {
  await createJoinRequest(data);
} catch (error) {
  // error.error contains the error message
  // error.message contains additional details
  showError(error.message || error.error);
}
```

Common error responses:
- `{ error: 'Profile incomplete', message: 'Please complete your profile...' }`
- `{ error: 'Join request not found' }`
- `{ error: 'Missing required fields' }`
- `{ error: 'Property not found' }`

---

## Testing Checklist

- [ ] Student can add Government ID to profile
- [ ] Landlord can add Government ID to profile
- [ ] Student sees blocking error if profile incomplete
- [ ] Student sees warning if property not visited
- [ ] Student sees warning if higher bid exists
- [ ] Student can submit join request
- [ ] Landlord receives notification
- [ ] Landlord can accept request
- [ ] Contract is generated and shown to student
- [ ] Student can sign contract
- [ ] Landlord receives notification
- [ ] Landlord can sign contract
- [ ] Rental is created with correct due dates
- [ ] Student appears in Tenants page
- [ ] Student can delete pending requests
- [ ] Landlord can reject requests with reason
- [ ] Rejection reason is shown to student
- [ ] All tabs show correct data
- [ ] Socket.IO updates work in real-time
- [ ] Email notifications are sent

---

**Backend Ready ✅**  
**Service Layer Ready ✅**  
**Now implement the UI! 🎨**
