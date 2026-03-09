import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Publicacion } from '@/hooks/usePublicaciones';
import type { MetaMetricasCuenta } from '@/hooks/useMetaMetricasCuenta';
import type { MetaCampana } from '@/hooks/useMetaCampanas';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface MetaExportData {
  metaPubs: Publicacion[];
  month: number;
  year: number;
  accountMetrics?: MetaMetricasCuenta | null;
  kpis: { label: string; value: number; prev: number }[];
  byPauta: { name: string; posts: number; alcance: number; engagement: number }[];
  campanas?: MetaCampana[];
}

function fmt(v: number) { return v.toLocaleString(); }
function fmtMoney(v: number) { return `$${v.toLocaleString()}`; }

function sumField(pubs: Publicacion[], field: keyof Publicacion): number {
  return pubs.reduce((acc, p) => acc + (Number(p[field]) || 0), 0);
}
function avgField(pubs: Publicacion[], field: keyof Publicacion): number {
  const vals = pubs.map(p => Number(p[field]) || 0).filter(v => v > 0);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ─── EXCEL ───────────────────────────────────────────────────────────────────

export function exportMetaToExcel(data: MetaExportData) {
  const { metaPubs, month, year, accountMetrics, kpis, byPauta } = data;
  const wb = XLSX.utils.book_new();

  // Sheet 1: KPIs resumen
  const kpiRows: any[][] = [
    ['REPORTE META', `${MESES[month]} ${year}`],
    [],
    ['KPI', 'VALOR ACTUAL', 'VALOR ANTERIOR', 'CAMBIO %'],
    ...kpis.map(k => {
      const change = k.prev === 0 ? (k.value > 0 ? 100 : 0) : ((k.value - k.prev) / k.prev) * 100;
      return [k.label, k.value, k.prev, `${change.toFixed(1)}%`];
    }),
  ];

  if (accountMetrics) {
    kpiRows.push([], ['MÉTRICAS DE CUENTA'], []);
    kpiRows.push(
      ['Seguidores totales', accountMetrics.seguidores_totales || 0],
      ['Seguidores nuevos', accountMetrics.seguidores_nuevos || 0],
      ['Alcance de cuenta', accountMetrics.alcance_cuenta || 0],
      ['Impresiones de cuenta', accountMetrics.impresiones_cuenta || 0],
      ['Visitas al perfil', accountMetrics.visitas_perfil || 0],
      ['Clics sitio web', accountMetrics.clics_sitio_web || 0],
      ['Engagement cuenta', accountMetrics.engagement_cuenta || 0],
      ['ER cuenta', `${accountMetrics.er_cuenta || 0}%`],
      ['Inversión total', `$${accountMetrics.inversion_total || 0}`],
    );
    if (accountMetrics.notas) {
      kpiRows.push([], ['Notas:', accountMetrics.notas]);
    }
  }

  kpiRows.push([], ['ORGÁNICO VS PAUTA'], ['Tipo', 'Posts', 'Alcance', 'Engagement']);
  byPauta.forEach(b => kpiRows.push([b.name, b.posts, b.alcance, b.engagement]));

  // Campañas Meta Ads
  if (data.campanas && data.campanas.length > 0) {
    kpiRows.push([], ['CAMPAÑAS META ADS'], []);
    kpiRows.push(['Campaña', 'Resultados', 'Alcance', 'Impresiones', 'Gasto (USD)', 'Costo/Resultado', 'Periodo']);
    data.campanas.forEach(c => kpiRows.push([
      c.nombre_campana, c.resultados || 0, c.alcance || 0, c.impresiones || 0,
      `$${(c.importe_gastado || 0).toFixed(2)}`, `$${(c.costo_por_resultado || 0).toFixed(4)}`,
      `${c.inicio_informe} → ${c.fin_informe}`,
    ]));
    kpiRows.push(['TOTAL', 
      data.campanas.reduce((a, c) => a + (c.resultados || 0), 0),
      data.campanas.reduce((a, c) => a + (c.alcance || 0), 0),
      data.campanas.reduce((a, c) => a + (c.impresiones || 0), 0),
      `$${data.campanas.reduce((a, c) => a + (c.importe_gastado || 0), 0).toFixed(2)}`,
      '', '',
    ]);
  }

  const wsKpi = XLSX.utils.aoa_to_sheet(kpiRows);
  wsKpi['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsKpi, 'Resumen KPIs');

  // Sheet 2: Detalle publicaciones
  const HEADERS = ['Fecha', 'Red Social', 'Título', 'Tipo Contenido', 'Campaña', 'Estado', 'Pauta',
    'Alcance', 'Impresiones', 'Engagement', 'ER%', 'Clics', 'Guardados', 'Compartidos',
    'Seg. Nuevos', 'Costo', 'Costo/Resultado'];

  const rows = metaPubs.map(p => [
    p.fecha, p.red_social, p.titulo, p.tipo_contenido,
    (p as any).campana || '', p.estado, (p as any).tipo_pauta || '',
    p.alcance || 0, p.impresiones || 0, p.engagement || 0,
    p.er_porcentaje ? `${p.er_porcentaje}%` : '',
    p.clics || 0, p.guardados || 0, p.compartidos || 0,
    p.seguidores_nuevos || 0,
    p.costo ? `$${p.costo}` : '',
    p.costo_por_resultado ? `$${p.costo_por_resultado}` : '',
  ]);

  // Totals row
  rows.push([
    '', '', 'TOTAL', '', '', '', '',
    sumField(metaPubs, 'alcance'),
    sumField(metaPubs, 'impresiones'),
    sumField(metaPubs, 'engagement'),
    `${avgField(metaPubs, 'er_porcentaje').toFixed(2)}%`,
    sumField(metaPubs, 'clics'),
    sumField(metaPubs, 'guardados'),
    sumField(metaPubs, 'compartidos'),
    sumField(metaPubs, 'seguidores_nuevos'),
    `$${sumField(metaPubs, 'costo')}`,
    `$${avgField(metaPubs, 'costo_por_resultado').toFixed(2)}`,
  ]);

  const wsDetail = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  wsDetail['!cols'] = [12, 14, 30, 16, 22, 12, 14, 14, 16, 14, 10, 12, 14, 14, 14, 14, 16].map(wch => ({ wch }));
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle Publicaciones');

  XLSX.writeFile(wb, `reporte_meta_${MESES[month]}_${year}.xlsx`);
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export function exportMetaToPDF(data: MetaExportData) {
  const { metaPubs, month, year, accountMetrics, kpis, byPauta, campanas } = data;
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const title = `Reporte Meta — ${MESES[month]} ${year}`;

  const drawBanner = (text: string, color: [number, number, number]) => {
    doc.setFillColor(...color);
    doc.rect(0, 0, pageW, 14, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, 10, 9);
    doc.setFont('helvetica', 'normal');
    doc.text(text, pageW - 10, 9, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  // ── Page 1: KPIs ──
  drawBanner('RESUMEN KPIs', [59, 130, 246]);

  let y = 22;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicadores Clave de Rendimiento', 14, y);
  y += 8;

  // KPI table
  autoTable(doc, {
    head: [['KPI', 'Valor Actual', 'Período Anterior', 'Cambio %']],
    body: kpis.map(k => {
      const change = k.prev === 0 ? (k.value > 0 ? '+100%' : '0%') : `${(((k.value - k.prev) / k.prev) * 100).toFixed(1)}%`;
      return [k.label, fmt(k.value), fmt(k.prev), change];
    }),
    startY: y,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 245, 255] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Account metrics if available
  if (accountMetrics) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Métricas de Cuenta', 14, y);
    y += 5;

    autoTable(doc, {
      head: [['Métrica', 'Valor']],
      body: [
        ['Seguidores totales', fmt(accountMetrics.seguidores_totales || 0)],
        ['Seguidores nuevos', fmt(accountMetrics.seguidores_nuevos || 0)],
        ['Alcance de cuenta', fmt(accountMetrics.alcance_cuenta || 0)],
        ['Impresiones de cuenta', fmt(accountMetrics.impresiones_cuenta || 0)],
        ['Visitas al perfil', fmt(accountMetrics.visitas_perfil || 0)],
        ['Clics sitio web', fmt(accountMetrics.clics_sitio_web || 0)],
        ['ER cuenta', `${accountMetrics.er_cuenta || 0}%`],
        ['Inversión total', fmtMoney(accountMetrics.inversion_total || 0)],
      ],
      startY: y,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      columnStyles: { 1: { halign: 'right' } },
      tableWidth: 120,
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Orgánico vs Pauta
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Orgánico vs Pauta', 14, y);
  y += 5;

  autoTable(doc, {
    head: [['Tipo', 'Posts', 'Alcance', 'Engagement']],
    body: byPauta.map(b => [b.name, b.posts, fmt(b.alcance), fmt(b.engagement)]),
    startY: y,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    tableWidth: 160,
  });

  // ── Page 2: Detail table ──
  doc.addPage();
  drawBanner('DETALLE POR PUBLICACIÓN', [139, 92, 246]);

  autoTable(doc, {
    head: [['Fecha', 'Red', 'Título', 'Tipo', 'Estado', 'Alcance', 'Impres.', 'Eng.', 'ER%', 'Clics', 'Guard.', 'Comp.', 'Costo']],
    body: metaPubs.map(p => [
      p.fecha, p.red_social, p.titulo, p.tipo_contenido, p.estado,
      p.alcance || 0, p.impresiones || 0, p.engagement || 0,
      p.er_porcentaje ? `${p.er_porcentaje}%` : '-',
      p.clics || 0, p.guardados || 0, p.compartidos || 0,
      p.costo ? `$${p.costo}` : '-',
    ]),
    startY: 18,
    styles: { fontSize: 6.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [250, 248, 255] },
    foot: metaPubs.length > 0 ? [['', '', 'TOTAL', '', '',
      fmt(sumField(metaPubs, 'alcance')),
      fmt(sumField(metaPubs, 'impresiones')),
      fmt(sumField(metaPubs, 'engagement')),
      `${avgField(metaPubs, 'er_porcentaje').toFixed(2)}%`,
      fmt(sumField(metaPubs, 'clics')),
      fmt(sumField(metaPubs, 'guardados')),
      fmt(sumField(metaPubs, 'compartidos')),
      fmtMoney(sumField(metaPubs, 'costo')),
    ]] : undefined,
    footStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
    didDrawPage: (d) => {
      if (d.pageNumber > 1) drawBanner('DETALLE POR PUBLICACIÓN', [139, 92, 246]);
    },
  });

  // ── Page 3: Meta Ads Campaigns ──
  if (campanas && campanas.length > 0) {
    doc.addPage();
    drawBanner('CAMPAÑAS META ADS', [234, 88, 12]);

    const totalAlcance = campanas.reduce((a, c) => a + (c.alcance || 0), 0);
    const totalImpresiones = campanas.reduce((a, c) => a + (c.impresiones || 0), 0);
    const totalGasto = campanas.reduce((a, c) => a + (c.importe_gastado || 0), 0);
    const totalResultados = campanas.reduce((a, c) => a + (c.resultados || 0), 0);
    const avgCostRes = campanas.length > 0 ? campanas.reduce((a, c) => a + (c.costo_por_resultado || 0), 0) / campanas.length : 0;

    let cy = 22;

    // KPI summary boxes
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen de Campañas', 14, cy);
    cy += 8;

    const kpiBoxes = [
      { label: 'Alcance Total', value: fmt(totalAlcance), color: [59, 130, 246] as [number, number, number] },
      { label: 'Impresiones Total', value: fmt(totalImpresiones), color: [16, 185, 129] as [number, number, number] },
      { label: 'Gasto Total', value: `$${totalGasto.toFixed(2)}`, color: [234, 88, 12] as [number, number, number] },
      { label: 'Costo/Resultado Prom.', value: `$${avgCostRes.toFixed(4)}`, color: [139, 92, 246] as [number, number, number] },
    ];

    const boxW = (pageW - 28 - 18) / 4;
    kpiBoxes.forEach((box, i) => {
      const bx = 14 + i * (boxW + 6);
      doc.setFillColor(...box.color);
      doc.roundedRect(bx, cy, boxW, 22, 3, 3, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text(box.label, bx + boxW / 2, cy + 8, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(box.value, bx + boxW / 2, cy + 17, { align: 'center' });
    });
    doc.setTextColor(0, 0, 0);
    cy += 32;

    // Draw horizontal bar chart for each campaign
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Comparativa por campaña', 14, cy);
    cy += 3;

    const maxAlcance = Math.max(...campanas.map(c => c.alcance || 0), 1);
    const barMaxW = pageW - 100;
    campanas.forEach(c => {
      cy += 10;
      const nameStr = c.nombre_campana.length > 45 ? c.nombre_campana.slice(0, 45) + '…' : c.nombre_campana;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(nameStr, 14, cy);
      cy += 4;

      const alcBarW = Math.max(((c.alcance || 0) / maxAlcance) * barMaxW, 2);
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(14, cy, alcBarW, 5, 1.5, 1.5, 'F');
      doc.setFontSize(6);
      doc.setTextColor(59, 130, 246);
      doc.text(`Alcance: ${fmt(c.alcance || 0)}`, 14 + alcBarW + 3, cy + 4);
      cy += 7;

      const gastoBarW = Math.max(totalGasto > 0 ? ((c.importe_gastado || 0) / totalGasto) * barMaxW : 2, 2);
      doc.setFillColor(234, 88, 12);
      doc.roundedRect(14, cy, gastoBarW, 5, 1.5, 1.5, 'F');
      doc.setFontSize(6);
      doc.setTextColor(234, 88, 12);
      doc.text(`Gasto: $${(c.importe_gastado || 0).toFixed(2)}`, 14 + gastoBarW + 3, cy + 4);
      cy += 4;
    });

    doc.setTextColor(0, 0, 0);
    cy += 10;

    // Campaign detail table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de campañas', 14, cy);
    cy += 5;

    autoTable(doc, {
      head: [['Campaña', 'Resultados', 'Alcance', 'Impresiones', 'Gasto (USD)', 'Costo/Resultado', 'Periodo']],
      body: campanas.map(c => [
        c.nombre_campana,
        (c.resultados || 0).toLocaleString(),
        fmt(c.alcance || 0),
        fmt(c.impresiones || 0),
        `$${(c.importe_gastado || 0).toFixed(2)}`,
        `$${(c.costo_por_resultado || 0).toFixed(4)}`,
        `${c.inicio_informe} → ${c.fin_informe}`,
      ]),
      foot: [[
        'TOTAL',
        totalResultados.toLocaleString(),
        fmt(totalAlcance),
        fmt(totalImpresiones),
        `$${totalGasto.toFixed(2)}`,
        '-', '-',
      ]],
      startY: cy,
      styles: { fontSize: 7, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 247, 237] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' },
        4: { halign: 'right' }, 5: { halign: 'right' },
      },
    });
  }

  // Page numbers
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`Página ${i} de ${total}`, pageW - 10, pageH - 4, { align: 'right' });
  }

  doc.save(`reporte_meta_${MESES[month]}_${year}.pdf`);
}
