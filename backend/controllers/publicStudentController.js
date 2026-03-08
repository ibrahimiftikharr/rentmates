const Student = require('../models/studentModel');
const User = require('../models/userModel');
const { calculateCompatibilityScores } = require('../services/compatibilityService');

/**
 * Get all students who have completed their profiles
 * Only returns students with completed basic info and housing preferences
 */
exports.getPublicStudents = async (req, res) => {
  try {
    const { search, university, nationality } = req.query;

    // Build query - only show students with completed profiles
    const query = {
      'profileSteps.basicInfo': true,
      'profileSteps.housingPreferences': true
    };

    // Find all students matching criteria
    const students = await Student.find(query)
      .populate('user', 'name email');

    // Filter and transform data
    let results = students.map(student => ({
      id: student._id,
      userId: student.user._id,
      name: student.user.name,
      email: student.user.email,
      photo: student.documents?.profileImage || null,
      university: student.university,
      course: student.course,
      yearOfStudy: student.yearOfStudy,
      nationality: student.nationality,
      bio: student.bio,
      interests: student.interests || [],
      reputationScore: student.reputationScore,
      trustLevel: student.getTrustLevel(),
      housingPreferences: {
        propertyType: student.housingPreferences?.propertyType || [],
        budgetMin: student.housingPreferences?.budgetMin,
        budgetMax: student.housingPreferences?.budgetMax,
        moveInDate: student.housingPreferences?.moveInDate,
        petsAllowed: student.housingPreferences?.petsAllowed,
        smokingAllowed: student.housingPreferences?.smokingAllowed,
        furnished: student.housingPreferences?.furnished,
        billsIncluded: student.housingPreferences?.billsIncluded
      }
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(student => 
        student.name.toLowerCase().includes(searchLower) ||
        student.course.toLowerCase().includes(searchLower) ||
        student.university.toLowerCase().includes(searchLower) ||
        student.bio?.toLowerCase().includes(searchLower)
      );
    }

    // Apply university filter
    if (university && university !== 'all') {
      results = results.filter(student => student.university === university);
    }

    // Apply nationality filter
    if (nationality && nationality !== 'all') {
      results = results.filter(student => student.nationality === nationality);
    }

    res.status(200).json({
      success: true,
      count: results.length,
      students: results
    });
  } catch (error) {
    console.error('Error fetching public students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

/**
 * Get a single student's public profile by ID
 */
exports.getPublicStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate('user', 'name email');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Only return profile if it's completed
    if (!student.profileSteps?.basicInfo || !student.profileSteps?.housingPreferences) {
      return res.status(403).json({
        success: false,
        message: 'This profile is not publicly available yet'
      });
    }

    const profile = {
      id: student._id,
      userId: student.user._id,
      name: student.user.name,
      email: student.user.email,
      photo: student.documents?.profileImage || null,
      university: student.university,
      course: student.course,
      yearOfStudy: student.yearOfStudy,
      nationality: student.nationality,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth,
      bio: student.bio,
      interests: student.interests || [],
      reputationScore: student.reputationScore,
      trustLevel: student.getTrustLevel(),
      completedTasks: student.getCompletedTasks(),
      documentsCount: student.getDocumentsCount(),
      housingPreferences: {
        propertyType: student.housingPreferences?.propertyType || [],
        budgetMin: student.housingPreferences?.budgetMin,
        budgetMax: student.housingPreferences?.budgetMax,
        moveInDate: student.housingPreferences?.moveInDate,
        petsAllowed: student.housingPreferences?.petsAllowed,
        smokingAllowed: student.housingPreferences?.smokingAllowed,
        furnished: student.housingPreferences?.furnished,
        billsIncluded: student.housingPreferences?.billsIncluded
      },
      documents: {
        hasProfileImage: !!student.documents?.profileImage,
        hasNationalId: !!student.documents?.nationalId,
        hasPassport: !!student.documents?.passport,
        hasStudentId: !!student.documents?.studentId,
        hasProofOfEnrollment: !!student.documents?.proofOfEnrollment
      },
      profileSteps: student.profileSteps,
      walletLinked: student.walletLinked
    };

    res.status(200).json({
      success: true,
      student: profile
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student profile',
      error: error.message
    });
  }
};

/**
 * Get students with compatibility scores for the logged-in student
 * Used by Student Dashboard to find compatible flatmates
 */
exports.getStudentsWithCompatibility = async (req, res) => {
  try {
    const currentUserId = req.user.id; // From auth middleware
    const { search, university, nationality } = req.query;

    // Get current student's profile
    const currentStudent = await Student.findOne({ user: currentUserId })
      .populate('user', 'name email');

    if (!currentStudent) {
      return res.status(404).json({
        success: false,
        message: 'Your profile not found'
      });
    }

    // Check if current student has completed their profile
    if (!currentStudent.profileSteps?.basicInfo || !currentStudent.profileSteps?.housingPreferences) {
      return res.status(403).json({
        success: false,
        message: 'Please complete your profile first to see compatible students'
      });
    }

    // Build query - only show students with completed profiles, excluding current user
    const query = {
      'profileSteps.basicInfo': true,
      'profileSteps.housingPreferences': true,
      user: { $ne: currentUserId }
    };

    // Find all students matching criteria
    const students = await Student.find(query)
      .populate('user', 'name email');

    // Calculate compatibility scores (now async with ML service)
    const studentsWithScores = await calculateCompatibilityScores(currentStudent, students);

    // Transform data
    let results = studentsWithScores.map(student => {
      // Calculate trust level based on reputation score
      let trustLevel = 'New';
      const score = student.reputationScore || 0;
      if (score >= 80) trustLevel = 'Excellent';
      else if (score >= 60) trustLevel = 'Good';
      else if (score >= 40) trustLevel = 'Fair';
      
      return {
        id: student._id,
        userId: student.user._id,
        name: student.user.name,
        email: student.user.email,
        photo: student.documents?.profileImage || null,
        university: student.university,
        course: student.course,
        yearOfStudy: student.yearOfStudy,
        nationality: student.nationality,
        phone: student.phone,
        bio: student.bio,
        interests: student.interests || [],
        reputationScore: student.reputationScore,
        trustLevel: trustLevel,
        compatibilityScore: student.compatibilityScore,
        housingPreferences: {
          propertyType: student.housingPreferences?.propertyType || [],
          budgetMin: student.housingPreferences?.budgetMin,
          budgetMax: student.housingPreferences?.budgetMax,
          moveInDate: student.housingPreferences?.moveInDate,
          petsAllowed: student.housingPreferences?.petsAllowed,
          smokingAllowed: student.housingPreferences?.smokingAllowed,
          furnished: student.housingPreferences?.furnished,
          billsIncluded: student.housingPreferences?.billsIncluded
        }
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(student => 
        student.name.toLowerCase().includes(searchLower) ||
        student.course.toLowerCase().includes(searchLower) ||
        student.university.toLowerCase().includes(searchLower) ||
        student.nationality.toLowerCase().includes(searchLower) ||
        student.bio?.toLowerCase().includes(searchLower)
      );
    }

    // Apply university filter
    if (university && university !== 'all') {
      results = results.filter(student => student.university === university);
    }

    // Apply nationality filter
    if (nationality && nationality !== 'all') {
      results = results.filter(student => student.nationality === nationality);
    }

    res.status(200).json({
      success: true,
      count: results.length,
      students: results
    });
  } catch (error) {
    console.error('Error fetching students with compatibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

/**
 * Get students WITHOUT compatibility scores (fast load)
 * Used for progressive loading - students load first, scores calculated separately
 */
exports.getStudentsFast = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { search, university, nationality } = req.query;

    // Get current student's profile
    const currentStudent = await Student.findOne({ user: currentUserId })
      .populate('user', 'name email');

    if (!currentStudent) {
      return res.status(404).json({
        success: false,
        message: 'Your profile not found'
      });
    }

    // Check if current student has completed their profile
    if (!currentStudent.profileSteps?.basicInfo || !currentStudent.profileSteps?.housingPreferences) {
      return res.status(403).json({
        success: false,
        message: 'Please complete your profile first to see compatible students'
      });
    }

    // Build query - only show students with completed profiles, excluding current user
    const query = {
      'profileSteps.basicInfo': true,
      'profileSteps.housingPreferences': true,
      user: { $ne: currentUserId }
    };

    // Find all students matching criteria
    const students = await Student.find(query)
      .populate('user', 'name email');

    // Transform data WITHOUT compatibility scores
    let results = students.map(student => {
      let trustLevel = 'New';
      const score = student.reputationScore || 0;
      if (score >= 80) trustLevel = 'Excellent';
      else if (score >= 60) trustLevel = 'Good';
      else if (score >= 40) trustLevel = 'Fair';
      
      return {
        id: student._id,
        userId: student.user._id,
        name: student.user.name,
        email: student.user.email,
        photo: student.documents?.profileImage || null,
        university: student.university,
        course: student.course,
        yearOfStudy: student.yearOfStudy,
        nationality: student.nationality,
        phone: student.phone,
        bio: student.bio,
        interests: student.interests || [],
        reputationScore: student.reputationScore,
        trustLevel: trustLevel,
        compatibilityScore: null, // Will be fetched separately
        housingPreferences: {
          propertyType: student.housingPreferences?.propertyType || [],
          budgetMin: student.housingPreferences?.budgetMin,
          budgetMax: student.housingPreferences?.budgetMax,
          moveInDate: student.housingPreferences?.moveInDate,
          petsAllowed: student.housingPreferences?.petsAllowed,
          smokingAllowed: student.housingPreferences?.smokingAllowed,
          furnished: student.housingPreferences?.furnished,
          billsIncluded: student.housingPreferences?.billsIncluded
        }
      };
    });

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(student => 
        student.name.toLowerCase().includes(searchLower) ||
        student.course.toLowerCase().includes(searchLower) ||
        student.university.toLowerCase().includes(searchLower) ||
        student.nationality.toLowerCase().includes(searchLower) ||
        student.bio?.toLowerCase().includes(searchLower)
      );
    }

    if (university && university !== 'all') {
      results = results.filter(student => student.university === university);
    }

    if (nationality && nationality !== 'all') {
      results = results.filter(student => student.nationality === nationality);
    }

    res.status(200).json({
      success: true,
      count: results.length,
      students: results
    });
  } catch (error) {
    console.error('Error fetching students (fast):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

/**
 * Calculate compatibility scores for multiple students
 * POST body: { studentIds: ['id1', 'id2', 'id3'] }
 */
exports.calculateCompatibilityScores = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'studentIds array is required'
      });
    }

    // Get current student's profile
    const currentStudent = await Student.findOne({ user: currentUserId });

    if (!currentStudent) {
      return res.status(404).json({
        success: false,
        message: 'Your profile not found'
      });
    }

    // Get target students
    const students = await Student.find({ _id: { $in: studentIds } });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found'
      });
    }

    // Calculate compatibility scores
    const studentsWithScores = await calculateCompatibilityScores(currentStudent, students);

    // Create score map
    const scores = {};
    studentsWithScores.forEach(student => {
      scores[student._id.toString()] = {
        studentId: student._id,
        compatibilityScore: student.compatibilityScore,
        calculatedAt: new Date().toISOString()
      };
    });

    res.status(200).json({
      success: true,
      scores: scores
    });
  } catch (error) {
    console.error('Error calculating compatibility scores:', error);
    
    // Return partial success with error info
    res.status(200).json({
      success: false,
      message: 'ML service temporarily unavailable, using fallback calculation',
      scores: {},
      error: error.message
    });
  }
};
