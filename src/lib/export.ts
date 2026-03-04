import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Publicacion } from '@/hooks/usePublicaciones';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export interface CuentaRef {
  id: string;
  nombre: string;
}

function buildCuentasMap(cuentas: CuentaRef[]): Record<string, string> {
  return Object.fromEntries(cuentas.map(c => [c.id, c.nombre]));
}

function formatDate(fecha: string): string {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

/** Combine caption + hashtags the way the real parrilla does */
function buildCopyOut(p: any): string {
  const caption = p.copy_caption || '';
  const hashtags = p.hashtags || '';
  if (caption && hashtags) return `${caption}\n\n${hashtags}`;
  return caption || hashtags;
}

// ─── EXCEL ───────────────────────────────────────────────────────────────────

export function exportToExcel(
  publicaciones: Publicacion[],
  month: number,
  year: number,
  cuentas: CuentaRef[] = []
) {
  const cuentasMap = buildCuentasMap(cuentas);
  const wb = XLSX.utils.book_new();

  // Group by cuenta — one sheet per client
  const groups = new Map<string, Publicacion[]>();
  for (const p of publicaciones) {
    const key = (p as any).cuenta_id || '__general__';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  // If no publications at all, create empty sheet
  if (groups.size === 0) {
    const ws = makeContentSheet([]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sin datos');
    XLSX.writeFile(wb, `grilla_${MESES[month]}_${year}.xlsx`);
    return;
  }

  for (const [cuentaId, pubs] of groups) {
    const rawName = cuentaId === '__general__'
      ? 'General'
      : (cuentasMap[cuentaId] || 'Sin cuenta');
    // Excel sheet names max 31 chars, no special chars
    const sheetName = rawName.replace(/[:\\/?*[\]]/g, '').slice(0, 31);

    const ws = makeContentSheet(pubs);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Single Medición sheet (all accounts together, grouped by cuenta)
  if (publicaciones.some(p => hasMedicion(p))) {
    const ws = makeMedicionSheet(publicaciones, cuentasMap);
    XLSX.utils.book_append_sheet(wb, ws, 'Medición');
  }

  XLSX.writeFile(wb, `grilla_${MESES[month]}_${year}.xlsx`);
}

function hasMedicion(p: any): boolean {
  return !!(p.alcance || p.impresiones || p.engagement || p.clics || p.costo);
}

function makeContentSheet(pubs: Publicacion[]) {
  const HEADERS = [
    'CAMPAÑA',
    'FECHA DE PUBLICACIÓN',
    'OBJETIVO',
    'FORMATO',
    'CANAL',
    'COPY ARTE',
    'COPY OUT',
    'CONTENIDO VISUAL',
    'ESTADO',
    'PILAR DE CONTENIDO',
    'ETAPA FUNNEL',
    'HOOK',
    'CTA',
    'TIPO DE PAUTA',
    'PRESUPUESTO',
    'SEGMENTACIÓN',
    'NOTAS',
  ];

  const COL_WIDTHS = [
    28,  // CAMPAÑA
    18,  // FECHA
    18,  // OBJETIVO
    14,  // FORMATO
    15,  // CANAL
    52,  // COPY ARTE
    58,  // COPY OUT
    48,  // CONTENIDO VISUAL
    16,  // ESTADO
    22,  // PILAR
    18,  // FUNNEL
    38,  // HOOK
    32,  // CTA
    16,  // TIPO PAUTA
    14,  // PRESUPUESTO
    30,  // SEGMENTACIÓN
    35,  // NOTAS
  ];

  const rows = pubs.map(p => [
    (p as any).campana || '',
    formatDate(p.fecha),
    (p as any).objetivo_post || '',
    p.tipo_contenido || '',
    p.red_social || '',
    p.copy_arte || '',
    buildCopyOut(p),
    (p as any).indicaciones_arte || (p as any).referencia_visual || '',
    p.estado || '',
    (p as any).pilar_contenido || '',
    (p as any).etapa_funnel || '',
    (p as any).hook || '',
    (p as any).cta_texto || '',
    (p as any).tipo_pauta || '',
    (p as any).presupuesto != null ? (p as any).presupuesto : '',
    (p as any).segmentacion || '',
    p.descripcion || '',
  ]);

  const aoa = [HEADERS, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = COL_WIDTHS.map(wch => ({ wch }));
  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  return ws;
}

function makeMedicionSheet(publicaciones: Publicacion[], cuentasMap: Record<string, string>) {
  const HEADERS = [
    'CUENTA / CLIENTE',
    'CAMPAÑA',
    'TÍTULO',
    'FECHA',
    'CANAL',
    'FORMATO',
    'ESTADO',
    'ALCANCE',
    'IMPRESIONES',
    'ENGAGEMENT',
    'ER %',
    'GUARDADOS',
    'COMPARTIDOS',
    'CLICS',
    'SEGUIDORES NUEVOS',
    'COSTO',
    'COSTO POR RESULTADO',
  ];

  const rows = publicaciones.map((p: any) => [
    p.cuenta_id ? (cuentasMap[p.cuenta_id] || p.cuenta_id) : '—',
    p.campana || '',
    p.titulo || '',
    formatDate(p.fecha),
    p.red_social || '',
    p.tipo_contenido || '',
    p.estado || '',
    p.alcance ?? '',
    p.impresiones ?? '',
    p.engagement ?? '',
    p.er_porcentaje != null ? `${p.er_porcentaje}%` : '',
    p.guardados ?? '',
    p.compartidos ?? '',
    p.clics ?? '',
    p.seguidores_nuevos ?? '',
    p.costo != null ? `$${p.costo}` : '',
    p.costo_por_resultado != null ? `$${p.costo_por_resultado}` : '',
  ]);

  const aoa = [HEADERS, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [22, 25, 35, 12, 14, 14, 16, 14, 16, 16, 10, 14, 14, 12, 18, 14, 20].map(wch => ({ wch }));
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  return ws;
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export function exportToPDF(
  publicaciones: Publicacion[],
  month: number,
  year: number,
  cuentas: CuentaRef[] = []
) {
  const cuentasMap = buildCuentasMap(cuentas);
  const getCuenta = (p: any) =>
    p.cuenta_id ? (cuentasMap[p.cuenta_id] || p.cuenta_id) : '—';

  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const mainTitle = `Grilla de Contenido — ${MESES[month]} ${year}`;
  const totalPubs = publicaciones.length;

  const drawHeader = (section: string, color: [number, number, number]) => {
    doc.setFillColor(...color);
    doc.rect(0, 0, pageW, 12, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(mainTitle, 10, 8);
    doc.text(section, pageW / 2, 8, { align: 'center' });
    doc.text(`${totalPubs} publicaciones`, pageW - 10, 8, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  const addPageNumbers = () => {
    const total = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `Página ${i} de ${total}`,
        pageW - 10,
        doc.internal.pageSize.getHeight() - 4,
        { align: 'right' }
      );
    }
  };

  // ── PAGE 1: Planificación + Ejecución ──
  drawHeader('PLANIFICACIÓN / EJECUCIÓN', [79, 70, 229]);

  const planRows = publicaciones.map(p => [
    getCuenta(p),
    (p as any).campana || '',
    formatDate(p.fecha),
    p.red_social || '',
    p.tipo_contenido || '',
    (p as any).objetivo_post || '',
    (p as any).pilar_contenido || '',
    (p as any).etapa_funnel || '',
    (p as any).tipo_pauta || '',
    p.estado || '',
    (p as any).hook || '',
    (p as any).cta_texto || '',
  ]);

  autoTable(doc, {
    head: [['Cuenta', 'Campaña', 'Fecha', 'Canal', 'Formato', 'Objetivo', 'Pilar', 'Funnel', 'Pauta', 'Estado', 'Hook', 'CTA']],
    body: planRows,
    startY: 15,
    styles: { fontSize: 6.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 248, 255] },
    columnStyles: {
      0: { cellWidth: 24 },  // Cuenta
      1: { cellWidth: 26 },  // Campaña
      2: { cellWidth: 16 },  // Fecha
      3: { cellWidth: 16 },  // Canal
      4: { cellWidth: 14 },  // Formato
      5: { cellWidth: 18 },  // Objetivo
      6: { cellWidth: 18 },  // Pilar
      7: { cellWidth: 18 },  // Funnel
      8: { cellWidth: 14 },  // Pauta
      9: { cellWidth: 16 },  // Estado
      10: { cellWidth: 30 }, // Hook
      11: { cellWidth: 26 }, // CTA
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader('PLANIFICACIÓN / EJECUCIÓN', [79, 70, 229]);
    },
  });

  // ── PAGE 2: Copy ──────────────────────────────────────────────
  doc.addPage();
  drawHeader('COPY (ARTE + CAPTION)', [219, 39, 119]);

  const copyRows = publicaciones.map(p => [
    getCuenta(p),
    (p as any).campana || '',
    formatDate(p.fecha),
    p.tipo_contenido || '',
    p.copy_arte || '',
    buildCopyOut(p),
    (p as any).indicaciones_arte || '',
  ]);

  autoTable(doc, {
    head: [['Cuenta', 'Campaña', 'Fecha', 'Formato', 'Copy Arte', 'Copy Out (Caption + Hashtags)', 'Indicaciones Arte']],
    body: copyRows,
    startY: 15,
    styles: { fontSize: 6, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [219, 39, 119], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [255, 248, 254] },
    columnStyles: {
      0: { cellWidth: 22 },  // Cuenta
      1: { cellWidth: 24 },  // Campaña
      2: { cellWidth: 16 },  // Fecha
      3: { cellWidth: 14 },  // Formato
      4: { cellWidth: 52 },  // Copy Arte
      5: { cellWidth: 60 },  // Copy Out
      6: { cellWidth: 40 },  // Indicaciones Arte
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader('COPY (ARTE + CAPTION)', [219, 39, 119]);
    },
  });

  // ── PAGE 3: Medición ─────────────────────────────────────────
  doc.addPage();
  drawHeader('MEDICIÓN', [5, 150, 105]);

  const medRows = publicaciones.map(p => [
    getCuenta(p),
    (p as any).campana || '',
    formatDate(p.fecha),
    p.red_social || '',
    p.tipo_contenido || '',
    p.estado || '',
    (p as any).alcance ?? '',
    (p as any).impresiones ?? '',
    (p as any).engagement ?? '',
    (p as any).er_porcentaje != null ? `${(p as any).er_porcentaje}%` : '',
    (p as any).guardados ?? '',
    (p as any).compartidos ?? '',
    (p as any).clics ?? '',
    (p as any).costo != null ? `$${(p as any).costo}` : '',
    (p as any).costo_por_resultado != null ? `$${(p as any).costo_por_resultado}` : '',
  ]);

  autoTable(doc, {
    head: [['Cuenta', 'Campaña', 'Fecha', 'Canal', 'Formato', 'Estado', 'Alcance', 'Impres.', 'Eng.', 'ER%', 'Guard.', 'Comp.', 'Clics', 'Costo', 'CPR']],
    body: medRows,
    startY: 15,
    styles: { fontSize: 6.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 255, 252] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 24 },
      2: { cellWidth: 16 },
      3: { cellWidth: 16 },
      4: { cellWidth: 14 },
      5: { cellWidth: 16 },
      6: { cellWidth: 16 },
      7: { cellWidth: 16 },
      8: { cellWidth: 16 },
      9: { cellWidth: 12 },
      10: { cellWidth: 14 },
      11: { cellWidth: 14 },
      12: { cellWidth: 12 },
      13: { cellWidth: 14 },
      14: { cellWidth: 14 },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader('MEDICIÓN', [5, 150, 105]);
    },
  });

  addPageNumbers();
  doc.save(`grilla_${MESES[month]}_${year}.pdf`);
}
