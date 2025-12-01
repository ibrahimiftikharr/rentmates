const JoinRequest = require('../models/joinRequestModel');
const Rental = require('../models/rentalModel');
const Property = require('../models/propertyModel');
const Student = require('../models/studentModel');
const Landlord = require('../models/landlordModel');
const User = require('../models/userModel');
const VisitRequest = require('../models/visitRequestModel');
const Notification = require('../models/notificationModel');
const emailService = require('../services/emailService');
const { emitDashboardUpdate } = require('../utils/socketHelpers');

// Check if student profile is complete
exports.checkStudentProfileCompletion = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    const student = await Student.findOne({ user: userId });

    if (!user || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const isComplete = 
      user.name && user.name.trim() !== '' &&
      student.governmentId && student.governmentId.trim() !== '' &&
      (student.documents.nationalId || student.documents.passport);

    res.json({
      success: true,
      isComplete,
      missingFields: {
        name: !user.name || user.name.trim() === '',
        governmentId: !student.governmentId || student.governmentId.trim() === '',
        idDocument: !student.documents.nationalId && !student.documents.passport
      }
    });
  } catch (error) {
    console.error('Error checking profile completion:', error);
    res.status(500).json({ error: 'Failed to check profile completion' });
  }
};

// Check if student has visited the property
exports.checkPropertyVisit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;

    const visitRequests = await VisitRequest.find({
      student: userId,
      property: propertyId,
      status: { $in: ['scheduled', 'completed'] }
    });

    res.json({
      success: true,
      hasVisited: visitRequests.length > 0,
      visits: visitRequests
    });
  } catch (error) {
    console.error('Error checking property visit:', error);
    res.status(500).json({ error: 'Failed to check visit status' });
  }
};

// Check for higher bids
exports.checkHigherBids = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { bidAmount } = req.body;

    const property = await Property.findById(propertyId).populate('landlord');
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const landlordUserId = property.landlord.user;

    // Find all pending join requests for this landlord
    const existingRequests = await JoinRequest.find({
      landlord: landlordUserId,
      status: 'pending'
    }).sort({ bidAmount: -1 });

    const higherBids = existingRequests.filter(req => req.bidAmount > bidAmount);

    res.json({
      success: true,
      hasHigherBids: higherBids.length > 0,
      highestBid: existingRequests.length > 0 ? existingRequests[0].bidAmount : 0,
      higherBidsCount: higherBids.length
    });
  } catch (error) {
    console.error('Error checking higher bids:', error);
    res.status(500).json({ error: 'Failed to check bids' });
  }
};

// Create join request
exports.createJoinRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId, movingDate, bidAmount, message } = req.body;

    // Validate required fields
    if (!propertyId || !movingDate || !bidAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if student profile is complete
    const user = await User.findById(userId);
    const student = await Student.findOne({ user: userId });

    if (!user || !student) {
      // If student profile doesn't exist, create it automatically
      if (!student && user) {
        const newStudent = new Student({
          user: userId,
          reputationScore: 0
        });
        await newStudent.save();
        
        return res.status(400).json({
          error: 'Profile incomplete',
          message: 'Your student profile was just created. Please complete your profile (name, government ID, and ID document) before submitting a join request'
        });
      }
      
      return res.status(404).json({ error: 'Student not found' });
    }

    const isComplete = 
      user.name && user.name.trim() !== '' &&
      student.governmentId && student.governmentId.trim() !== '' &&
      (student.documents.nationalId || student.documents.passport);

    if (!isComplete) {
      return res.status(400).json({
        error: 'Profile incomplete',
        message: 'Please complete your profile (name, government ID, and ID document) before submitting a join request'
      });
    }

    // Get property and landlord info
    const property = await Property.findById(propertyId).populate('landlord');
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const landlordUserId = property.landlord.user; // User ID
    const landlordDocId = property.landlord._id; // Landlord document ID

    // Check for duplicate pending requests
    const existingRequest = await JoinRequest.findOne({
      student: userId,
      property: propertyId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        error: 'You already have a pending request for this property'
      });
    }

    // Create join request
    const joinRequest = new JoinRequest({
      student: userId,
      landlord: landlordUserId, // User ID as per schema
      property: propertyId,
      movingDate: new Date(movingDate),
      bidAmount: parseFloat(bidAmount),
      message: message || ''
    });

    await joinRequest.save();

    // Create notification for landlord
    const notification = new Notification({
      recipient: landlordDocId, // Landlord document ID for recipientModel 'Landlord'
      recipientModel: 'Landlord',
      type: 'join_request',
      title: 'New Join Request',
      message: `${user.name} has requested to join your property: ${property.title}`,
      relatedId: joinRequest._id,
      relatedModel: 'JoinRequest'
    });

    await notification.save();

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.to(`landlord_${landlordUserId}`).emit('new_join_request', {
        joinRequest,
        student: {
          name: user.name,
          email: user.email
        },
        property: {
          title: property.title
        }
      });
    }

    // Emit dashboard update for student
    emitDashboardUpdate(io, userId, 'metrics_updated');

    res.json({
      success: true,
      message: 'Join request submitted successfully',
      joinRequest
    });
  } catch (error) {
    console.error('Error creating join request:', error);
    res.status(500).json({ error: 'Failed to create join request' });
  }
};

