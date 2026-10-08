import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, CashFlow, Product } from '../types';
import { formatRupiah, formatDate } from './currency';

export interface FinancialReportData {
  timeFilterLabel: string;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  profitMarginPercent: number;
  totalOperationalExpense: number;
  netStoreCashBalance: number;
  totalInventoryAssetValue: number;
  totalInventoryPotentialRevenue: number;
  paymentBreakdown: {
    cash: { amount: number; percent: number };
    qris: { amount: number; percent: number };
    transfer: { amount: number; percent: number };
  };
  cashFlows: CashFlow[];
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }>;
  printedBy: string;
  printedByRole: string;
}

/**
 * Generates and downloads a store owner financial report in PDF format
 */
export function exportFinancialReportPDF(data: FinancialReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // --- BRAND HEADER ---
  doc.setFillColor(249, 115, 22); // Orange 500
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('KASIRKU', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistem POS & Manajemen Stok Kasir Modern | Arsip Pemilik Toko', 14, 18);
  doc.text('LAPORAN KEUANGAN, LABA RUGI & ARUS KAS', 14, 23);

  doc.setFontSize(8);
  doc.text(`Waktu Cetak: ${currentDateStr}`, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Dicetak Oleh: ${data.printedBy} (${data.printedByRole})`, pageWidth - 14, 17, { align: 'right' });
  doc.text(`Periode Data: ${data.timeFilterLabel}`, pageWidth - 14, 22, { align: 'right' });

  // --- METADATA STRIP ---
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 32, pageWidth - 28, 11, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 32, pageWidth - 28, 11, 'S');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DOKUMEN RESMI ARSIP PEMILIK KASIRKU (CONFIDENTIAL / PRIVATE)', 18, 39);

  let startY = 49;

  // --- EXECUTIVE SUMMARY CARDS ---
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Ringkasan Eksekutif Finansial & Profitabilitas', 14, startY);

  autoTable(doc, {
    startY: startY + 3,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    head: [['Indikator Finansial', 'Nilai / Nominal (IDR)', 'Keterangan Analisis']],
    body: [
      ['Total Omset Penjualan (Gross Revenue)', formatRupiah(data.totalRevenue), 'Total penerimaan dari transaksi kasir POS'],
      ['Harga Pokok Penjualan (HPP)', formatRupiah(data.totalCOGS), 'Biaya modal barang yang terjual'],
      [
        'Laba Kotor Penjualan (Gross Profit)',
        `${formatRupiah(data.grossProfit)} (${data.profitMarginPercent}%)`,
        'Selisih penjualan kotor dikurangi total HPP',
      ],
      ['Beban Operasional Toko', formatRupiah(data.totalOperationalExpense), 'Biaya listrik, perlengkapan, konsumsi & operasional'],
      [
        'Estimasi Kas Bersih Toko (Net Balance)',
        formatRupiah(data.netStoreCashBalance),
        'Omset penjualan dikurangi beban operasional tercatat',
      ],
      [
        'Total Valuasi Aset Stok Toko',
        formatRupiah(data.totalInventoryAssetValue),
        `Nilai modal stok fisik gudang (Potensi omset: ${formatRupiah(data.totalInventoryPotentialRevenue)})`,
      ],
    ],
    margin: { left: 14, right: 14 },
  });

  const summaryFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // --- BREAKDOWN METODE PEMBAYARAN ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Distribusi Metode Pembayaran Kasir', 14, summaryFinalY + 10);

  autoTable(doc, {
    startY: summaryFinalY + 13,
    theme: 'striped',
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    head: [['Metode Pembayaran', 'Total Nominal (IDR)', 'Porsi (%)', 'Status Rekonsiliasi']],
    body: [
      ['Uang Tunai (Cash Fisik Kasir)', formatRupiah(data.paymentBreakdown.cash.amount), `${data.paymentBreakdown.cash.percent}%`, 'Tersedia di laci kasir'],
      ['QRIS Pembayaran Digital (Statik / Dinamis)', formatRupiah(data.paymentBreakdown.qris.amount), `${data.paymentBreakdown.qris.percent}%`, 'Masuk settlement e-wallet/bank'],
      ['Transfer Rekening Bank', formatRupiah(data.paymentBreakdown.transfer.amount), `${data.paymentBreakdown.transfer.percent}%`, 'Tercatat di mutasi rekening'],
    ],
    margin: { left: 14, right: 14 },
  });

  const paymentFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // --- TOP PROKDUK KONTRIBUTOR LABA ---
  if (data.topProducts.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Produk Unggulan & Kontributor Penjualan Terbesar', 14, paymentFinalY + 10);

    const productRows = data.topProducts.slice(0, 8).map((p, idx) => [
      String(idx + 1),
      p.name,
      `${p.quantity} Unit`,
      formatRupiah(p.revenue),
      formatRupiah(p.profit),
    ]);

    autoTable(doc, {
      startY: paymentFinalY + 13,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 118, 110], // Teal 700
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
      },
      head: [['No', 'Nama Produk / Barang', 'Terjual (Qty)', 'Total Omset', 'Estimasi Laba']],
      body: productRows,
      margin: { left: 14, right: 14 },
    });
  }

  // --- RINCIAN PENGELUARAN & ARUS KAS ---
  if (data.cashFlows.length > 0) {
    const currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    
    // Check if new page needed
    let cashFlowStartY = currentY + 10;
    if (cashFlowStartY > 220) {
      doc.addPage();
      cashFlowStartY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Catatan Pengeluaran Operasional & Kas Toko', 14, cashFlowStartY);

    const flowRows = data.cashFlows.slice(0, 15).map((cf, idx) => [
      String(idx + 1),
      formatDate(cf.createdAt),
      cf.type === 'income' ? 'KAS MASUK' : 'KAS KELUAR',
      cf.category,
      cf.description,
      formatRupiah(cf.amount),
      cf.cashierName || '-',
    ]);

    autoTable(doc, {
      startY: cashFlowStartY + 3,
      theme: 'striped',
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      bodyStyles: {
        fontSize: 7.5,
      },
      head: [['No', 'Waktu Transaksi', 'Jenis', 'Kategori', 'Keterangan', 'Nominal', 'Pencatat']],
      body: flowRows,
      margin: { left: 14, right: 14 },
    });
  }

  // --- SIGNATURE SECTION ---
  const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  let signY = lastY + 15;
  if (signY > 245) {
    doc.addPage();
    signY = 25;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text('Petugas Penyusun Arsip:', 25, signY);
  doc.text('Mengetahui & Menyetujui,', pageWidth - 70, signY);

  doc.text('Pemilik KasirKu (Owner)', pageWidth - 70, signY + 5);

  doc.setDrawColor(203, 213, 225);
  doc.line(25, signY + 24, 75, signY + 24);
  doc.line(pageWidth - 70, signY + 24, pageWidth - 20, signY + 24);

  doc.text(`( ${data.printedBy} )`, 25, signY + 29);
  doc.text(`( Pemilik / Pimpinan Toko )`, pageWidth - 70, signY + 29);

  // --- PAGE NUMBERING ---
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `KasirKu POS | Laporan Keuangan Resmi | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  const cleanDate = new Date().toISOString().slice(0, 10);
  doc.save(`Laporan_Keuangan_Toko_Almas_${cleanDate}.pdf`);
}

export interface TransactionHistoryReportData {
  transactions: Transaction[];
  printedBy: string;
  printedByRole: string;
  filterLabel?: string;
}

/**
 * Generates and downloads a transaction history archive in PDF format
 */
export function exportTransactionHistoryPDF(data: TransactionHistoryReportData): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalOmset = data.transactions.reduce((sum, tx) => sum + tx.total, 0);
  const totalItemsSold = data.transactions.reduce(
    (sum, tx) => sum + tx.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );
  const totalDiscounts = data.transactions.reduce((sum, tx) => sum + (tx.discount || 0), 0);

  // --- BRAND HEADER ---
  doc.setFillColor(249, 115, 22); // Orange 500
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('KASIRKU - ARSIP RIWAYAT TRANSAKSI PENJUALAN', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Rekapitulasi Faktur Penjualan Kasir POS, Pembayaran & Arsip Transaksi Toko', 14, 17);
  doc.text(`Kriteria Filter: ${data.filterLabel || 'Semua Data Transaksi'}`, 14, 22);

  doc.text(`Waktu Unduh: ${currentDateStr}`, pageWidth - 14, 11, { align: 'right' });
  doc.text(`Petugas Cetak: ${data.printedBy} (${data.printedByRole})`, pageWidth - 14, 16, { align: 'right' });
  doc.text(`Total Arsip: ${data.transactions.length} Transaksi`, pageWidth - 14, 21, { align: 'right' });

  // --- SUMMARY STAT BAR ---
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 30, pageWidth - 28, 14, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, 30, pageWidth - 28, 14, 'S');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Transaksi: ${data.transactions.length} Faktur`, 18, 38);
  doc.text(`Total Item Terjual: ${totalItemsSold} Unit`, 85, 38);
  doc.text(`Total Potongan Diskon: ${formatRupiah(totalDiscounts)}`, 160, 38);
  doc.text(`Total Omset Faktur: ${formatRupiah(totalOmset)}`, 235, 38);

  // --- TRANSACTION TABLE ---
  const rows = data.transactions.map((tx, idx) => {
    const itemsSummary = tx.items
      .map((item) => `${item.name} (${item.quantity}x)`)
      .slice(0, 3)
      .join(', ');
    const extraCount = tx.items.length > 3 ? ` +${tx.items.length - 3} lainnya` : '';

    return [
      String(idx + 1),
      tx.invoiceNumber,
      formatDate(tx.createdAt),
      tx.cashierName,
      `${tx.customerName} (${tx.customerType.toUpperCase()})`,
      tx.paymentMethod.toUpperCase(),
      itemsSummary + extraCount,
      formatRupiah(tx.subtotal),
      tx.discount > 0 ? formatRupiah(tx.discount) : '-',
      formatRupiah(tx.total),
      formatRupiah(tx.amountPaid),
      tx.change > 0 ? formatRupiah(tx.change) : '-',
    ];
  });

  autoTable(doc, {
    startY: 48,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 24 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 48 },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 18, halign: 'right' },
      9: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      10: { cellWidth: 22, halign: 'right' },
      11: { cellWidth: 18, halign: 'right' },
    },
    head: [
      [
        'No',
        'No. Faktur',
        'Tanggal & Waktu',
        'Kasir',
        'Pelanggan',
        'Metode',
        'Rincian Barang',
        'Subtotal',
        'Diskon',
        'Total Akhir',
        'Bayar',
        'Kembali',
      ],
    ],
    body: rows,
    margin: { left: 14, right: 14 },
  });

  // --- FOOTER AND PAGE NUMBERING ---
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `KasirKu POS | Dokumen Arsip Riwayat Transaksi Penjualan | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  const cleanDate = new Date().toISOString().slice(0, 10);
  doc.save(`Riwayat_Transaksi_Toko_Almas_${cleanDate}.pdf`);
}

export interface CashFlowReportData {
  cashFlows: CashFlow[];
  totalIn: number;
  totalOut: number;
  netBalance: number;
  printedBy: string;
  printedByRole: string;
}

/**
 * Generates and downloads a cash flow archive in PDF format
 */
export function exportCashFlowPDF(data: CashFlowReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // --- BRAND HEADER ---
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('KASIRKU - ARSIP BUKU ARUS KAS (CASH FLOW)', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Pencatatan Biaya Operasional Toko, Beban Kasir & Pemasukan Kas Lainnya', 14, 17);
  doc.text(`Waktu Unduh: ${currentDateStr} | Petugas: ${data.printedBy} (${data.printedByRole})`, 14, 22);

  // --- SUMMARY KPI CARDS ---
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 30, pageWidth - 28, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 30, pageWidth - 28, 14, 'S');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Kas Masuk: ${formatRupiah(data.totalIn)}`, 18, 38);
  doc.text(`Total Kas Keluar: ${formatRupiah(data.totalOut)}`, 80, 38);
  doc.text(`Saldo Kas Bersih: ${formatRupiah(data.netBalance)}`, 142, 38);

  const rows = data.cashFlows.map((cf, idx) => [
    String(idx + 1),
    formatDate(cf.createdAt),
    cf.type === 'income' ? 'KAS MASUK' : 'KAS KELUAR',
    cf.category,
    cf.description,
    formatRupiah(cf.amount),
    cf.cashierName || '-',
  ]);

  autoTable(doc, {
    startY: 48,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    head: [['No', 'Waktu', 'Jenis', 'Kategori', 'Keterangan', 'Nominal', 'Pencatat']],
    body: rows,
    margin: { left: 14, right: 14 },
  });

  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `KasirKu POS | Arsip Buku Arus Kas Toko | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  const cleanDate = new Date().toISOString().slice(0, 10);
  doc.save(`Arus_Kas_Toko_Almas_${cleanDate}.pdf`);
}

/**
 * Generates and downloads a sheet of printable barcode labels in PDF format.
 */
export function exportBarcodeLabelsPDF(options: {
  items: Array<{ product: Product; count: number }>;
  storeName?: string;
  includePrice?: boolean;
  includeSku?: boolean;
}): void {
  const {
    items,
    storeName = 'KASIRKU',
    includePrice = true,
    includeSku = true,
  } = options;

  // Flatten items by requested count
  const allLabels: Product[] = [];
  items.forEach((item) => {
    for (let c = 0; c < Math.max(1, item.count); c++) {
      allLabels.push(item.product);
    }
  });

  if (allLabels.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 10;
  const marginY = 12;

  // Standard 3 columns x 8 rows = 24 labels per A4 page
  const cols = 3;
  const rows = 8;
  const labelsPerPage = cols * rows;
  const labelWidth = (pageWidth - marginX * 2 - (cols - 1) * 4) / cols; // ~60.6 mm
  const labelHeight = (pageHeight - marginY * 2 - (rows - 1) * 3) / rows; // ~31.8 mm
  const gapX = 4;
  const gapY = 3;

  allLabels.forEach((product, index) => {
    const pageIndex = Math.floor(index / labelsPerPage);
    if (index > 0 && index % labelsPerPage === 0) {
      doc.addPage();
    }

    const posOnPage = index % labelsPerPage;
    const col = posOnPage % cols;
    const row = Math.floor(posOnPage / cols);

    const x = marginX + col * (labelWidth + gapX);
    const y = marginY + row * (labelHeight + gapY);

    // Label border outline (rounded box)
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, labelWidth, labelHeight, 2, 2, 'D');

    // Store Name Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(249, 115, 22); // orange
    doc.text(storeName, x + labelWidth / 2, y + 4.5, { align: 'center' });

    // Product Name (truncated if long)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42); // slate-900
    const cleanName =
      product.name.length > 28 ? product.name.slice(0, 26) + '...' : product.name;
    doc.text(cleanName, x + labelWidth / 2, y + 8, { align: 'center' });

    // Barcode Bars (Code 128 pseudo-pattern or vector bars)
    const barcodeCode = product.barcode || product.sku;
    const barStartY = y + 9.5;
    const barHeight = 9.5;
    const barAreaWidth = labelWidth - 8;
    const barStartX = x + 4;

    // Background white behind barcode
    doc.setFillColor(255, 255, 255);
    doc.rect(barStartX, barStartY, barAreaWidth, barHeight, 'F');

    // Pseudo-random deterministic stripes based on barcode string character codes
    // to render high-contrast vector bars in PDF
    doc.setFillColor(0, 0, 0);
    let curX = barStartX + 2;
    const maxWidth = barStartX + barAreaWidth - 2;
    for (let charIdx = 0; charIdx < barcodeCode.length && curX < maxWidth; charIdx++) {
      const charVal = barcodeCode.charCodeAt(charIdx);
      const w1 = ((charVal % 3) + 1) * 0.35;
      const space = (((charVal >> 2) % 3) + 1) * 0.35;
      const w2 = (((charVal >> 4) % 2) + 1) * 0.35;

      if (curX + w1 < maxWidth) doc.rect(curX, barStartY, w1, barHeight, 'F');
      curX += w1 + space;
      if (curX + w2 < maxWidth) doc.rect(curX, barStartY, w2, barHeight, 'F');
      curX += w2 + 0.35;
    }

    // Barcode Text underneath bars
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(barcodeCode, x + labelWidth / 2, barStartY + barHeight + 2.8, { align: 'center' });

    // Bottom: Price & SKU
    if (includePrice) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(225, 29, 72); // rose/red
      doc.text(formatRupiah(product.price), x + labelWidth / 2, y + labelHeight - 2, {
        align: 'center',
      });
    }

    if (includeSku) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      doc.text(product.sku, x + 3, y + labelHeight - 2);
    }
  });

  doc.save(`Barcode_Label_Toko_Almas_${Date.now()}.pdf`);
}

