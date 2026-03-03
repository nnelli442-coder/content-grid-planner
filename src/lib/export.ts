import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Publicacion } from '@/hooks/usePublicaciones';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function exportToExcel(publicaciones: Publicacion[], month: number, year: number) {
  // Sheet 1: Planificación
  const planData = publicaciones.map(p => ({
    Fecha: p.fecha,
    Campaña: (p as any).campana || '',
    'Objetivo del Post': (p as any).objetivo_post || '',
    'Pilar de Contenido': (p as any).pilar_contenido || '',
    Formato: p.tipo_contenido,
    Canal: p.red_social,
    'Tipo (Pauta)': (p as any).tipo_pauta || '',
    'Etapa Funnel': (p as any).etapa_funnel || '',
    Hook: (p as any).hook || '',
    CTA: (p as any).cta_texto || '',
    Estado: p.estado,
  }));

  // Sheet 2: Ejecución
  const ejecData = publicaciones.map(p => ({
    Título: p.titulo,
    Fecha: p.fecha,
    'Copy Arte': p.copy_arte || '',
    'Copy Caption': (p as any).copy_caption || '',
    'Descripción': p.descripcion || '',
    'Indicaciones para el Arte': (p as any).indicaciones_arte || '',
    'Referencia Visual': (p as any).referencia_visual || '',
    Hashtags: (p as any).hashtags || '',
    Duración: (p as any).duracion || '',
    Presupuesto: (p as any).presupuesto || '',
    Segmentación: (p as any).segmentacion || '',
    'Link Referencia': p.link_referencia || '',
  }));

  // Sheet 3: Medición
  const medData = publicaciones.map(p => ({
    Título: p.titulo,
    Fecha: p.fecha,
    Alcance: (p as any).alcance || '',
    Impresiones: (p as any).impresiones || '',
    Engagement: (p as any).engagement || '',
    'ER %': (p as any).er_porcentaje || '',
    Guardados: (p as any).guardados || '',
    Compartidos: (p as any).compartidos || '',
    Clics: (p as any).clics || '',
    'Seguidores Nuevos': (p as any).seguidores_nuevos || '',
    Costo: (p as any).costo || '',
    'Costo por Resultado': (p as any).costo_por_resultado || '',
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(planData), 'Planificación');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ejecData), 'Ejecución');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(medData), 'Medición');
  XLSX.writeFile(wb, `grilla_${MESES[month]}_${year}.xlsx`);
}

export function exportToPDF(publicaciones: Publicacion[], month: number, year: number) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text(`Grilla de Contenido — ${MESES[month]} ${year}`, 14, 15);

  // Page 1: Planificación
  doc.setFontSize(12);
  doc.text('Planificación', 14, 24);

  const planRows = publicaciones.map(p => [
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
    head: [['Fecha', 'Campaña', 'Objetivo', 'Pilar', 'Formato', 'Canal', 'Tipo', 'Funnel', 'Hook', 'CTA', 'Estado']],
    body: planRows,
    startY: 28,
    styles: { fontSize: 7, cellWidth: 'wrap', overflow: 'linebreak' },
    headStyles: { fillColor: [99, 102, 241] },
    columnStyles: { 8: { cellWidth: 35 }, 9: { cellWidth: 35 } },
  });

  // Page 2: Ejecución
  doc.addPage();
  doc.setFontSize(12);
  doc.text('Ejecución', 14, 15);

  const ejecRows = publicaciones.map(p => [
    p.titulo,
    p.fecha,
    p.copy_arte || '',
    (p as any).copy_caption || '',
    (p as any).indicaciones_arte || '',
    (p as any).hashtags || '',
    (p as any).duracion || '',
    (p as any).presupuesto || '',
  ]);

  autoTable(doc, {
    head: [['Título', 'Fecha', 'Copy Arte', 'Copy Caption', 'Indicaciones Arte', 'Hashtags', 'Duración', 'Presupuesto']],
    body: ejecRows,
    startY: 20,
    styles: { fontSize: 7, cellWidth: 'wrap', overflow: 'linebreak' },
    headStyles: { fillColor: [236, 72, 153] },
    columnStyles: { 2: { cellWidth: 45 }, 3: { cellWidth: 45 }, 4: { cellWidth: 40 } },
  });

  // Page 3: Medición
  doc.addPage();
  doc.setFontSize(12);
  doc.text('Medición', 14, 15);

  const medRows = publicaciones.map(p => [
    p.titulo,
    p.fecha,
    (p as any).alcance || '',
    (p as any).impresiones || '',
    (p as any).engagement || '',
    (p as any).er_porcentaje || '',
    (p as any).guardados || '',
    (p as any).compartidos || '',
    (p as any).clics || '',
    (p as any).costo || '',
    (p as any).costo_por_resultado || '',
  ]);

  autoTable(doc, {
    head: [['Título', 'Fecha', 'Alcance', 'Impresiones', 'Engagement', 'ER%', 'Guardados', 'Compartidos', 'Clics', 'Costo', 'CPR']],
    body: medRows,
    startY: 20,
    styles: { fontSize: 7, cellWidth: 'wrap', overflow: 'linebreak' },
    headStyles: { fillColor: [16, 185, 129] },
  });

  doc.save(`grilla_${MESES[month]}_${year}.pdf`);
}