// Get student's join requests
exports.getStudentJoinRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { student: userId };
    if (status) {
      query.status = status;
    }

    const joinRequests = await JoinRequest.find(query)
      .populate('property')
      .populate('landlord', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      joinRequests
    });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({ error: 'Failed to fetch join requests' });
  }
};

// Delete join request (only if pending)
exports.deleteJoinRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const joinRequest = await JoinRequest.findOne({
      _id: requestId,
      student: userId,
      status: 'pending'
    });

    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found or cannot be deleted' });
    }

    await JoinRequest.deleteOne({ _id: requestId });

    res.json({
      success: true,
      message: 'Join request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting join request:', error);
    res.status(500).json({ error: 'Failed to delete join request' });
  }
};

// Get landlord's join requests
exports.getLandlordJoinRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { landlord: userId };
    if (status) {
      query.status = status;
    }

    const joinRequests = await JoinRequest.find(query)
      .populate('property')
      .populate('student', 'name email') // student refs User, so this populates User directly
      .sort({ createdAt: -1 });

    // Populate additional student details
    const enrichedRequests = await Promise.all(
      joinRequests.map(async (request) => {
        const studentProfile = await Student.findOne({ user: request.student._id });
        
        return {
          ...request.toObject(),
          studentProfile: studentProfile ? {
            bio: studentProfile.bio,
            interests: studentProfile.interests || [],
            reputationScore: studentProfile.reputationScore,
            profileImage: studentProfile.documents?.profileImage || null
          } : null
        };
      })
    );

    res.json({
      success: true,
      joinRequests: enrichedRequests
    });
  } catch (error) {
    console.error('Error fetching landlord join requests:', error);
    res.status(500).json({ error: 'Failed to fetch join requests' });
  }
};

// Check landlord profile completion for accepting requests
exports.checkLandlordProfileCompletion = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    const landlord = await Landlord.findOne({ user: userId });

    if (!user || !landlord) {
      return res.status(404).json({ error: 'Landlord not found' });
    }

    const isComplete = landlord.checkProfileCompletion();

    res.json({
      success: true,
      isComplete,
      missingFields: {
        name: !user.name || user.name.trim() === '',
        governmentId: !landlord.governmentId || landlord.governmentId.trim() === '',
        govIdDocument: !landlord.govIdDocument || landlord.govIdDocument.trim() === '',
        phone: !landlord.phone,
        address: !landlord.address,
        profileImage: !landlord.profileImage
      }
    });
  } catch (error) {
    console.error('Error checking landlord profile:', error);
    res.status(500).json({ error: 'Failed to check profile' });
  }
};

