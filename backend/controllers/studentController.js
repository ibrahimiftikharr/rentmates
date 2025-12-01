const Student = require('../models/studentModel');
const User = require('../models/userModel');
const Property = require('../models/propertyModel');
const { emitDashboardUpdate } = require('../utils/socketHelpers');

// ========================================
// GET STUDENT PROFILE
// ========================================
const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findOne({ user: userId }).populate('user', 'name email');
    
    if (!student) {
      // Create a new student profile if it doesn't exist
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const newStudent = new Student({
        user: userId,
        isEmailVerified: true,
        reputationScore: 25 // Email verified bonus
      });
      await newStudent.save();
      
      const populatedStudent = await Student.findById(newStudent._id).populate('user', 'name email');
      
      return res.status(200).json({
        success: true,
        profile: {
          id: populatedStudent._id,
          name: user.name,
          email: user.email,
          university: populatedStudent.university,
          course: populatedStudent.course,
          yearOfStudy: populatedStudent.yearOfStudy,
          nationality: populatedStudent.nationality,
          governmentId: populatedStudent.governmentId,
          dateOfBirth: populatedStudent.dateOfBirth,
          phone: populatedStudent.phone,
          interests: populatedStudent.interests || [],
          housingPreferences: populatedStudent.housingPreferences,
          documents: populatedStudent.documents,
          bio: populatedStudent.bio,
          reputationScore: populatedStudent.reputationScore,
          trustLevel: populatedStudent.getTrustLevel(),
          documentsCount: populatedStudent.getDocumentsCount(),
          completedTasks: populatedStudent.getCompletedTasks(),
          profileSteps: populatedStudent.profileSteps,
          isProfileComplete: populatedStudent.isProfileComplete,
          walletLinked: populatedStudent.walletLinked || false
        }
      });
    }

    // Verify and update profile steps based on current data
    student.verifyProfileSteps();
    await student.save();

    res.status(200).json({
      success: true,
      profile: {
        id: student._id,
        name: student.user.name,
        email: student.user.email,
        university: student.university,
        course: student.course,
        yearOfStudy: student.yearOfStudy,
        nationality: student.nationality,
        governmentId: student.governmentId,
        dateOfBirth: student.dateOfBirth,
        phone: student.phone,
        interests: student.interests || [],
        housingPreferences: student.housingPreferences,
        documents: student.documents,
        bio: student.bio,
        reputationScore: student.reputationScore,
        trustLevel: student.getTrustLevel(),
        documentsCount: student.getDocumentsCount(),
        completedTasks: student.getCompletedTasks(),
        profileSteps: student.profileSteps,
        isProfileComplete: student.isProfileComplete,
        walletLinked: student.walletLinked || false
      }
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// ========================================
// UPDATE STUDENT PROFILE
// ========================================
const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    let student = await Student.findOne({ user: userId });
    
    if (!student) {
      // Create profile if doesn't exist
      student = new Student({ user: userId, isEmailVerified: true });
    }

    // Update basic info
    if (updates.university !== undefined) student.university = updates.university;
    if (updates.course !== undefined) student.course = updates.course;
    if (updates.yearOfStudy !== undefined) student.yearOfStudy = updates.yearOfStudy;
    if (updates.nationality !== undefined) student.nationality = updates.nationality;
    if (updates.governmentId !== undefined) student.governmentId = updates.governmentId;
    if (updates.dateOfBirth !== undefined) student.dateOfBirth = updates.dateOfBirth;
    if (updates.phone !== undefined) student.phone = updates.phone;
    if (updates.bio !== undefined) student.bio = updates.bio;
    if (updates.interests !== undefined) student.interests = updates.interests;

    // Update housing preferences
    if (updates.housingPreferences !== undefined) {
      student.housingPreferences = {
        ...student.housingPreferences,
        ...updates.housingPreferences
      };
    }

    // Update wallet status
    if (updates.walletLinked !== undefined) {
      student.walletLinked = updates.walletLinked;
    }

    // Update profile steps
    if (updates.profileSteps !== undefined) {
      student.profileSteps = {
        ...student.profileSteps,
        ...updates.profileSteps
      };
    }

    // Check and update profile step completion based on actual data
    // Basic Info: university, course, yearOfStudy, nationality, phone, dateOfBirth
    const basicInfoComplete = !!(
      student.university && student.university.trim() !== '' &&
      student.course && student.course.trim() !== '' &&
      student.yearOfStudy && student.yearOfStudy.trim() !== '' &&
      student.nationality && student.nationality.trim() !== '' &&
      student.phone && student.phone.trim() !== '' &&
      student.dateOfBirth
    );
    student.profileSteps.basicInfo = basicInfoComplete;

    // Housing Preferences: budgetMin, budgetMax, moveInDate
    const prefs = student.housingPreferences;
    const prefsComplete = !!(
      prefs && 
      prefs.budgetMin !== undefined && prefs.budgetMin > 0 &&
      prefs.budgetMax !== undefined && prefs.budgetMax > 0 &&
      prefs.moveInDate
    );
    student.profileSteps.housingPreferences = prefsComplete;

    // Bio Completed
    if (updates.bio !== undefined) {
      student.profileSteps.bioCompleted = student.bio && student.bio.trim().length > 0;
    }

    // Documents Uploaded: check if national ID or passport exists
    const docsComplete = !!(student.documents.nationalId || student.documents.passport);
    student.profileSteps.documentsUploaded = docsComplete;

    console.log('Profile steps after update:', student.profileSteps);

    await student.save();

    const populatedStudent = await Student.findById(student._id).populate('user', 'name email');

    console.log('✓ Student profile updated');
    console.log('Reputation score:', populatedStudent.reputationScore);
    console.log('Trust level:', populatedStudent.getTrustLevel());

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: populatedStudent._id,
        name: populatedStudent.user.name,
        email: populatedStudent.user.email,
        university: populatedStudent.university,
        course: populatedStudent.course,
        yearOfStudy: populatedStudent.yearOfStudy,
        nationality: populatedStudent.nationality,
        governmentId: populatedStudent.governmentId,
        dateOfBirth: populatedStudent.dateOfBirth,
        phone: populatedStudent.phone,
        interests: populatedStudent.interests || [],
        housingPreferences: populatedStudent.housingPreferences,
        documents: populatedStudent.documents,
        bio: populatedStudent.bio,
        reputationScore: populatedStudent.reputationScore,
        trustLevel: populatedStudent.getTrustLevel(),
        documentsCount: populatedStudent.getDocumentsCount(),
        completedTasks: populatedStudent.getCompletedTasks(),
        profileSteps: populatedStudent.profileSteps,
        isProfileComplete: populatedStudent.isProfileComplete
      }
    });
  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// ========================================
