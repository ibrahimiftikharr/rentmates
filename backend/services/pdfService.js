const PDFDocument = require('pdfkit');
const { Readable } = require('stream');

/**
 * PDF Generation Service for Rental Contracts
 * Converts contract text to PDF format for IPFS storage and verification
 */

/**
 * Generate PDF from contract content
 * @param {Object} contractData - Contract data object
 * @param {string} contractData.content - Full contract text content
 * @param {Object} contractData.studentSignature - Student signature data
 * @param {Object} contractData.landlordSignature - Landlord signature data
 * @param {string} contractData.propertyTitle - Property title
 * @param {string} contractData.studentName - Student name
 * @param {string} contractData.landlordName - Landlord name
 * @returns {Promise<Buffer>} PDF file as buffer
 */
async function generateContractPDF(contractData) {
  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Generating contract PDF...');
      
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      // Create buffer to collect PDF data
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        console.log('✅ PDF generated successfully. Size:', pdfBuffer.length, 'bytes');
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Add header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('RENTAL AGREEMENT', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(14)
         .font('Helvetica')
         .text('Blockchain Smart Contract', { align: 'center' })
         .moveDown(1.5);

      // Add property and parties information
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Property:', { continued: false })
         .font('Helvetica')
         .text(contractData.propertyTitle || 'N/A')
         .moveDown(0.5);

      if (contractData.propertyAddress) {
        doc.fontSize(11)
           .text(`Address: ${contractData.propertyAddress}`)
           .moveDown(1);
      }

      // Add contract content
      doc.fontSize(10)
         .font('Helvetica');

      // Split content by lines and format
      const lines = contractData.content.split('\n');
      
      for (const line of lines) {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        const trimmedLine = line.trim();
        
        if (!trimmedLine) {
          doc.moveDown(0.3);
          continue;
        }

        // Check if line is a section header (all caps or starts with number)
        if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 50) {
          doc.font('Helvetica-Bold')
             .fontSize(11)
             .text(trimmedLine, { align: 'left' })
             .font('Helvetica')
             .fontSize(10)
             .moveDown(0.5);
        } else if (/^\d+\./.test(trimmedLine)) {
          // Numbered sections
          doc.font('Helvetica-Bold')
             .text(trimmedLine)
             .font('Helvetica')
             .moveDown(0.3);
        } else {
          // Regular text
          doc.text(trimmedLine, { align: 'left', lineGap: 2 })
             .moveDown(0.2);
        }
      }

      // Add signature section
      doc.addPage();
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('DIGITAL SIGNATURES', { align: 'center' })
         .moveDown(1.5);

      // Student signature
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Student (Tenant):')
         .font('Helvetica')
         .fontSize(10)
         .text(`Name: ${contractData.studentName || 'N/A'}`)
         .moveDown(0.3);

      if (contractData.studentSignature && contractData.studentSignature.signed) {
        doc.text(`Signature: ${contractData.studentSignature.signature || 'N/A'}`)
           .text(`Signed At: ${new Date(contractData.studentSignature.signedAt).toLocaleString()}`)
           .moveDown(1);
      } else {
        doc.text('Status: Not signed')
           .moveDown(1);
      }

      // Landlord signature
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Landlord:')
         .font('Helvetica')
         .fontSize(10)
         .text(`Name: ${contractData.landlordName || 'N/A'}`)
         .moveDown(0.3);

      if (contractData.landlordSignature && contractData.landlordSignature.signed) {
        doc.text(`Signature: ${contractData.landlordSignature.signature || 'N/A'}`)
           .text(`Signed At: ${new Date(contractData.landlordSignature.signedAt).toLocaleString()}`)
           .moveDown(1);
      } else {
        doc.text('Status: Not signed')
           .moveDown(1);
      }

      // Add blockchain verification notice
      doc.moveDown(2);
      doc.fontSize(9)
         .font('Helvetica-Oblique')
         .fillColor('#666666')
         .text('This document has been cryptographically signed and recorded on the blockchain.', { align: 'center' })
         .text('The integrity of this contract can be verified using the document hash.', { align: 'center' });

      // Add generation timestamp
      doc.moveDown(1);
      doc.fontSize(8)
         .text(`Document Generated: ${new Date().toISOString()}`, { align: 'center' });

      // Finalize the PDF
      doc.end();

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      reject(error);
    }
  });
}

/**
 * Generate a simple text-based contract PDF (lightweight version)
 * @param {string} contractText - Plain text contract content
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Buffer>} PDF file as buffer
 */
async function generateSimpleContractPDF(contractText, metadata = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Add header
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('RENTAL AGREEMENT', { align: 'center' })
         .moveDown(1);

      // Add content
      doc.fontSize(10)
         .font('Helvetica')
         .text(contractText, { align: 'left', lineGap: 2 });

      // Add metadata if provided
      if (metadata.generatedAt) {
        doc.addPage();
        doc.fontSize(8)
           .text(`Generated: ${new Date(metadata.generatedAt).toISOString()}`, { align: 'center' });
      }

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convert PDF buffer to readable stream
 * @param {Buffer} pdfBuffer - PDF file as buffer
 * @returns {Readable} Readable stream
 */
function bufferToStream(pdfBuffer) {
  const stream = new Readable();
  stream.push(pdfBuffer);
  stream.push(null);
  return stream;
}

module.exports = {
  generateContractPDF,
  generateSimpleContractPDF,
  bufferToStream
};
