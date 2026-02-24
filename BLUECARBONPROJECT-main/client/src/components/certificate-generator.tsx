import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import QRCode from 'qrcode';

interface CertificateData {
  certificateId: string;
  issuedDate: Date;
  buyerName: string;
  credits: number;
  retirementDate: Date;
  projectName: string;
  projectLocation: string;
  ecosystemType: string;
  projectArea: number;
  annualCO2: number;
  verificationId: string;
  verificationDate: Date;
  transactionId: string;
  verificationUrl?: string; // URL for QR code verification
}

export function generateCertificatePDF(data: CertificateData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  doc.setFillColor(0, 128, 128);
  doc.rect(0, 0, pageWidth, 8, 'F');

  doc.setFontSize(22);
  doc.setTextColor(0, 100, 100);
  doc.text('BlueCarbon Ledger', pageWidth / 2, yPos + 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Verified Nature-Based Carbon Credit Platform', pageWidth / 2, yPos + 23, { align: 'center' });

  yPos = 55;
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('CARBON OFFSET CERTIFICATE', pageWidth / 2, yPos, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('(Voluntary Carbon Offset)', pageWidth / 2, yPos + 7, { align: 'center' });

  yPos = 75;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Certificate ID: ${data.certificateId}`, margin, yPos);
  doc.text(`Issued On: ${format(data.issuedDate, 'dd MMMM yyyy')}`, pageWidth - margin, yPos, { align: 'right' });

  yPos = 90;
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('1. Certificate Holder', margin + 3, yPos + 5);

  yPos += 15;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.text('Issued To (Buyer):', margin, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.buyerName, margin, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Purpose of Offset:', margin + 90, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Voluntary offset for ESG and sustainability reporting', margin + 90, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Offset Reporting Year:', margin, yPos + 18);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(format(data.retirementDate, 'yyyy'), margin, yPos + 24);

  yPos += 40;
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('2. Offset Details', margin + 3, yPos + 5);

  yPos += 12;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 30, 'F');

  const col1 = margin + 5;
  const col2 = pageWidth / 2 + 10;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Total Credits Retired', col1, yPos + 8);
  doc.text('Credit Type', col2, yPos + 8);
  doc.text('Credit Status', col1, yPos + 20);
  doc.text('Retirement Date', col2, yPos + 20);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.credits.toFixed(2)} tCO2e`, col1, yPos + 14);
  doc.text('Nature-Based (Blue Carbon)', col2, yPos + 14);
  doc.setTextColor(0, 128, 0);
  doc.text('Retired', col1, yPos + 26);
  doc.setTextColor(0, 0, 0);
  doc.text(format(data.retirementDate, 'dd MMMM yyyy'), col2, yPos + 26);

  yPos += 40;
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('3. Project Information', margin + 3, yPos + 5);

  yPos += 12;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Project Name:', margin, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.projectName, margin, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Project Location:', margin, yPos + 14);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.projectLocation, margin, yPos + 20);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Ecosystem Type:', margin + 90, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.ecosystemType} (Blue Carbon Ecosystem)`, margin + 90, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Project Area:', margin + 90, yPos + 14);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.projectArea.toFixed(2)} hectares`, margin + 90, yPos + 20);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Estimated Annual CO2 Sequestration:', margin, yPos + 28);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.annualCO2.toFixed(2)} tCO2e per year`, margin, yPos + 34);

  yPos += 48;
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('4. Verification Details', margin + 3, yPos + 5);

  yPos += 12;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Verification Status:', margin, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 128, 0);
  doc.text('Verified', margin + 35, yPos);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('Verified By:', margin + 90, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Independent Platform-Approved Verifier', margin + 90, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Verification Reference ID:', margin, yPos + 14);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(data.verificationId, margin, yPos + 20);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Verification Date:', margin, yPos + 28);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(format(data.verificationDate, 'dd MMMM yyyy'), margin, yPos + 34);

  yPos += 48;
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('5. Traceability & Ledger Record', margin + 3, yPos + 5);

  yPos += 12;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Ledger Transaction ID:', margin, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.transactionId, margin, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Ledger System:', margin + 90, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('BlueCarbon Ledger (Immutable Digital Record)', margin + 90, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Audit Trail Summary:', margin, yPos + 14);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Project submission > Verification > Credit issuance > Purchase > Retirement', margin, yPos + 20);

  doc.addPage();
  yPos = 20;

  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('6. Declaration', margin + 3, yPos + 5);

  yPos += 15;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const declaration = [
    'This certificate confirms that the carbon credits described above have been voluntarily retired on',
    'behalf of the certificate holder.',
    '',
    'The retired credits represent verified carbon sequestration from a nature-based project and shall not',
    'be resold, transferred, or claimed more than once.',
    '',
    'This certificate is issued solely for voluntary sustainability, ESG disclosure, and environmental impact',
    'reporting purposes.'
  ];
  declaration.forEach((line, i) => {
    doc.text(line, margin, yPos + (i * 5));
  });

  yPos += 50;
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('7. Important Disclaimer', margin + 3, yPos + 5);

  yPos += 15;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const disclaimer = [
    'This certificate does not constitute compliance-market carbon credits and does not represent regulatory',
    'compliance under any national or international emissions trading scheme.',
    '',
    'Claims of carbon neutrality or emissions reduction must be made in accordance with applicable ESG',
    'reporting frameworks and disclosure standards.',
    '',
    'BlueCarbon Ledger operates as a technology platform and is not a government-recognized carbon',
    'registry at the time of issuance.'
  ];
  disclaimer.forEach((line, i) => {
    doc.text(line, margin, yPos + (i * 5));
  });

  yPos += 55;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 25, 'F');

  doc.setFontSize(10);
  doc.setTextColor(0, 100, 100);
  doc.text('Issued by: BlueCarbon Ledger', pageWidth / 2, yPos + 8, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Platform URL: https://bluecarbonledger.com', pageWidth / 2, yPos + 14, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Verification records and detailed audit trails are available upon request.', pageWidth / 2, yPos + 20, { align: 'center' });

  const fileName = `Carbon_Offset_Certificate_${Date.now()}.pdf`;
  doc.save(fileName);
}

