import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Layers,
  Settings2,
  ScanLine,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Tag,
  Copy,
} from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../utils/currency';
import { BarcodeSvg } from './BarcodeSvg';
import { jsPDF } from 'jspdf';

export type LabelPaperFormat = 'thermal-1col' | 'thermal-2col' | 'a4-3x10' | 'a4-2x7';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
  onNavigateToPos?: () => void;
}

interface PrintItem {
  product: Product;
  quantity: number;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  initialProduct,
  onNavigateToPos,
}) => {
  const { products, triggerBarcodeScan, setActiveTab } = useStore();

  // Print Queue items
  const [printQueue, setPrintQueue] = useState<PrintItem[]>([]);
  
  // Customization settings
  const [storeName, setStoreName] = useState<string>('KASIRKU');
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showSku, setShowSku] = useState<boolean>(true);
  const [showUnit, setShowUnit] = useState<boolean>(true);
  const [barcodeSize, setBarcodeSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [paperFormat, setPaperFormat] = useState<LabelPaperFormat>('thermal-1col');
  const [searchCatalog, setSearchCatalog] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Semua');

  // Scanner Direct Scan Feedback
  const [scanTestResult, setScanTestResult] = useState<{
    success: boolean;
    productName: string;
    price: number;
    barcode: string;
  } | null>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Initialize or update print queue when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        // Single product mode: set default quantity (at least 1, or matching stock if > 0)
        const initialQty = initialProduct.stock > 0 ? Math.min(initialProduct.stock, 10) : 1;
        setPrintQueue([{ product: initialProduct, quantity: initialQty }]);
      } else {
        // Multi product mode: default to ALL products with quantity 1
        const allProducts = products.map((p) => ({
          product: p,
          quantity: 1,
        }));
        setPrintQueue(allProducts);
      }
      setScanTestResult(null);
    }
  }, [isOpen, initialProduct, products]);

  // Categories for catalog filter
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['Semua', ...Array.from(set)];
  }, [products]);

  // Filtered products available to add into print queue
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategoryFilter === 'Semua' || p.category === selectedCategoryFilter;
      const matchSearch =
        searchCatalog.trim() === '' ||
        p.name.toLowerCase().includes(searchCatalog.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchCatalog.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchCatalog));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategoryFilter, searchCatalog]);

  // Total stickers to print
  const totalStickersCount = useMemo(() => {
    return printQueue.reduce((sum, item) => sum + Math.max(1, item.quantity), 0);
  }, [printQueue]);

  // Flattened stickers array for rendering
  const flattenedStickers = useMemo(() => {
    const list: Product[] = [];
    printQueue.forEach((item) => {
      const count = Math.max(1, item.quantity);
      for (let i = 0; i < count; i++) {
        list.push(item.product);
      }
    });
    return list;
  }, [printQueue]);

  if (!isOpen) return null;

  // Add a product to the print queue
  const addProductToQueue = (prod: Product) => {
    setPrintQueue((prev) => {
      const existing = prev.find((item) => item.product.id === prod.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const defaultQty = prod.stock > 0 ? Math.min(prod.stock, 5) : 1;
      return [...prev, { product: prod, quantity: defaultQty }];
    });
  };

  // Remove a product from print queue
  const removeProductFromQueue = (productId: string) => {
    setPrintQueue((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Adjust quantity
  const updateQuantity = (productId: string, newQty: number) => {
    const clamped = Math.max(1, Math.min(500, newQty));
    setPrintQueue((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: clamped } : item
      )
    );
  };

  // Match all quantities to current stock in system
  const syncWithStockQuantities = () => {
    setPrintQueue((prev) =>
      prev.map((item) => ({
        ...item,
        quantity: Math.max(1, item.product.stock),
      }))
    );
  };

  // Add all catalog products to queue
  const addAllCatalogToQueue = () => {
    const all = products.map((p) => ({
      product: p,
      quantity: p.stock > 0 ? Math.min(p.stock, 5) : 1,
    }));
    setPrintQueue(all);
  };

  // Trigger test scan into cashier POS
  const handleTestScan = (prod: Product) => {
    const code = prod.barcode || prod.sku;
    const scanSuccess = triggerBarcodeScan(code);
    setScanTestResult({
      success: scanSuccess,
      productName: prod.name,
      price: prod.price,
      barcode: code,
    });
  };

  // Trigger Browser Print Dialog
  const handleBrowserPrint = () => {
    window.print();
  };

  // Export to PDF using jsPDF
  const handleDownloadPdf = async () => {
    if (flattenedStickers.length === 0) return;
    setIsGeneratingPdf(true);

    try {
      const isThermal = paperFormat === 'thermal-1col' || paperFormat === 'thermal-2col';
      const doc = new jsPDF({
        orientation: isThermal ? 'portrait' : 'portrait',
        unit: 'mm',
        format: isThermal ? [50, 35] : 'a4',
      });

      if (isThermal && paperFormat === 'thermal-1col') {
        // Individual thermal labels: 50mm x 35mm per page
        flattenedStickers.forEach((prod, idx) => {
          if (idx > 0) doc.addPage([50, 35]);

          const code = prod.barcode || prod.sku;
          let currentY = 5;

          if (showStoreName && storeName) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(storeName.toUpperCase(), 25, currentY, { align: 'center' });
            currentY += 4;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          const splitName = doc.splitTextToSize(prod.name, 44);
          doc.text(splitName.slice(0, 2), 25, currentY, { align: 'center' });
          currentY += splitName.slice(0, 2).length * 3.5;

          if (showPrice) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(formatRupiah(prod.price), 25, currentY + 1, { align: 'center' });
            currentY += 4.5;
          }

          // Barcode representation text
          doc.setFont('courier', 'bold');
          doc.setFontSize(9);
          doc.text(`* ${code} *`, 25, currentY + 4, { align: 'center' });

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.text(code, 25, currentY + 8, { align: 'center' });

          if (showSku) {
            doc.setFontSize(6);
            doc.text(`SKU: ${prod.sku} | ${prod.unit}`, 25, 33, { align: 'center' });
          }
        });
      } else {
        // A4 Paper format: 3 columns x 10 rows or 2 columns x 7 rows
        const cols = paperFormat === 'a4-3x10' ? 3 : 2;
        const rows = paperFormat === 'a4-3x10' ? 10 : 7;
        const perPage = cols * rows;

        const cellWidth = paperFormat === 'a4-3x10' ? 63 : 95;
        const cellHeight = paperFormat === 'a4-3x10' ? 27 : 38;
        const startX = 10;
        const startY = 12;

        flattenedStickers.forEach((prod, idx) => {
          const pageIndex = Math.floor(idx / perPage);
          const indexInPage = idx % perPage;

          if (indexInPage === 0 && pageIndex > 0) {
            doc.addPage('a4', 'portrait');
          }

          const col = indexInPage % cols;
          const row = Math.floor(indexInPage / cols);
          const x = startX + col * cellWidth;
          const y = startY + row * cellHeight;

          // Draw label bounding outline guide
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.rect(x, y, cellWidth - 2, cellHeight - 2);

          const centerX = x + (cellWidth - 2) / 2;
          let textY = y + 4.5;

          if (showStoreName && storeName) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.text(storeName.toUpperCase(), centerX, textY, { align: 'center' });
            textY += 3.5;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          const nameLines = doc.splitTextToSize(prod.name, cellWidth - 6);
          doc.text(nameLines.slice(0, 1), centerX, textY, { align: 'center' });
          textY += 3.8;

          if (showPrice) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.text(formatRupiah(prod.price), centerX, textY, { align: 'center' });
            textY += 4.5;
          }

          const code = prod.barcode || prod.sku;
          doc.setFont('courier', 'bold');
          doc.setFontSize(8);
          doc.text(`* ${code} *`, centerX, textY + 2, { align: 'center' });

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.text(code, centerX, textY + 5.5, { align: 'center' });

          if (showSku) {
            doc.setFontSize(6);
            doc.text(`SKU: ${prod.sku}`, centerX, y + cellHeight - 3.5, { align: 'center' });
          }
        });
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      doc.save(`Barcode_Labels_TokoAlmas_${dateStr}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const barcodeDimensions = {
    sm: { width: 1.1, height: 28, fontSize: 10 },
    md: { width: 1.35, height: 36, fontSize: 11 },
    lg: { width: 1.6, height: 44, fontSize: 12 },
  }[barcodeSize];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Modal Dialog Box */}
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Cetak Kode Batang &amp; Label Barcode Produk
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/30 border border-orange-400/40 text-orange-200 text-[11px] font-bold">
                  {totalStickersCount} Label Siap Cetak
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Tempelkan stiker barcode pada barang toko agar harga otomatis terbaca saat proses transaksi kasir.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Notification Alert Banner */}
        {scanTestResult && (
          <div
            className={`px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs font-semibold ${
              scanTestResult.success
                ? 'bg-emerald-500 text-white animate-in slide-in-from-top-2'
                : 'bg-rose-500 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {scanTestResult.success
                  ? `Produk Terpindai: "${scanTestResult.productName}" (${scanTestResult.barcode}) berhasil terbaca dengan harga ${formatRupiah(scanTestResult.price)} dan masuk ke keranjang kasir.`
                  : `Pemindaian Gagal: Stok habis atau barcode tidak terdaftar.`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onNavigateToPos ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToPos();
                  }}
                  className="px-3 py-1 bg-white text-emerald-800 rounded-lg font-bold text-[11px] hover:bg-emerald-50 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Lihat di Kasir</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('pos');
                    onClose();
                  }}
                  className="px-3 py-1 bg-white text-emerald-800 rounded-lg font-bold text-[11px] hover:bg-emerald-50 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Buka Menu Kasir</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setScanTestResult(null)}
                className="p-1 hover:bg-black/10 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Body: 2 Columns (Left: Settings & Product Queue, Right: Live Preview) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Settings and Product Queue (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Format Layout Kertas Selector */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-orange-600" />
                  <span>Format Ukuran Kertas / Printer</span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Pilih jenis kertas</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperFormat('thermal-1col')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    paperFormat === 'thermal-1col'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">Thermal Roll (1 Kolom)</p>
                  <p className={`text-[10px] mt-0.5 ${paperFormat === 'thermal-1col' ? 'text-orange-100' : 'text-slate-400'}`}>
                    40x30 / 50x30mm stiker
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperFormat('thermal-2col')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    paperFormat === 'thermal-2col'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">Thermal Roll (2 Kolom)</p>
                  <p className={`text-[10px] mt-0.5 ${paperFormat === 'thermal-2col' ? 'text-orange-100' : 'text-slate-400'}`}>
                    70x30 / 80mm roll ganda
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperFormat('a4-3x10')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    paperFormat === 'a4-3x10'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">Kertas A4 (3x10)</p>
                  <p className={`text-[10px] mt-0.5 ${paperFormat === 'a4-3x10' ? 'text-orange-100' : 'text-slate-400'}`}>
                    30 Label / Lembar Stiker
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperFormat('a4-2x7')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    paperFormat === 'a4-2x7'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">Kertas A4 (2x7)</p>
                  <p className={`text-[10px] mt-0.5 ${paperFormat === 'a4-2x7' ? 'text-orange-100' : 'text-slate-400'}`}>
                    14 Label Sedang / Lembar
                  </p>
                </button>
              </div>

              {/* Label Content Options */}
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Elemen Teks Pada Stiker</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showStoreName}
                      onChange={(e) => setShowStoreName(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-400"
                    />
                    <span>Nama Toko</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none font-bold text-orange-700">
                    <input
                      type="checkbox"
                      checked={showPrice}
                      onChange={(e) => setShowPrice(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-400"
                    />
                    <span>Harga Jual Kasir</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showSku}
                      onChange={(e) => setShowSku(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-400"
                    />
                    <span>Kode SKU</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showUnit}
                      onChange={(e) => setShowUnit(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-400"
                    />
                    <span>Satuan Unit</span>
                  </label>
                </div>

                {showStoreName && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Nama Toko (Header Stiker)"
                      className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Product Queue Management */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-orange-600" />
                    <span>Daftar Barang Siap Cetak ({printQueue.length})</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Atur jumlah lembar stiker untuk setiap barang</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={syncWithStockQuantities}
                    className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                    title="Otomatis samakan jumlah stiker dengan stok barang di sistem"
                  >
                    Samakan dgn Stok
                  </button>
                  <button
                    type="button"
                    onClick={addAllCatalogToQueue}
                    className="px-2.5 py-1 text-[10px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                    title="Masukkan seluruh katalog ke antrean"
                  >
                    Semua Produk
                  </button>
                </div>
              </div>

              {/* Items in Queue */}
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                {printQueue.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs font-medium">Antrean cetak masih kosong.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Pilih barang dari katalog di bawah untuk menambahkan.
                    </p>
                  </div>
                ) : (
                  printQueue.map((item) => (
                    <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-mono text-orange-600 font-bold">{formatRupiah(item.product.price)}</span>
                          <span>•</span>
                          <span>Stok: {item.product.stock} {item.product.unit}</span>
                          <span>•</span>
                          <span className="font-mono">{item.product.barcode || item.product.sku}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-slate-200 text-slate-600"
                            title="Kurang 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                            className="w-10 text-center text-xs font-bold bg-transparent text-slate-800 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-slate-200 text-slate-600"
                            title="Tambah 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeProductFromQueue(item.product.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus dari antrean cetak"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Product from Catalog Dropdown / Quick Picker */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari & tambahkan produk lain..."
                      value={searchCatalog}
                      onChange={(e) => setSearchCatalog(e.target.value)}
                      className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {searchCatalog.trim() && (
                  <div className="max-h-36 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-1 divide-y divide-slate-100">
                    {availableProducts.slice(0, 5).map((p) => {
                      const inQueue = printQueue.find((q) => q.product.id === p.id);
                      return (
                        <div key={p.id} className="p-1.5 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                            <span className="text-[10px] text-slate-500">{formatRupiah(p.price)} • {p.barcode || p.sku}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => addProductToQueue(p)}
                            className="px-2 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold shrink-0"
                          >
                            {inQueue ? `+1 (Total ${inQueue.quantity + 1})` : '+ Tambah'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Sticker Preview (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Live Preview Header */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-slate-800 text-orange-400 rounded-xl">
                  <ScanLine className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Pratinjau Hasil Cetak Stiker</h3>
                  <p className="text-[11px] text-slate-400">
                    Tampilan fisik label barcode yang akan ditempelkan pada barang
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">Ukuran Barcode:</span>
                <div className="flex p-0.5 bg-slate-800 rounded-lg text-xs font-semibold">
                  {(['sm', 'md', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setBarcodeSize(sz)}
                      className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold transition-all ${
                        barcodeSize === sz ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticker Preview Grid (Scrollable) */}
            <div className="flex-1 min-h-[360px] max-h-[460px] overflow-y-auto p-4 bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-inner">
              {flattenedStickers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <Barcode className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Tidak Ada Stiker untuk Ditampilkan</p>
                  <p className="text-xs text-slate-500 mt-1">Pilih minimal 1 barang dari antrean di sebelah kiri.</p>
                </div>
              ) : (
                <div
                  className={`gap-3 ${
                    paperFormat === 'thermal-1col'
                      ? 'grid grid-cols-1 sm:grid-cols-2'
                      : paperFormat === 'thermal-2col'
                      ? 'grid grid-cols-2'
                      : paperFormat === 'a4-3x10'
                      ? 'grid grid-cols-2 sm:grid-cols-3'
                      : 'grid grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {flattenedStickers.map((prod, index) => {
                    const code = prod.barcode || prod.sku;
                    return (
                      <div
                        key={`${prod.id}-${index}`}
                        className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm relative group hover:border-orange-400 transition-all flex flex-col justify-between text-center overflow-hidden"
                      >
                        {/* Top: Store Name Header */}
                        {showStoreName && storeName && (
                          <div className="border-b border-dashed border-slate-200 pb-1 mb-1">
                            <p className="text-[10px] font-black tracking-widest text-slate-800 uppercase">
                              {storeName}
                            </p>
                          </div>
                        )}

                        {/* Product Title */}
                        <div className="my-0.5">
                          <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                            {prod.name}
                          </p>
                        </div>

                        {/* Price Badge (Prominent for Cashier & Customer) */}
                        {showPrice && (
                          <div className="my-1 py-0.5 px-2 bg-orange-50 border border-orange-200 rounded-lg inline-block mx-auto">
                            <span className="text-xs sm:text-sm font-black text-orange-700 font-mono tracking-tight">
                              {formatRupiah(prod.price)}
                            </span>
                          </div>
                        )}

                        {/* SVG Barcode Component */}
                        <div className="my-1 bg-white flex items-center justify-center overflow-hidden">
                          <BarcodeSvg
                            value={code}
                            width={barcodeDimensions.width}
                            height={barcodeDimensions.height}
                            fontSize={barcodeDimensions.fontSize}
                            displayValue={true}
                          />
                        </div>

                        {/* Footer Details: SKU & Unit */}
                        {(showSku || showUnit) && (
                          <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[9px] text-slate-500 font-mono">
                            {showSku && <span>SKU: {prod.sku}</span>}
                            {showSku && showUnit && <span>•</span>}
                            {showUnit && <span>{prod.unit}</span>}
                          </div>
                        )}

                        {/* Direct Scan to Cashier Button */}
                        <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleTestScan(prod)}
                            className="w-full py-1 px-2 rounded-lg bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-slate-600 text-[10px] font-bold flex items-center justify-center gap-1 border border-slate-200 transition-colors"
                            title="Pindai barcode langsung ke transaksi kasir"
                          >
                            <ScanLine className="w-3 h-3" />
                            <span>Pindai ke Kasir</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick helper tip banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
              <span className="p-1 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                💡
              </span>
              <div>
                <strong className="font-bold">Tips Penempelan Stiker &amp; Kasir:</strong>
                <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                  Setelah label dicetak, tempelkan pada kemasan produk di posisi yang mudah terlihat. Saat konsumen membawa barang ke kasir, scanner barcode kasir akan membaca kode barcode ini dan otomatis memasukkan nama beserta harga <strong>{storeName}</strong> ke transaksi tanpa perlu ketik manual.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span>
              Total: <strong>{flattenedStickers.length} label</strong> ({printQueue.length} jenis produk)
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-medium text-slate-500">
              Format: {paperFormat.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              Tutup
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || flattenedStickers.length === 0}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
              title="Unduh dokumen PDF stiker barcode"
            >
              <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce text-orange-500' : ''}`} />
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>

            {/* Print Now Button */}
            <button
              type="button"
              onClick={handleBrowserPrint}
              disabled={flattenedStickers.length === 0}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-orange-500/30 transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang ({totalStickersCount} Label)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Dedicated DOM Container for @media print */}
      <div id="printable-barcode-container" className="hidden">
        <div
          className={`barcode-print-grid ${
            paperFormat === 'thermal-1col'
              ? 'thermal-1col-layout'
              : paperFormat === 'thermal-2col'
              ? 'thermal-2col-layout'
              : paperFormat === 'a4-3x10'
              ? 'a4-3x10-layout'
              : 'a4-2x7-layout'
          }`}
        >
          {flattenedStickers.map((prod, idx) => {
            const code = prod.barcode || prod.sku;
            return (
              <div key={`print-${prod.id}-${idx}`} className="barcode-sticker-item">
                {showStoreName && storeName && (
                  <div className="store-header">{storeName.toUpperCase()}</div>
                )}
                <div className="product-name">{prod.name}</div>
                {showPrice && (
                  <div className="price-tag">{formatRupiah(prod.price)}</div>
                )}
                <div className="barcode-box">
                  <BarcodeSvg
                    value={code}
                    width={barcodeDimensions.width}
                    height={barcodeDimensions.height}
                    fontSize={barcodeDimensions.fontSize}
                    displayValue={true}
                  />
                </div>
                {(showSku || showUnit) && (
                  <div className="sku-footer">
                    {showSku && <span>SKU: {prod.sku}</span>}
                    {showSku && showUnit && <span> • </span>}
                    {showUnit && <span>{prod.unit}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
