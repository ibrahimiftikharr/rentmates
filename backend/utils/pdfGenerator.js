const PDFDocument = require('pdfkit');

/**
 * Generate a transaction receipt PDF
 * @param {Object} transaction - Transaction object with all details
 * @param {Object} user - User object (name, email, role)
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateTransactionReceipt = (transaction, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      // Collect PDF data
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      // Header with Logo/Brand
      doc
        .fontSize(28)
        .fillColor('#8C57FF')
        .text('RentMates', { align: 'center' })
        .moveDown(0.2);

      doc
        .fontSize(12)
        .fillColor('#666666')
        .text('Transaction Receipt & Financial Statement', { align: 'center' })
        .moveDown(1.5);

      // Horizontal line
      doc
        .strokeColor('#8C57FF')
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(1);

      // Transaction Details Section
      doc
        .fontSize(16)
        .fillColor('#333333')
        .text('Transaction Details', { underline: true })
        .moveDown(0.5);

      const leftColumn = 80;
      const rightColumn = 280;
      let yPosition = doc.y;

      // Transaction ID
      doc
        .fontSize(11)
        .fillColor('#666666')
        .text('Transaction ID:', leftColumn, yPosition);
      doc
        .fillColor('#333333')
        .text(transaction._id.toString(), rightColumn, yPosition);
      yPosition += 25;

      // User Role
      doc
        .fillColor('#666666')
        .text('User Role:', leftColumn, yPosition);
      doc
        .fillColor('#333333')
        .text(formatUserRole(user.role), rightColumn, yPosition);
      yPosition += 25;

      // Transaction Type
      doc
        .fillColor('#666666')
        .text('Transaction Type:', leftColumn, yPosition);
      doc
        .fillColor('#333333')
        .text(formatTransactionType(transaction.type), rightColumn, yPosition);
      yPosition += 25;

      // Amount
      doc
        .fillColor('#666666')
        .text('Amount:', leftColumn, yPosition);
      doc
        .fontSize(14)
        .fillColor(getAmountColor(transaction.type))
        .font('Helvetica-Bold')
        .text(
          `${getAmountPrefix(transaction.type)}$${transaction.amount.toFixed(2)} USDT`,
          rightColumn,
          yPosition
        );
      yPosition += 30;

      doc.font('Helvetica'); // Reset font

      // Date and Time
      const transactionDate = new Date(transaction.createdAt);
      doc
        .fontSize(11)
        .fillColor('#666666')
        .text('Date & Time:', leftColumn, yPosition);
      doc
        .fillColor('#333333')
        .text(
          transactionDate.toLocaleString('en-US', {
            dateStyle: 'long',
            timeStyle: 'long'
          }),
          rightColumn,
          yPosition,
          { width: 260 }
        );
      yPosition += 25;

      // Status
      doc
        .fillColor('#666666')
        .text('Status:', leftColumn, yPosition);
      doc
        .fillColor(getStatusColor(transaction.status))
        .font('Helvetica-Bold')
        .text(transaction.status.toUpperCase(), rightColumn, yPosition);
      yPosition += 25;

      doc.font('Helvetica'); // Reset font

      // Description (if available)
      if (transaction.description) {
        doc
          .fillColor('#666666')
          .text('Description:', leftColumn, yPosition);
        doc
          .fillColor('#333333')
          .text(transaction.description, rightColumn, yPosition, { width: 260 });
        yPosition += 30;
      }

      // Balance After Transaction (if available)
      if (transaction.balanceAfter !== undefined && transaction.balanceAfter !== null) {
        doc
          .fillColor('#666666')
          .text('Balance After:', leftColumn, yPosition);
        doc
          .fillColor('#333333')
          .text(`$${transaction.balanceAfter.toFixed(2)} USDT`, rightColumn, yPosition);
        yPosition += 25;
      }

      doc.moveDown(1);

      // Blockchain Verification Section (if txHash exists)
      if (transaction.txHash) {
        doc
          .strokeColor('#DDDDDD')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke()
          .moveDown(1);

        doc
          .fontSize(16)
          .fillColor('#333333')
          .text('Blockchain Verification', { underline: true })
          .moveDown(0.5);

        yPosition = doc.y;

        doc
          .fontSize(11)
          .fillColor('#666666')
          .text('Transaction Hash:', leftColumn, yPosition);
        doc
          .fontSize(9)
          .fillColor('#333333')
          .text(transaction.txHash, rightColumn, yPosition, { width: 260 });
        yPosition += 25;

        doc
          .fontSize(11)
          .fillColor('#666666')
          .text('Blockchain Network:', leftColumn, yPosition);
        doc
          .fillColor('#333333')
          .text('Polygon Amoy Testnet', rightColumn, yPosition);
        yPosition += 25;

        doc
          .fillColor('#666666')
          .text('Explorer URL:', leftColumn, yPosition);
        
        const explorerUrl = transaction.blockchainExplorerUrl || `https://amoy.polygonscan.com/tx/${transaction.txHash}`;
        doc
          .fontSize(9)
          .fillColor('#0066CC')
          .text(explorerUrl, rightColumn, yPosition, {
            width: 260,
            link: explorerUrl,
            underline: true
          });
        yPosition += 25;

        doc
          .fontSize(10)
          .fillColor('#999999')
          .text(
            'Click the link above or copy it to verify this transaction on the blockchain.',
            leftColumn,
            yPosition + 10,
            { width: 480, align: 'left' }
          );

        doc.moveDown(2);
      }

      // Footer
      doc
        .strokeColor('#DDDDDD')
        .lineWidth(1)
        .moveTo(50, doc.y + 20)
        .lineTo(545, doc.y + 20)
        .stroke();

      doc
        .fontSize(9)
        .fillColor('#999999')
        .text(
          'This is a computer-generated receipt and does not require a signature.',
          50,
          doc.y + 30,
          { align: 'center', width: 495 }
        );

      doc
        .text(
          `Generated on ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'long' })}`,
          50,
          doc.y + 5,
          { align: 'center', width: 495 }
        );

      doc
        .text('© 2026 RentMates Platform. All rights reserved.', 50, doc.y + 5, {
          align: 'center',
          width: 495
        });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Helper function to format user role
 */
