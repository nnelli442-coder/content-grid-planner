import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Publicacion } from '@/hooks/usePublicaciones';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function exportToExcel(publicaciones: Publicacion[], month: number, year: number) {
  const data = publicaciones.map(p => ({
    Fecha: p.fecha,
    'Red Social': p.red_social,
    Tipo: p.tipo_contenido,
    Título: p.titulo,
    'Descripción': p.descripcion || '',
    'Copy Arte': p.copy_arte || '',
    'Link Referencia': p.link_referencia || '',
    Estado: p.estado,
    Color: p.color || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${MESES[month]} ${year}`);
  XLSX.writeFile(wb, `grilla_${MESES[month]}_${year}.xlsx`);
}

export function exportToPDF(publicaciones: Publicacion[], month: number, year: number) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text(`Grilla de Contenido — ${MESES[month]} ${year}`, 14, 15);

  const rows = publicaciones.map(p => [
    p.fecha,
    p.red_social,
    p.tipo_contenido,
    p.titulo,
    (p.descripcion || '').substring(0, 50),
    (p.copy_arte || '').substring(0, 50),
    p.estado,
  ]);

  autoTable(doc, {
    head: [['Fecha', 'Red Social', 'Tipo', 'Título', 'Descripción', 'Copy Arte', 'Estado']],
    body: rows,
    startY: 22,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [99, 102, 241] },
  });

  doc.save(`grilla_${MESES[month]}_${year}.pdf`);
}