// Accept join request (landlord)
exports.acceptJoinRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    // Check landlord profile completion
    const user = await User.findById(userId);
    const landlord = await Landlord.findOne({ user: userId });

    if (!user || !landlord) {
      return res.status(404).json({ error: 'Landlord not found' });
    }

    const isComplete = landlord.checkProfileCompletion();

    if (!isComplete) {
      return res.status(400).json({
        error: 'Profile incomplete',
        message: 'Please complete your profile (including government ID and ID document) before accepting join requests'
      });
    }

    // Find join request
    const joinRequest = await JoinRequest.findOne({
      _id: requestId,
      landlord: userId,
      status: 'pending'
    })
      .populate('property');

    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    // Get student and student user
    const studentUser = await User.findById(joinRequest.student);
    const studentDoc = await Student.findOne({ user: joinRequest.student });

    if (!studentUser || !studentDoc) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Generate contract
    const contract = generateContract({
      movingDate: joinRequest.movingDate,
      bidAmount: joinRequest.bidAmount,
      property: joinRequest.property,
      studentName: studentUser.name,
      studentGovId: studentDoc.governmentId,
      landlordName: user.name,
      landlordGovId: landlord.governmentId
    });

    // Update join request
    joinRequest.status = 'approved';
    joinRequest.contract = {
      generatedAt: new Date(),
      content: contract.content, // Store the full formatted content
      propertyTitle: contract.propertyTitle,
      propertyAddress: contract.propertyAddress,
      landlordName: contract.landlordName,
      landlordGovId: contract.landlordGovId,
      studentName: contract.studentName,
      studentGovId: contract.studentGovId,
      requestDate: contract.requestDate,
      monthlyRent: contract.monthlyRent,
      rentDueDay: contract.rentDueDay,
      securityDeposit: contract.securityDeposit,
      leaseDuration: contract.leaseDuration,
      leaseStartDate: contract.leaseStartDate,
      leaseEndDate: contract.leaseEndDate,
      moveInDate: contract.moveInDate,
      studentSignature: {
        signed: false
      },
      landlordSignature: {
        signed: false
      }
    };

    await joinRequest.save();

    // Create notification for student
    const notification = new Notification({
      recipient: studentDoc._id, // Student document ID
      recipientModel: 'Student',
      type: 'join_request',
      title: 'Join Request Approved',
      message: `Your join request for "${joinRequest.property.title}" has been approved! Please sign the contract.`,
      relatedId: joinRequest._id,
      relatedModel: 'JoinRequest'
    });

    await notification.save();

    // Send email to student
    try {
      await emailService.sendEmail({
        to: studentUser.email,
        subject: 'Join Request Approved - Sign Your Contract',
        text: `Good news! Your join request for "${joinRequest.property.title}" has been approved by ${user.name}. Please log in to sign the rental contract.`
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${joinRequest.student}`).emit('join_request_approved', {
        joinRequest,
        landlord: {
          name: user.name,
          email: user.email
        }
      });
    }

    res.json({
      success: true,
      message: 'Join request approved successfully',
      joinRequest
    });
  } catch (error) {
    console.error('Error accepting join request:', error);
    res.status(500).json({ error: 'Failed to accept join request' });
  }
};

// Reject join request (landlord)
exports.rejectJoinRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Find join request
    const joinRequest = await JoinRequest.findOne({
      _id: requestId,
      landlord: userId,
      status: 'pending'
    })
      .populate('property');

    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    const user = await User.findById(userId);
    const studentUser = await User.findById(joinRequest.student);
    const studentDoc = await Student.findOne({ user: joinRequest.student });

    // Update join request
    joinRequest.status = 'rejected';
    joinRequest.rejectionReason = reason;

    await joinRequest.save();

    // Create notification for student
    const notification = new Notification({
      recipient: studentDoc._id, // Student document ID
      recipientModel: 'Student',
      type: 'join_request',
      title: 'Join Request Rejected',
      message: `Your join request for "${joinRequest.property.title}" has been rejected.`,
      relatedId: joinRequest._id,
      relatedModel: 'JoinRequest'
    });

    await notification.save();

    // Send email to student
    try {
      await emailService.sendEmail({
        to: studentUser.email,
        subject: 'Join Request Update',
        text: `Unfortunately, your join request for "${joinRequest.property.title}" has been rejected by ${user.name}.\n\nReason: ${reason}`
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${joinRequest.student}`).emit('join_request_rejected', {
        joinRequest,
        reason
      });
    }

    res.json({
      success: true,
      message: 'Join request rejected',
      joinRequest
    });
  } catch (error) {
    console.error('Error rejecting join request:', error);
    res.status(500).json({ error: 'Failed to reject join request' });
  }
};

