const VisitRequest = require('../models/visitRequestModel');
const Student = require('../models/studentModel');
const Landlord = require('../models/landlordModel');
const Property = require('../models/propertyModel');
const Notification = require('../models/notificationModel');

// Create visit request (Student)
const createVisitRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId, visitType, visitDate, visitTime } = req.body;

    // Validate required fields
    if (!propertyId || !visitType || !visitDate || !visitTime) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Get student
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Get property and landlord
    const property = await Property.findById(propertyId).populate('landlord');
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    console.log('Property found:', {
      id: property._id,
      title: property.title,
      address: property.address,
      landlordId: property.landlord._id
    });

    // Create visit request
    const visitRequest = new VisitRequest({
      student: student._id,
      property: property._id,
      landlord: property.landlord._id,
      visitType,
      visitDate: new Date(visitDate),
      visitTime,
      status: 'pending'
    });

    await visitRequest.save();

    // Populate the visit request
    await visitRequest.populate([
      { path: 'student', populate: { path: 'user', select: 'name email' } },
      { path: 'property', select: 'title address images' },
      { path: 'landlord', populate: { path: 'user', select: 'name email' } }
    ]);

    console.log('Visit request populated:', {
      student: visitRequest.student?.user?.name,
      property: visitRequest.property?.title,
      landlord: visitRequest.landlord?.user?.name
    });

    // Create notification for landlord
    const notification = new Notification({
      recipient: property.landlord._id,
      recipientModel: 'Landlord',
      type: 'visit_request',
      title: 'New Visit Request',
      message: `${student.user?.name || 'A student'} has requested to visit ${property.title}`,
      relatedId: visitRequest._id,
      relatedModel: 'VisitRequest',
      metadata: {
        propertyId: property._id,
        propertyTitle: property.title,
        studentName: student.user?.name,
        visitDate,
        visitTime,
        visitType
      }
    });

    await notification.save();

    // Emit Socket.IO event to landlord
    const io = req.app.get('io');
    if (io) {
      const landlordRoom = `landlord_${property.landlord._id}`;
      
      // Emit new_visit_request event for VisitRequestsPage
      io.to(landlordRoom).emit('new_visit_request', {
        visitRequest: {
          _id: visitRequest._id,
          property: visitRequest.property,
          student: visitRequest.student,
          visitType,
          visitDate,
          visitTime,
          status: 'pending'
        },
        message: `New visit request from ${student.user?.name || 'a student'}`
      });

      // Also emit new_notification for general notifications
      io.to(landlordRoom).emit('new_notification', {
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: false,
          createdAt: notification.createdAt
        }
      });
    }

    console.log('✓ Visit request created:', visitRequest._id);

    res.status(201).json({
      success: true,
      message: 'Visit request sent successfully',
      visitRequest
    });
  } catch (error) {
    console.error('Create visit request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create visit request'
    });
  }
};

// Get visit requests for student
const getStudentVisitRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const visitRequests = await VisitRequest.find({ student: student._id })
      .populate('property', 'title address images mainImage')
      .populate({ path: 'landlord', populate: { path: 'user', select: 'name email' } })
      .sort({ createdAt: -1 });

    // Transform data to include location field
    const transformedRequests = visitRequests.map(req => {
      const reqObj = req.toObject();
      if (reqObj.property && reqObj.property.address) {
        reqObj.property.location = reqObj.property.address;
      }
      if (reqObj.landlord && reqObj.landlord.user) {
        reqObj.landlord.fullName = reqObj.landlord.user.name;
      }
      return reqObj;
    });

    res.status(200).json({
      success: true,
      visitRequests: transformedRequests
    });
  } catch (error) {
    console.error('Get student visit requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visit requests'
    });
  }
};

// Get visit requests for landlord
const getLandlordVisitRequests = async (req, res) => {
  try {
    console.log('Getting landlord visit requests for user:', req.user.id);
    const userId = req.user.id;

    // Get landlord profile
    const landlord = await Landlord.findOne({ user: userId });
    console.log('Landlord found:', landlord ? landlord._id : 'NOT FOUND');
    
    if (!landlord) {
      return res.status(404).json({
        success: false,
        message: 'Landlord profile not found'
      });
    }

    const visitRequests = await VisitRequest.find({ landlord: landlord._id })
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('property', 'title address images mainImage')
      .sort({ createdAt: -1 });

    console.log('Found visit requests:', visitRequests.length);

    // Transform data to include location field
    const transformedRequests = visitRequests.map(req => {
      const reqObj = req.toObject();
      if (reqObj.property && reqObj.property.address) {
        reqObj.property.location = reqObj.property.address;
      }
      if (reqObj.student && reqObj.student.user) {
        reqObj.student.fullName = reqObj.student.user.name;
      }
      return reqObj;
    });

    res.status(200).json({
      success: true,
      visitRequests: transformedRequests
    });
  } catch (error) {
    console.error('Get landlord visit requests error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visit requests',
      error: error.message
    });
  }
};