export async function generateCertificatePDFWithQR(data: CertificateData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Generate QR code
  const verificationUrl = data.verificationUrl || `https://bluecarbonledger.com/verify/${data.certificateId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 100,
    margin: 1,
    color: {
      dark: '#006666',
      light: '#ffffff'
    }
  });

  doc.setFillColor(0, 128, 128);
  doc.rect(0, 0, pageWidth, 8, 'F');

  doc.setFontSize(22);
  doc.setTextColor(0, 100, 100);
  doc.text('BlueCarbon Ledger', pageWidth / 2, yPos + 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Verified Nature-Based Carbon Credit Platform', pageWidth / 2, yPos + 23, { align: 'center' });

  yPos = 55;
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('CARBON OFFSET CERTIFICATE', pageWidth / 2, yPos, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('(Voluntary Carbon Offset)', pageWidth / 2, yPos + 7, { align: 'center' });

  yPos = 75;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Certificate ID: ${data.certificateId}`, margin, yPos);
  doc.text(`Issued On: ${format(data.issuedDate, 'dd MMMM yyyy')}`, pageWidth - margin, yPos, { align: 'right' });

  yPos = 90;
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('1. Certificate Holder', margin + 3, yPos + 5);

  yPos += 15;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.text('Issued To (Buyer):', margin, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.buyerName, margin, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Purpose of Offset:', margin + 90, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Voluntary offset for ESG and sustainability reporting', margin + 90, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Offset Reporting Year:', margin, yPos + 18);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(format(data.retirementDate, 'yyyy'), margin, yPos + 24);

  yPos += 40;
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('2. Offset Details', margin + 3, yPos + 5);

  yPos += 12;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 30, 'F');

  const col1 = margin + 5;
  const col2 = pageWidth / 2 + 10;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Total Credits Retired', col1, yPos + 8);
  doc.text('Credit Type', col2, yPos + 8);
  doc.text('Credit Status', col1, yPos + 20);
  doc.text('Retirement Date', col2, yPos + 20);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.credits.toFixed(2)} tCO2e`, col1, yPos + 14);
  doc.text('Nature-Based (Blue Carbon)', col2, yPos + 14);
  doc.setTextColor(0, 128, 0);
  doc.text('Retired', col1, yPos + 26);
  doc.setTextColor(0, 0, 0);
  doc.text(format(data.retirementDate, 'dd MMMM yyyy'), col2, yPos + 26);

  yPos += 40;
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('3. Project Information', margin + 3, yPos + 5);

  yPos += 12;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Project Name:', margin, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.projectName, margin, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Project Location:', margin, yPos + 14);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.projectLocation, margin, yPos + 20);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Ecosystem Type:', margin + 90, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.ecosystemType} (Blue Carbon Ecosystem)`, margin + 90, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Project Area:', margin + 90, yPos + 14);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.projectArea.toFixed(2)} hectares`, margin + 90, yPos + 20);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Estimated Annual CO2 Sequestration:', margin, yPos + 28);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.annualCO2.toFixed(2)} tCO2e per year`, margin, yPos + 34);

  yPos += 48;
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('4. Verification Details', margin + 3, yPos + 5);

  yPos += 12;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Verification Status:', margin, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 128, 0);
  doc.text('Verified', margin + 35, yPos);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('Verified By:', margin + 90, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Independent Platform-Approved Verifier', margin + 90, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Verification Reference ID:', margin, yPos + 14);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(data.verificationId, margin, yPos + 20);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Verification Date:', margin, yPos + 28);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(format(data.verificationDate, 'dd MMMM yyyy'), margin, yPos + 34);

  yPos += 48;
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('5. Traceability & Ledger Record', margin + 3, yPos + 5);

  yPos += 12;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Ledger Transaction ID:', margin, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.transactionId, margin, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Ledger System:', margin + 90, yPos);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('BlueCarbon Ledger (Immutable Digital Record)', margin + 90, yPos + 6);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Audit Trail Summary:', margin, yPos + 14);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Project submission > Verification > Credit issuance > Purchase > Retirement', margin, yPos + 20);

  // Add QR Code section
  yPos += 35;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 45, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(0, 100, 100);
  doc.text('6. QR Code Verification', margin + 5, yPos + 10);
  
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Scan to verify certificate authenticity:', margin + 5, yPos + 18);
  
  // Add QR code image
  doc.addImage(qrCodeDataUrl, 'PNG', margin + 5, yPos + 22, 35, 35);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Verification URL: ${verificationUrl}`, margin + 45, yPos + 30);
  doc.text('This QR code links to the public verification page.', margin + 45, yPos + 36);

  doc.addPage();
  yPos = 20;

  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('7. Declaration', margin + 3, yPos + 5);

  yPos += 15;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const declaration = [
    'This certificate confirms that the carbon credits described above have been voluntarily retired on',
    'behalf of the certificate holder.',
    '',
    'The retired credits represent verified carbon sequestration from a nature-based project and shall not',
    'be resold, transferred, or claimed more than once.',
    '',
    'This certificate is issued solely for voluntary sustainability, ESG disclosure, and environmental impact',
    'reporting purposes.'
  ];
  declaration.forEach((line, i) => {
    doc.text(line, margin, yPos + (i * 5));
  });

  yPos += 50;
  doc.setFillColor(0, 128, 128);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 7, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('8. Important Disclaimer', margin + 3, yPos + 5);

  yPos += 15;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const disclaimer = [
    'This certificate does not constitute compliance-market carbon credits and does not represent regulatory',
    'compliance under any national or international emissions trading scheme.',
    '',
    'Claims of carbon neutrality or emissions reduction must be made in accordance with applicable ESG',
    'reporting frameworks and disclosure standards.',
    '',
    'BlueCarbon Ledger operates as a technology platform and is not a government-recognized carbon',
    'registry at the time of issuance.'
  ];
  disclaimer.forEach((line, i) => {
    doc.text(line, margin, yPos + (i * 5));
  });

  yPos += 55;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 25, 'F');

  doc.setFontSize(10);
  doc.setTextColor(0, 100, 100);
  doc.text('Issued by: BlueCarbon Ledger', pageWidth / 2, yPos + 8, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Platform URL: https://bluecarbonledger.com', pageWidth / 2, yPos + 14, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Verification records and detailed audit trails are available upon request.', pageWidth / 2, yPos + 20, { align: 'center' });

  const fileName = `Carbon_Offset_Certificate_${Date.now()}.pdf`;
  doc.save(fileName);
}

export function prepareCertificateData(purchase: any, buyerName: string, baseUrl?: string): CertificateData {
  const purchaseDate = new Date(purchase.timestamp);
  const year = purchaseDate.getFullYear();
  const seq = String(purchase.id).slice(-6).padStart(6, '0');
  const certId = `BCL-${year}-${seq}`;
  const baseVerificationUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://bluecarbonledger.com');
  
  return {
    certificateId: certId,
    issuedDate: new Date(),
    buyerName: buyerName,
    credits: purchase.credits,
    retirementDate: purchaseDate,
    projectName: purchase.projectName || 'Blue Carbon Project',
    projectLocation: purchase.projectLocation || 'Coastal Region',
    ecosystemType: purchase.ecosystemType || 'Blue Carbon',
    projectArea: purchase.projectArea || 10,
    annualCO2: purchase.annualCO2 || (purchase.credits / 20),
    verificationId: `VER-${purchase.projectId || purchase.id}`,
    verificationDate: purchaseDate,
    transactionId: `LEDGER-TX-${purchase.id}`,
    verificationUrl: `${baseVerificationUrl}/verify/${certId}`,
  };
}
