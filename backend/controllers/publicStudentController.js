const Student = require('../models/studentModel');
const User = require('../models/userModel');

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
      reputationScore: student.reputationScore,
      trustLevel: student.getTrustLevel(),
      housingPreferences: {
        propertyType: student.housingPreferences?.propertyType || [],
        budgetMin: student.housingPreferences?.budgetMin,
        budgetMax: student.housingPreferences?.budgetMax,
        moveInDate: student.housingPreferences?.moveInDate,
        stayDuration: student.housingPreferences?.stayDuration,
        preferredAreas: student.housingPreferences?.preferredAreas || [],
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
      reputationScore: student.reputationScore,
      trustLevel: student.getTrustLevel(),
      completedTasks: student.getCompletedTasks(),
      documentsCount: student.getDocumentsCount(),
      housingPreferences: {
        propertyType: student.housingPreferences?.propertyType || [],
        budgetMin: student.housingPreferences?.budgetMin,
        budgetMax: student.housingPreferences?.budgetMax,
        moveInDate: student.housingPreferences?.moveInDate,
        stayDuration: student.housingPreferences?.stayDuration,
        preferredAreas: student.housingPreferences?.preferredAreas || [],
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