// UPLOAD DOCUMENT
// ========================================
const uploadDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let student = await Student.findOne({ user: userId });
    if (!student) {
      student = new Student({ user: userId, isEmailVerified: true });
    }

    // Update document URL
    student.documents[documentType] = req.file.path;

    // Check if documents step is complete (at least one ID document uploaded)
    if (documentType === 'nationalId' || documentType === 'passport') {
      student.profileSteps.documentsUploaded = true;
    }

    await student.save();

    console.log('✓ Document uploaded:', documentType);
    console.log('New reputation score:', student.reputationScore);

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      documentUrl: req.file.path,
      reputationScore: student.reputationScore,
      documentsCount: student.getDocumentsCount()
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

// ========================================
// DELETE DOCUMENT
// ========================================
const deleteDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType } = req.params;

    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Remove document
    student.documents[documentType] = undefined;

    // Update documents step if no ID documents remain
    if ((documentType === 'nationalId' || documentType === 'passport') && 
        !student.documents.nationalId && !student.documents.passport) {
      student.profileSteps.documentsUploaded = false;
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      reputationScore: student.reputationScore,
      documentsCount: student.getDocumentsCount()
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

// Get student's wishlist
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findOne({ user: userId })
      .populate({
        path: 'wishlist',
        populate: {
          path: 'landlord',
          select: 'name email'
        }
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Transform wishlist to ensure id field exists
    const wishlist = (student.wishlist || []).map(property => {
      const propObj = property.toObject ? property.toObject() : property;
      return {
        ...propObj,
        id: propObj._id || propObj.id
      };
    });

    console.log('Wishlist fetched:', wishlist.length, 'items');

    res.status(200).json({
      success: true,
      wishlist
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
  }
};

// Add property to wishlist
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }

    const student = await Student.findOne({ user: userId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Check if property already in wishlist
    if (student.wishlist.includes(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Property already in wishlist'
      });
    }

    student.wishlist.push(propertyId);
    await student.save();

    // Emit dashboard update via Socket.IO
    const io = req.app.get('io');
    emitDashboardUpdate(io, userId, 'metrics_updated');

    res.status(200).json({
      success: true,
      message: 'Property added to wishlist',
      wishlist: student.wishlist
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
  }
};

// Remove property from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;

    console.log('Removing property from wishlist:', propertyId, 'for user:', userId);

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }

    const student = await Student.findOne({ user: userId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    console.log('Current wishlist length:', student.wishlist.length);

    student.wishlist = student.wishlist.filter(
      id => id.toString() !== propertyId
    );
    
    console.log('New wishlist length:', student.wishlist.length);
    
    await student.save();

    console.log('Wishlist updated successfully');

    // Emit dashboard update via Socket.IO
    const io = req.app.get('io');
    emitDashboardUpdate(io, userId, 'metrics_updated');

    res.status(200).json({
      success: true,
      message: 'Property removed from wishlist',
      wishlist: student.wishlist
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  uploadDocument,
  deleteDocument,
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