// Student signs contract
exports.studentSignContract = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    const { signature } = req.body;

    if (!signature || signature.trim() === '') {
      return res.status(400).json({ error: 'Signature is required' });
    }

    // Find join request
    const joinRequest = await JoinRequest.findOne({
      _id: requestId,
      student: userId,
      status: 'approved'
    })
      .populate('property');

    if (!joinRequest) {
      return res.status(404).json({ error: 'Join request not found or not approved yet' });
    }

    const user = await User.findById(userId);
    const landlordUser = await User.findById(joinRequest.landlord);
    const landlordDoc = await Landlord.findOne({ user: joinRequest.landlord });

    // Update student signature
    joinRequest.contract.studentSignature = {
      signed: true,
      signedAt: new Date(),
      signature: signature
    };
    joinRequest.status = 'waiting_completion';

    await joinRequest.save();

    // Create notification for landlord
    const notification = new Notification({
      recipient: landlordDoc._id, // Landlord document ID
      recipientModel: 'Landlord',
      type: 'join_request',
      title: 'Contract Signed by Student',
      message: `${user.name} has signed the rental contract. Please sign to complete the process.`,
      relatedId: joinRequest._id,
      relatedModel: 'JoinRequest'
    });

    await notification.save();

    // Send email to landlord
    try {
      await emailService.sendEmail({
        to: landlordUser.email,
        subject: 'Contract Ready for Your Signature',
        text: `${user.name} has signed the rental contract for "${joinRequest.property.title}". Please log in to review and sign the contract to finalize the rental agreement.`
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.to(`landlord_${joinRequest.landlord}`).emit('contract_student_signed', {
        joinRequest,
        student: {
          name: user.name,
          email: user.email
        }
      });
    }

    res.json({
      success: true,
      message: 'Contract signed successfully. Waiting for landlord signature.',
      joinRequest
    });
  } catch (error) {
    console.error('Error signing contract (student):', error);
    res.status(500).json({ error: 'Failed to sign contract' });
  }
};