// Confirm visit request (Landlord)
const confirmVisitRequest = async (req, res) => {
  try {
    const { visitRequestId } = req.params;
    const { meetLink } = req.body;

    const visitRequest = await VisitRequest.findById(visitRequestId)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('property', 'title address');

    if (!visitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found'
      });
    }

    visitRequest.status = 'confirmed';
    if (visitRequest.visitType === 'virtual' && meetLink) {
      visitRequest.meetLink = meetLink;
    }
    visitRequest.updatedAt = new Date();

    await visitRequest.save();

    // Create notification for student
    const notification = new Notification({
      recipient: visitRequest.student._id,
      recipientModel: 'Student',
      type: 'visit_confirmed',
      title: 'Visit Request Confirmed',
      message: `Your visit request for ${visitRequest.property.title} has been confirmed`,
      relatedId: visitRequest._id,
      relatedModel: 'VisitRequest',
      metadata: {
        propertyTitle: visitRequest.property.title,
        visitDate: visitRequest.visitDate,
        visitTime: visitRequest.visitTime,
        visitType: visitRequest.visitType,
        meetLink: visitRequest.meetLink
      }
    });

    await notification.save();

    // Emit Socket.IO event to student
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${visitRequest.student._id}`).emit('visit_confirmed', {
        notification,
        visitRequest
      });
    }

    res.status(200).json({
      success: true,
      message: 'Visit request confirmed',
      visitRequest
    });
  } catch (error) {
    console.error('Confirm visit request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm visit request'
    });
  }
};

// Reschedule visit request (Landlord)
const rescheduleVisitRequest = async (req, res) => {
  try {
    const { visitRequestId } = req.params;
    const { newDate, newTime, landlordNotes } = req.body;

    const visitRequest = await VisitRequest.findById(visitRequestId)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('property', 'title address');

    if (!visitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found'
      });
    }

    visitRequest.status = 'rescheduled';
    visitRequest.rescheduledDate = new Date(newDate);
    visitRequest.rescheduledTime = newTime;
    visitRequest.landlordNotes = landlordNotes;
    visitRequest.updatedAt = new Date();

    await visitRequest.save();

    // Create notification for student
    const notification = new Notification({
      recipient: visitRequest.student._id,
      recipientModel: 'Student',
      type: 'visit_rescheduled',
      title: 'Visit Request Rescheduled',
      message: `Your visit request for ${visitRequest.property.title} has been rescheduled`,
      relatedId: visitRequest._id,
      relatedModel: 'VisitRequest',
      metadata: {
        propertyTitle: visitRequest.property.title,
        originalDate: visitRequest.visitDate,
        originalTime: visitRequest.visitTime,
        newDate: visitRequest.rescheduledDate,
        newTime: visitRequest.rescheduledTime,
        landlordNotes
      }
    });

    await notification.save();

    // Emit Socket.IO event to student
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${visitRequest.student._id}`).emit('visit_rescheduled', {
        notification,
        visitRequest
      });
    }

    res.status(200).json({
      success: true,
      message: 'Visit request rescheduled',
      visitRequest
    });
  } catch (error) {
    console.error('Reschedule visit request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule visit request'
    });
  }
};

// Reject visit request (Landlord)
const rejectVisitRequest = async (req, res) => {
  try {
    const { visitRequestId } = req.params;
    const { rejectionReason } = req.body;

    const visitRequest = await VisitRequest.findById(visitRequestId)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('property', 'title address');

    if (!visitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found'
      });
    }

    visitRequest.status = 'rejected';
    visitRequest.rejectionReason = rejectionReason;
    visitRequest.updatedAt = new Date();

    await visitRequest.save();

    // Create notification for student
    const notification = new Notification({
      recipient: visitRequest.student._id,
      recipientModel: 'Student',
      type: 'visit_rejected',
      title: 'Visit Request Rejected',
      message: `Your visit request for ${visitRequest.property.title} has been rejected`,
      relatedId: visitRequest._id,
      relatedModel: 'VisitRequest',
      metadata: {
        propertyTitle: visitRequest.property.title,
        visitDate: visitRequest.visitDate,
        visitTime: visitRequest.visitTime,
        rejectionReason
      }
    });

    await notification.save();

    // Emit Socket.IO event to student
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${visitRequest.student._id}`).emit('visit_rejected', {
        notification,
        visitRequest
      });
    }

    res.status(200).json({
      success: true,
      message: 'Visit request rejected',
      visitRequest
    });
  } catch (error) {
    console.error('Reject visit request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject visit request'
    });
  }
};

module.exports = {
  createVisitRequest,
  getStudentVisitRequests,
  getLandlordVisitRequests,
  confirmVisitRequest,
  rescheduleVisitRequest,
  rejectVisitRequest
};
