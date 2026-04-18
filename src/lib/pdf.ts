import { jsPDF } from 'jspdf';
import { ProcedureType, PROCEDURE_LABELS, UserProfile, Authority } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const generateProcedurePDF = (
  type: ProcedureType,
  data: Record<string, any>,
  profile: UserProfile | null,
  isDigital: boolean = false,
  authority?: Authority,
  fieldLabels?: Record<string, string>
) => {
  const doc = new jsPDF();
  const title = PROCEDURE_LABELS[type];
  const dateStr = format(new Date(), "d 'de' MMMM, yyyy", { locale: es });

  if (type === 'readmision') {
    // Specialized layout for Readmisión
    doc.setFont('helvetica', 'normal');
    
    // Header
    doc.setFontSize(8);
    const headerLines = [
      'G O B I E R N O   D E   L A   C I U D A D   D E   B U E N O S   A I R E S',
      'Ministerio de Educación',
      'Dirección de Formación Técnico Superior',
      'Instituto de Formación Técnico Superior N° 18',
      'Mansilla 3643 - C1425BBW - Capital Federal'
    ];
    headerLines.forEach((line, i) => {
      doc.text(line, 105, 15 + (i * 4), { align: 'center' });
    });

    // Date line
    doc.setFontSize(10);
    doc.text(`Ciudad Autónoma de Buenos Aires, ...... de ......................... de 20.......`, 20, 45);

    // Recipient
    doc.setFont('helvetica', 'bold');
    doc.text('Sr. Rector IFTS 18', 20, 60);
    doc.text('Ing Daniel Pelletieri', 20, 65);
    doc.text('S / D', 20, 70);

    // Body text
    doc.setFont('helvetica', 'normal');
    const bodyText = `Visto lo establecido por el Consejo Académico del Instituto, me dirijo a Ud. a fin de solicitar ser readmitido/a en condición de alumno/a regular del IFTS 18 y en consecuencia en la Carrera de ${data.carrera_solicitada || '................................................................................'}`;
    const splitBody = doc.splitTextToSize(bodyText, 170);
    doc.text(splitBody, 20, 80);

    // Personal Data
    doc.setFont('helvetica', 'bold');
    doc.text('Mis datos personales son:', 20, 100);
    doc.setFont('helvetica', 'normal');
    
    let y = 110;
    const personalFields = [
      { label: 'Apellidos:', value: data.apellido || profile?.fullName.split(' ').slice(-1)[0] || '...................................' },
      { label: 'Nombres:', value: data.nombre || profile?.fullName.split(' ').slice(0, -1).join(' ') || '...................................' },
      { label: 'Doc.: D.N.I. – L.E. – L.C. – Otro: Nº', value: data.dni || profile?.dni || '...................................' },
      { label: 'Fecha de Nacimiento:', value: data.fecha_nacimiento || '...................................' },
      { label: 'Domicilio:', value: data.domicilio || '...................................' },
      { label: 'Localidad:', value: data.localidad || '...................................' },
      { label: 'Teléfono:', value: data.telefono || '...................................' },
      { label: 'e-mail:', value: data.email || profile?.email || '...................................' },
      { label: 'Carrera:', value: data.carrera || profile?.career || '...................................' },
      { label: 'Año de ingreso:', value: data.anio_ingreso || '................' },
      { label: 'Rematriculaciones Anteriores:', value: data.rematriculaciones || '................' }
    ];

    personalFields.forEach(f => {
      doc.text(`${f.label} ${f.value}`, 20, y);
      y += 7;
    });

    // Reasons
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Solicito ser readmitido en razón de: (marcar según corresponda)', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 8;

    const reasons = [
      'Enfermedad o discapacidad',
      'Prosecución de otros estudios universitarios o terciarios',
      'Comisiones o viajes de estudios',
      'Ausencia por traslado al interior o exterior del país',
      'Embarazo',
      'Otras causales de equivalente importancia que las anteriores'
    ];

    const selectedReason = data.motivo_readmision;
    reasons.forEach(r => {
      const isSelected = selectedReason === r;
      doc.rect(20, y - 4, 4, 4);
      if (isSelected) {
        doc.text('X', 21, y - 1);
      }
      doc.text(r, 26, y);
      y += 7;
    });

    // Signature
    y += 20;
    if (isDigital && authority) {
      if (authority.signatureUrl) {
        doc.addImage(authority.signatureUrl, 'PNG', 130, y - 15, 40, 15);
      }
      doc.text(authority.name, 130, y + 5);
      doc.setFontSize(8);
      doc.text(authority.position, 130, y + 9);
      doc.setFontSize(10);
    }
    doc.line(130, y, 185, y);
    doc.text('FIRMA DEL ALUMNO', 130, y + 5, { align: 'center' });

    doc.save(`Solicitud_Readmision_${profile?.dni || 'exp'}.pdf`);
    return;
  }

  // Tight layout to ensure 1 single page
  // Institutional Header (Centered Text Only)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  
  // Right Side: Institutional Text (Centered on page)
  const centerX = 105;
  doc.setTextColor(68, 68, 68);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('GOBIERNO DE LA CIUDAD DE BUENOS AIRES', centerX, 15, { align: 'center' });
  
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Ministerio de Educación', centerX, 21, { align: 'center' });
  
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Dirección de Formación Técnico Superior', centerX, 25, { align: 'center' });
  
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Instituto de Formación Técnico Superior N° 18', centerX, 31, { align: 'center' });
  
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'oblique');
  doc.text('Mansilla 3643 - C1425BBW - Capital Federal', centerX, 35, { align: 'center' });

  doc.setLineWidth(0.4);
  doc.line(20, 38, 190, 38);

  // Document Title
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text(title.toUpperCase(), 105, 48, { align: 'center' });

  // Student Info Section
  doc.setFontSize(11);
  doc.setFont('times', 'bold');
  doc.text('DATOS DEL SOLICITANTE', 20, 60);
  doc.setLineWidth(0.2);
  doc.line(20, 62, 190, 62);
  
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  
  // Dense applicant data
  doc.text(`Nombre:`, 20, 70);
  doc.setFont('times', 'bold');
  doc.text(`${profile?.fullName || 'N/A'}`, 45, 70);
  
  doc.setFont('times', 'normal');
  doc.text(`DNI:`, 130, 70);
  doc.setFont('times', 'bold');
  doc.text(`${profile?.dni || 'N/A'}`, 145, 70);
  
  doc.setFont('times', 'normal');
  doc.text(`Carrera:`, 20, 76);
  doc.setFont('times', 'bold');
  doc.text(`${profile?.career || 'N/A'}`, 45, 76);
  
  doc.setFont('times', 'normal');
  doc.text(`Email:`, 130, 76);
  doc.setFont('times', 'bold');
  doc.text(`${profile?.email || 'N/A'}`, 145, 76);

  // Form Data Section
  doc.setFontSize(11);
  doc.setFont('times', 'bold');
  doc.text('DETALLES DEL TRÁMITE', 20, 88);
  doc.line(20, 90, 190, 90);

  let y = 98;
  doc.setFontSize(10);
  
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'caseNumber' || key === 'submissionMethod') return;
    
    let label = fieldLabels?.[key] || key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toUpperCase();
    if (type === 'alumno_regular' && (label.toLowerCase().includes('día') || label.toLowerCase().includes('dia'))) {
      label = 'CURSA';
    }
    
    let displayValue = String(value);

    // Format ISO dates (YYYY-MM-DD) to DD/MM/YYYY for better readability in PDF
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      displayValue = `${day}/${month}/${year}`;
    }

    // Skip generic label for subject pairs as it has its own section
    if (key !== 'subjectPairs') {
      doc.setFont('times', 'bold');
      doc.text(`${label}:`, 20, y);
      doc.setFont('times', 'normal');
    }
    
    // Check if it's a schedule object
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      y += 5;
      doc.setLineWidth(0.1);
      doc.line(20, y-3, 160, y-3);
      
      doc.setFont('times', 'bold');
      doc.text('Día', 25, y+1);
      doc.text('Franja Horaria', 85, y+1);
      y += 4;
      doc.line(20, y, 160, y);
      y += 5;

      doc.setFont('times', 'normal');
      Object.entries(value).forEach(([day, time]) => {
        doc.text(String(day), 25, y);
        doc.text(String(time), 85, y);
        y += 5;
      });
      doc.line(20, y-3, 160, y-3);
      y += 5;
    } else {
      if (Array.isArray(value)) displayValue = value.join(', ');
      
      // Handle equivalency subject pairs
      if (key === 'subjectPairs' && Array.isArray(value)) {
        y += 5;
        doc.setFont('times', 'bold');
        doc.text('EQUIVALENCIAS SOLICITADAS:', 20, y);
        y += 6;
        doc.setLineWidth(0.1);
        doc.line(20, y-1, 160, y-1);
        
        doc.setFontSize(8);
        doc.text('ASIGNATURA ORIGEN', 25, y+3);
        doc.text('ASIGNATURA IFTS 18', 95, y+3);
        y += 6;
        doc.line(20, y-1, 160, y-1);
        
        doc.setFont('times', 'normal');
        value.forEach((pair: any) => {
          doc.text(String(pair.origin), 25, y+3);
          doc.text(String(pair.local), 95, y+3);
          y += 6;
        });
        doc.line(20, y-1, 160, y-1);
        y += 4;
        return;
      }

      const splitValue = doc.splitTextToSize(displayValue, 100);
      doc.text(splitValue, 85, y);
      y += (splitValue.length * 5) + 3;
    }
  });

  // Signature area - FIXED position at bottom to avoid overlap
  const signatureY = 250;
  
  if (isDigital && authority) {
    // Render handwritten signature if available
    if (authority.signatureUrl) {
      try {
        // Position it nicely above the name, more compact
        doc.addImage(authority.signatureUrl, 'PNG', 22, signatureY + 2, 40, 15);
      } catch (err) {
        console.error('Error rendering signature image in PDF:', err);
      }
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(20, signatureY, 70, 30);
    doc.setFontSize(7);
    doc.setFont('times', 'bold');
    doc.text('CERTIFICACIÓN DIGITAL IFTS 18', 22, signatureY + 4);
    
    doc.setFontSize(9);
    doc.setFont('times', 'bold');
    doc.text(authority.name, 22, signatureY + 20);
    
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    doc.text(authority.position, 22, signatureY + 24);
    doc.text(`Emisión: ${dateStr}`, 22, signatureY + 28);
    
    doc.setFontSize(6);
    doc.text(`Identificador de Expediente: ${data.caseNumber || 'N/A'}`, 130, 285);
  } else {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(125, signatureY + 20, 185, signatureY + 20);
    doc.setFontSize(9);
    doc.text('Sello y Firma de Autoridad', 130, signatureY + 24);
    doc.text('IFTS N° 18', 150, signatureY + 28);
  }

  // Footer metadata
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Página 1 de 1 - Validez Académica Sujeta a Verificación en Sistema Central`, 105, 290, { align: 'center' });

  // Save
  const fileName = `IFTS18_${title.replace(/\s+/g, '_')}_${profile?.dni || 'anon'}.pdf`;
  doc.save(fileName);
};