const formatUserRole = (role) => {
  const roles = {
    student: 'Student',
    landlord: 'Landlord',
    investor: 'Investor'
  };
  return roles[role] || role;
};

/**
 * Helper function to format transaction type
 */
const formatTransactionType = (type) => {
  const types = {
    deposit: 'Deposit',
    withdraw: 'Withdrawal',
    rent_payment: 'Rent Payment',
    rent_received: 'Rent Received',
    pool_investment: 'Pool Investment',
    investment_income: 'Investment Income',
    loan_disbursement: 'Loan Disbursement',
    loan_repayment: 'Loan Repayment',
    investment_principal_return: 'Investment Principal Return',
    investment_interest_earned: 'Investment Interest Earned',
    collateral_return: 'Collateral Return'
  };
  return types[type] || type;
};

/**
 * Helper function to get amount prefix (+ or -)
 */
const getAmountPrefix = (type) => {
  const creditTypes = ['deposit', 'rent_received', 'investment_income', 'loan_disbursement', 'investment_principal_return', 'investment_interest_earned', 'collateral_return'];
  return creditTypes.includes(type) ? '+' : '-';
};

/**
 * Helper function to get amount color
 */
const getAmountColor = (type) => {
  const creditTypes = ['deposit', 'rent_received', 'investment_income', 'loan_disbursement', 'investment_principal_return', 'investment_interest_earned', 'collateral_return'];
  return creditTypes.includes(type) ? '#28A745' : '#DC3545';
};

/**
 * Helper function to get status color
 */
const getStatusColor = (status) => {
  const colors = {
    completed: '#28A745',
    pending: '#FFC107',
    failed: '#DC3545'
  };
  return colors[status] || '#333333';
};

module.exports = {
  generateTransactionReceipt
};
