const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: 'duvaksyze',
  api_key: '763111291466595',
  api_secret: 'nI_3cZlmdpiJvPtnog_nRjBKO60'
});

// Storage configuration for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rentmates/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Storage configuration for documents
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rentmates/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto'
  }
});

// Storage configuration for property images
const propertyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rentmates/properties',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1920, height: 1080, crop: 'limit' }]
  }
});

// Legacy storage for backward compatibility
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'rentmates',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

// Multer upload instances
const uploadProfile = multer({ storage: profileStorage });
const uploadDocument = multer({ storage: documentStorage });
const uploadProperty = multer({ storage: propertyStorage });

module.exports = { 
  cloudinary, 
  storage, 
  uploadProfile, 
  uploadDocument, 
  uploadProperty 
};