// Landlord signs contract and creates rental
exports.landlordSignContract = async (req, res) => {
  try {
    console.log('=== LANDLORD SIGN CONTRACT START ===');
    const userId = req.user.id;
    const { requestId } = req.params;
    const { signature } = req.body;
    console.log('User ID:', userId);
    console.log('Request ID:', requestId);
    console.log('Signature:', signature);

    if (!signature || signature.trim() === '') {
      console.log('ERROR: Signature is missing or empty');
      return res.status(400).json({ success: false, error: 'Signature is required' });
    }

    // Find join request
    console.log('Finding join request...');
    const joinRequest = await JoinRequest.findOne({
      _id: requestId,
      landlord: userId,
      status: 'waiting_completion'
    })
      .populate('property');

    if (!joinRequest) {
      console.log('ERROR: Join request not found');
      return res.status(404).json({ success: false, error: 'Join request not found or student has not signed yet' });
    }

    console.log('Join request found:', joinRequest._id);
    
    console.log('Fetching user data...');
    const user = await User.findById(userId);
    const landlord = await Landlord.findOne({ user: userId });
    const studentUser = await User.findById(joinRequest.student);
    const studentDoc = await Student.findOne({ user: joinRequest.student });
    console.log('User data fetched successfully');

    // Update landlord signature
    console.log('Updating landlord signature...');
    joinRequest.contract.landlordSignature = {
      signed: true,
      signedAt: new Date(),
      signature: signature
    };
    joinRequest.status = 'completed';

    await joinRequest.save();
    console.log('Join request updated and saved');

    // Calculate due dates
    const contractSignedDate = new Date();
    const securityDepositDueDate = new Date(contractSignedDate);
    securityDepositDueDate.setDate(securityDepositDueDate.getDate() + 7);

    const movingDate = new Date(joinRequest.movingDate);
    const monthlyRentDueDate = (movingDate.getDate() + 7) % 31 || 31;

    // Calculate lease dates
    const leaseStartDate = new Date(joinRequest.movingDate);
    const leaseEndDate = new Date(leaseStartDate);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + (joinRequest.leaseDurationMonths || 12));

    // Create rental record
    console.log('Creating rental record...');
    const rental = new Rental({
      student: joinRequest.student,
      landlord: userId,
      property: joinRequest.property._id,
      joinRequest: joinRequest._id,
      monthlyRentAmount: joinRequest.bidAmount,
      securityDepositAmount: joinRequest.bidAmount * 2, // Assuming 2 months rent as deposit
      movingDate: joinRequest.movingDate,
      monthlyRentDueDate: monthlyRentDueDate,
      securityDepositDueDate: securityDepositDueDate,
      contractSignedDate: contractSignedDate,
      leaseStartDate: leaseStartDate,
      leaseEndDate: leaseEndDate,
      signedContract: {
        content: joinRequest.contract.content,
        studentSignature: joinRequest.contract.studentSignature.signature,
        landlordSignature: joinRequest.contract.landlordSignature.signature,
        generatedAt: joinRequest.contract.generatedAt
      },
      propertyInfo: {
        title: joinRequest.property.title,
        address: joinRequest.property.address,
        city: joinRequest.property.city,
        bedrooms: joinRequest.property.bedrooms,
        bathrooms: joinRequest.property.bathrooms,
        furnishingStatus: joinRequest.property.furnishingStatus
      },
      studentInfo: {
        name: studentUser.name,
        email: studentUser.email,
        phone: studentUser.phone || '',
        governmentId: studentDoc.governmentId,
        university: studentDoc.university
      },
      landlordInfo: {
        name: user.name,
        email: user.email,
        phone: landlord.phone || '',
        governmentId: landlord.governmentId
      },
      status: 'registered',
      actionHistory: [
        {
          action: 'Contract Signed',
          date: contractSignedDate,
          notes: 'Smart contract deployed on blockchain',
          gasFee: '0.004 ETH'
        }
      ]
    });

    console.log('Rental object created, saving...');
    await rental.save();
    console.log('Rental saved successfully with ID:', rental._id);

    // Create notification for student
    console.log('Creating notification...');
    const notification = new Notification({
      recipient: studentDoc._id, // Student document ID
      recipientModel: 'Student',
      type: 'join_request',
      title: 'Rental Agreement Completed',
      message: `Congratulations! Your rental agreement for "${joinRequest.property.title}" is now complete.`,
      relatedId: rental._id,
      relatedModel: 'Rental'
    });

    await notification.save();
    console.log('Notification created');

    // Send email to student
    console.log('Sending email to student...');
    try {
      await emailService.sendEmail({
        to: studentUser.email,
        subject: 'Rental Agreement Finalized',
        text: `Congratulations! Your rental agreement for "${joinRequest.property.title}" has been finalized.\n\nImportant Dates:\n- Moving Date: ${movingDate.toLocaleDateString()}\n- Security Deposit Due: ${securityDepositDueDate.toLocaleDateString()}\n- Monthly Rent Due: ${monthlyRentDueDate} of each month\n\nSecurity Deposit Amount: $${rental.securityDepositAmount}\nMonthly Rent: $${rental.monthlyRentAmount}`
      });
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    // Emit socket event if io is available
    console.log('Emitting socket event...');
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${joinRequest.student}`).emit('rental_completed', {
        rental,
        joinRequest
      });
    }

    console.log('=== LANDLORD SIGN CONTRACT SUCCESS ===');
    console.log('Sending success response...');
    res.json({
      success: true,
      message: 'Contract signed successfully. Rental agreement is now complete.',
      joinRequest,
      rental
    });
  } catch (error) {
    console.error('=== LANDLORD SIGN CONTRACT ERROR ===');
    console.error('Error signing contract (landlord):', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sign contract',
      message: error.message || 'An error occurred while signing the contract'
    });
  }
};

// Generate contract content
function generateContract(data) {
  const {
    movingDate,
    bidAmount,
    property,
    studentName,
    studentGovId,
    landlordName,
    landlordGovId
  } = data;

  const moveInDate = new Date(movingDate);
  const formattedMoveInDate = moveInDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const requestDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate rent due date (move-in date + 7 days)
  const rentDueDay = (moveInDate.getDate() + 7) % 31 || 31;
  
  // Calculate lease end date (12 months from move-in)
  const leaseEndDate = new Date(moveInDate);
  leaseEndDate.setMonth(leaseEndDate.getMonth() + 12);
  const formattedLeaseEndDate = leaseEndDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const monthlyRent = bidAmount;
  const securityDeposit = bidAmount * 2;
  const leaseDuration = '12 months';
  const leaseStartDate = formattedMoveInDate;

  return {
    propertyTitle: property.title,
    propertyAddress: property.address || property.location,
    landlordName,
    landlordGovId,
    studentName,
    studentGovId,
    requestDate,
    monthlyRent: monthlyRent.toFixed(2),
    rentDueDay,
    securityDeposit: securityDeposit.toFixed(2),
    leaseDuration,
    leaseStartDate,
    leaseEndDate: formattedLeaseEndDate,
    moveInDate: formattedMoveInDate,
    content: `
RENTAL AGREEMENT - BLOCKCHAIN SMART CONTRACT

Property: ${property.title}
Address: ${property.address || property.location}

Landlord:
${landlordName} — Government Issued ID: ${landlordGovId}

Tenant:
${studentName} — Government Issued ID: ${studentGovId}

Request Date:
${requestDate}

FINANCIAL TERMS

Monthly Rent: $${monthlyRent.toFixed(2)}
Due Date: ${rentDueDay}${getDaySuffix(rentDueDay)} of each month (determined by move-in date + 7 days)

Security Deposit: $${securityDeposit.toFixed(2)}
Held securely in blockchain escrow

Lease Duration: ${leaseDuration}
${leaseStartDate} – ${formattedLeaseEndDate}

Move-in Date: ${formattedMoveInDate}
Scheduled occupancy

TERMS AND CONDITIONS

1. Rent Payments
The tenant agrees to pay the monthly rent of $${monthlyRent.toFixed(2)} on the ${rentDueDay}${getDaySuffix(rentDueDay)} day of each month via the platform's blockchain payment system.
All rents are paid in advance for every month.

2. Security Deposit Escrow
A security deposit of $${securityDeposit.toFixed(2)} is required and will be held in an on-chain escrow smart contract for the entire lease period.
Funds remain locked and non-withdrawable by either party until the lease ends or a verified termination event occurs.

3. Lease Commencement
The lease term begins on ${formattedMoveInDate}.
The tenant must pay the security deposit within 7 days after both parties have signed this contract.
The tenant must then pay the first month's rent after 3 days of moving in (to protect the tenant from fraudulent property description).

4. Tenant Responsibilities
The tenant shall maintain the property in good condition and promptly report any damages or maintenance issues via the platform.

5. Landlord Responsibilities
The landlord must ensure the property condition and listing details are accurate at move-in.
If fraudulent or misrepresented conditions are found, the tenant may cancel before or within 3 days of move-in and claim a full refund of the security deposit.

6. Lease Termination and Deposit Refund
• Normal Completion:
  After the lease ends, the security deposit remains locked for up to 7 days for verification.
  ◦ If landlord marks "Okay" → Immediate refund.
  ◦ If no response in 7 days → Auto-refund in full.

• Early Termination:
  Either party may terminate early with 60 days' notice.
  Deposit remains in 60-day hold for dispute resolution.

• Student Withdrawal Before Move-in:
  In cases of visa rejection, travel cancellation, or property fraud, tenant may cancel before move-in.
  ◦ If rent not paid → Full refund.
  ◦ If rent paid → Funds held 60 days before resolution and refund.

7. Inspections & Utilities
The landlord may request an inspection with 24-hour prior notice.
Utility and maintenance terms follow the original listing.

8. Dispute Resolution
All conflicts are resolved through the platform's blockchain arbitration mechanism with neutral mediation.

9. Smart Contract Finality
Once both parties digitally sign, the smart contract becomes immutable and fully enforceable.
All actions — deposits, payments, terminations, and refunds — are recorded transparently on-chain.

10. Legal Binding
Both parties acknowledge this is a legally binding blockchain-registered agreement under applicable rental and digital contract laws.

BLOCKCHAIN SMART CONTRACT SUMMARY
• All funds and events recorded immutably on the blockchain.
• Once signed, contract terms cannot be changed.
• Every deposit, payment, and refund is publicly verifiable.
• Secure & Transparent

By proceeding, I confirm that I have read and understood all terms and conditions.
I agree to be bound by this blockchain-registered smart contract.
    `.trim()
  };
}

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Get landlord's tenants (students with completed rentals)
exports.getLandlordTenants = async (req, res) => {
  try {
    const userId = req.user.id;

    const rentals = await Rental.find({ landlord: userId })
      .populate('student', 'name email')
      .populate('property', 'title address')
      .sort({ contractSignedDate: -1 });

    const tenantsData = rentals.map(rental => ({
      id: rental._id,
      name: rental.studentInfo.name,
      email: rental.studentInfo.email,
      photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(rental.studentInfo.name)}`,
      propertyTitle: rental.propertyInfo.title,
      propertyAddress: rental.propertyInfo.address,
      moveInDate: rental.movingDate,
      monthlyRent: rental.monthlyRentAmount.toString(),
      rentDueDay: rental.monthlyRentDueDate,
      leaseDuration: rental.leaseDuration || '12',
      leaseEndDate: rental.leaseEndDate,
      status: rental.status,
      securityDeposit: rental.securityDepositAmount.toString(),
      securityDepositDueDate: rental.securityDepositDueDate,
      contractSignedDate: rental.contractSignedDate,
      actionHistory: rental.actionHistory || []
    }));

    res.json({
      success: true,
      tenants: tenantsData
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
};

module.exports = exports;
