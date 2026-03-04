import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Publicacion } from '@/hooks/usePublicaciones';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface CuentaRef {
  id: string;
  nombre: string;
}

function buildCuentasMap(cuentas: CuentaRef[]): Record<string, string> {
  return Object.fromEntries(cuentas.map(c => [c.id, c.nombre]));
}

export function exportToExcel(publicaciones: Publicacion[], month: number, year: number, cuentas: CuentaRef[] = []) {
  const cuentasMap = buildCuentasMap(cuentas);
  const getCuenta = (p: any) => p.cuenta_id ? (cuentasMap[p.cuenta_id] || p.cuenta_id) : '';

  // Sheet 1: Planificación
  const planData = publicaciones.map(p => ({
    'Cuenta / Cliente': getCuenta(p),
    'Título': p.titulo,
    'Fecha': p.fecha,
    'Campaña': (p as any).campana || '',
    'Objetivo del Post': (p as any).objetivo_post || '',
    'Pilar de Contenido': (p as any).pilar_contenido || '',
    'Formato': p.tipo_contenido,
    'Canal': p.red_social,
    'Tipo de Pauta': (p as any).tipo_pauta || '',
    'Etapa Funnel': (p as any).etapa_funnel || '',
    'Hook': (p as any).hook || '',
    'CTA': (p as any).cta_texto || '',
    'Estado': p.estado,
  }));

  // Sheet 2: Ejecución
  const ejecData = publicaciones.map(p => ({
    'Cuenta / Cliente': getCuenta(p),
    'Título': p.titulo,
    'Fecha': p.fecha,
    'Copy Arte': p.copy_arte || '',
    'Copy Caption': (p as any).copy_caption || '',
    'Descripción / Copy': p.descripcion || '',
    'Indicaciones para el Arte': (p as any).indicaciones_arte || '',
    'Referencia Visual': (p as any).referencia_visual || '',
    'Hashtags': (p as any).hashtags || '',
    'Duración': (p as any).duracion || '',
    'Presupuesto': (p as any).presupuesto || '',
    'Segmentación': (p as any).segmentacion || '',
    'Link de Referencia': p.link_referencia || '',
  }));

  // Sheet 3: Medición
  const medData = publicaciones.map(p => ({
    'Cuenta / Cliente': getCuenta(p),
    'Título': p.titulo,
    'Fecha': p.fecha,
    'Alcance': (p as any).alcance || '',
    'Impresiones': (p as any).impresiones || '',
    'Engagement': (p as any).engagement || '',
    'ER %': (p as any).er_porcentaje || '',
    'Guardados': (p as any).guardados || '',
    'Compartidos': (p as any).compartidos || '',
    'Clics': (p as any).clics || '',
    'Seguidores Nuevos': (p as any).seguidores_nuevos || '',
    'Costo': (p as any).costo || '',
    'Costo por Resultado': (p as any).costo_por_resultado || '',
  }));

  const wb = XLSX.utils.book_new();

  // Helper to create a sheet with column widths
  const makeSheet = (data: Record<string, any>[], colWidths: number[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = colWidths.map(wch => ({ wch }));
    // Freeze header row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    return ws;
  };

  const planSheet = makeSheet(planData, [22, 35, 12, 28, 18, 22, 14, 16, 15, 20, 40, 32, 16]);
  const ejecSheet = makeSheet(ejecData, [22, 35, 12, 45, 45, 38, 48, 32, 30, 12, 14, 30, 35]);
  const medSheet  = makeSheet(medData,  [22, 35, 12, 14, 16, 16, 10, 14, 14, 12, 18, 14, 20]);

  XLSX.utils.book_append_sheet(wb, planSheet, 'Planificación');
  XLSX.utils.book_append_sheet(wb, ejecSheet, 'Ejecución');
  XLSX.utils.book_append_sheet(wb, medSheet,  'Medición');

  XLSX.writeFile(wb, `grilla_${MESES[month]}_${year}.xlsx`);
}

export function exportToPDF(publicaciones: Publicacion[], month: number, year: number, cuentas: CuentaRef[] = []) {
  const cuentasMap = buildCuentasMap(cuentas);
  const getCuenta = (p: any) => p.cuenta_id ? (cuentasMap[p.cuenta_id] || p.cuenta_id) : '—';

  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const title = `Grilla de Contenido — ${MESES[month]} ${year}`;
  const totalPubs = publicaciones.length;

  const drawHeader = (sectionName: string, color: [number, number, number]) => {
    // Colored top bar
    doc.setFillColor(...color);
    doc.rect(0, 0, pageW, 12, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 10, 8);
    doc.text(sectionName, pageW / 2, 8, { align: 'center' });
    doc.text(`${totalPubs} publicaciones`, pageW - 10, 8, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  const addPageNumbers = () => {
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageW - 10,
        doc.internal.pageSize.getHeight() - 4,
        { align: 'right' }
      );
      doc.setTextColor(0, 0, 0);
    }
  };

  // ─── Page 1: Planificación ───────────────────────────────────────────────
  drawHeader('PLANIFICACIÓN', [79, 70, 229]);

  const planRows = publicaciones.map(p => [
    getCuenta(p),
    p.titulo || '—',
    p.fecha,
    (p as any).campana || '',
    (p as any).objetivo_post || '',
    (p as any).pilar_contenido || '',
    p.tipo_contenido,
    p.red_social,
    (p as any).tipo_pauta || '',
    (p as any).etapa_funnel || '',
    (p as any).hook || '',
    (p as any).cta_texto || '',
    p.estado,
  ]);

  autoTable(doc, {
    head: [['Cuenta', 'Título', 'Fecha', 'Campaña', 'Objetivo', 'Pilar', 'Formato', 'Canal', 'Pauta', 'Funnel', 'Hook', 'CTA', 'Estado']],
    body: planRows,
    startY: 15,
    styles: { fontSize: 6.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    columnStyles: {
      0: { cellWidth: 22 },   // Cuenta
      1: { cellWidth: 32 },   // Título
      2: { cellWidth: 18 },   // Fecha
      3: { cellWidth: 24 },   // Campaña
      4: { cellWidth: 18 },   // Objetivo
      5: { cellWidth: 18 },   // Pilar
      6: { cellWidth: 14 },   // Formato
      7: { cellWidth: 14 },   // Canal
      8: { cellWidth: 14 },   // Pauta
      9: { cellWidth: 18 },   // Funnel
      10: { cellWidth: 30 },  // Hook
      11: { cellWidth: 28 },  // CTA
      12: { cellWidth: 16 },  // Estado
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader('PLANIFICACIÓN', [79, 70, 229]);
    },
  });

  // ─── Page 2: Ejecución ──────────────────────────────────────────────────
  doc.addPage();
  drawHeader('EJECUCIÓN', [219, 39, 119]);

  const ejecRows = publicaciones.map(p => [
    getCuenta(p),
    p.titulo || '—',
    p.fecha,
    p.copy_arte || '',
    (p as any).copy_caption || '',
    (p as any).indicaciones_arte || '',
    (p as any).hashtags || '',
    (p as any).duracion || '',
    (p as any).presupuesto != null ? String((p as any).presupuesto) : '',
    (p as any).segmentacion || '',
  ]);

  autoTable(doc, {
    head: [['Cuenta', 'Título', 'Fecha', 'Copy Arte', 'Copy Caption', 'Indicaciones Arte', 'Hashtags', 'Duración', 'Presupuesto', 'Segmentación']],
    body: ejecRows,
    startY: 15,
    styles: { fontSize: 6.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [219, 39, 119], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [255, 245, 252] },
    columnStyles: {
      0: { cellWidth: 22 },  // Cuenta
      1: { cellWidth: 30 },  // Título
      2: { cellWidth: 18 },  // Fecha
      3: { cellWidth: 40 },  // Copy Arte
      4: { cellWidth: 40 },  // Copy Caption
      5: { cellWidth: 38 },  // Indicaciones Arte
      6: { cellWidth: 28 },  // Hashtags
      7: { cellWidth: 16 },  // Duración
      8: { cellWidth: 16 },  // Presupuesto
      9: { cellWidth: 28 },  // Segmentación
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader('EJECUCIÓN', [219, 39, 119]);
    },
  });

  // ─── Page 3: Medición ───────────────────────────────────────────────────
  doc.addPage();
  drawHeader('MEDICIÓN', [5, 150, 105]);

  const medRows = publicaciones.map(p => [
    getCuenta(p),
    p.titulo || '—',
    p.fecha,
    (p as any).alcance || '',
    (p as any).impresiones || '',
    (p as any).engagement || '',
    (p as any).er_porcentaje != null ? `${(p as any).er_porcentaje}%` : '',
    (p as any).guardados || '',
    (p as any).compartidos || '',
    (p as any).clics || '',
    (p as any).seguidores_nuevos || '',
    (p as any).costo != null ? `$${(p as any).costo}` : '',
    (p as any).costo_por_resultado != null ? `$${(p as any).costo_por_resultado}` : '',
  ]);

  autoTable(doc, {
    head: [['Cuenta', 'Título', 'Fecha', 'Alcance', 'Impresiones', 'Engagement', 'ER %', 'Guardados', 'Compartidos', 'Clics', 'Seg. Nuevos', 'Costo', 'CPR']],
    body: medRows,
    startY: 15,
    styles: { fontSize: 6.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 255, 250] },
    columnStyles: {
      0: { cellWidth: 22 },  // Cuenta
      1: { cellWidth: 32 },  // Título
      2: { cellWidth: 18 },  // Fecha
      3: { cellWidth: 18 },  // Alcance
      4: { cellWidth: 20 },  // Impresiones
      5: { cellWidth: 18 },  // Engagement
      6: { cellWidth: 14 },  // ER%
      7: { cellWidth: 16 },  // Guardados
      8: { cellWidth: 18 },  // Compartidos
      9: { cellWidth: 14 },  // Clics
      10: { cellWidth: 18 }, // Seg. Nuevos
      11: { cellWidth: 16 }, // Costo
      12: { cellWidth: 16 }, // CPR
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader('MEDICIÓN', [5, 150, 105]);
    },
  });

  addPageNumbers();
  doc.save(`grilla_${MESES[month]}_${year}.pdf`);
}
