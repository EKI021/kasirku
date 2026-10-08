import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from './ProductCard';
import { CartPanel } from './CartPanel';
import {
  Search,
  Filter,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Barcode,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  X,
} from 'lucide-react';
import { formatRupiah } from '../../utils/currency';
import { Product } from '../../types';

interface PosViewProps {
  onOpenPaymentModal: () => void;
  onOpenNewProduct: () => void;
  onFastPayAndPrint: () => void;
  onSaveDraft: () => void;
}

export const PosView: React.FC<PosViewProps> = ({
  onOpenPaymentModal,
  onOpenNewProduct,
  onFastPayAndPrint,
  onSaveDraft,
}) => {
  const {
    products,
    cart,
    cartGrandTotal,
    addToCart,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories: storeCategories,
    isPaymentModalOpen,
    isReceiptModalOpen,
    barcodeScannerMode,
    setBarcodeScannerMode,
    triggerFocusScannerInput,
    barcodeScannerAudio,
    setBarcodeScannerAudio,
    playScannerBeep,
  } = useStore();

  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Toggle Mode Handler
  const toggleScannerMode = () => {
    setBarcodeScannerMode(!barcodeScannerMode);
    if (!barcodeScannerMode) {
      triggerFocusScannerInput(); // Focus when enabling
    }
  };

  // USB & Bluetooth Barcode Scanner Hardware Auto-Detection
  const scannerBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Floating notification state for hardware scan events
  const [scanNotification, setScanNotification] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
    code: string;
    product?: Product;
  } | null>(null);

  // Execute scan: identify product and add directly to cart without manual clicks!
  const executeAutoScan = (scannedCode: string): boolean => {
    const clean = scannedCode.trim();
    if (!clean) return false;

    // Search product by barcode or SKU
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === clean.toLowerCase()) ||
        p.sku.toLowerCase() === clean.toLowerCase() ||
        p.name.toLowerCase() === clean.toLowerCase()
    );

    if (found) {
      if (found.stock <= 0) {
        if (barcodeScannerAudio) playScannerBeep('error');
        setScanNotification({
          type: 'error',
          title: 'Stok Barang Habis',
          message: `Stok "${found.name}" habis (0 ${found.unit}). Tidak dapat ditambahkan ke kasir.`,
          code: clean,
          product: found,
        });
        setTimeout(() => setScanNotification(null), 3500);
        return false;
      }

      // 1. Tambah langsung ke keranjang kasir
      addToCart(found);

      // 2. Mainkan suara beep scanner kasir
      if (barcodeScannerAudio) {
        playScannerBeep('success');
      }

      // 3. Tampilkan notifikasi visual pemindaian otomatis berhasil
      setScanNotification({
        type: 'success',
        title: 'Produk Terpindai',
        message: `${found.name} (${formatRupiah(found.price)}) otomatis ditambahkan ke keranjang (+1).`,
        code: clean,
        product: found,
      });

      // 4. Bersihkan query pencarian jika ada
      setSearchQuery('');

      setTimeout(() => setScanNotification(null), 3000);
      return true;
    } else {
      if (barcodeScannerAudio) playScannerBeep('error');
      setScanNotification({
        type: 'error',
        title: 'Barcode Tidak Ditemukan',
        message: `Kode "${clean}" tidak terdaftar di katalog produk KasirKu.`,
        code: clean,
      });
      setTimeout(() => setScanNotification(null), 3500);
      return false;
    }
  };

  // Hardware Scanner Global Listener (Keyboard Wedge Buffer)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika menekan tombol kombinasi (Ctrl, Alt, Meta)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Jangan cegat pemindaian jika modal pembayaran atau struk sedang aktif
      if (isPaymentModalOpen || isReceiptModalOpen) return;

      const now = performance.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Tombol ENTER adalah terminator standar mayoritas scanner barcode USB / Bluetooth
      if (e.key === 'Enter') {
        if (scannerBufferRef.current.length >= 3) {
          const scanned = scannerBufferRef.current.trim();
          const handled = executeAutoScan(scanned);
          if (handled) {
            e.preventDefault();
            e.stopPropagation();
            if (isInput && target instanceof HTMLInputElement) {
              target.value = '';
              target.blur();
            }
          }
        }
        scannerBufferRef.current = '';
        return;
      }

      // Karakter tunggal (angka, huruf, simbol seperti tanda hubung)
      if (e.key.length === 1) {
        // Kecepatan scanner hardware USB/Bluetooth adalah 5ms - 35ms per karakter.
        // Jika jeda pengetikan lebih dari 65ms pada kolom input teks, ini kemungkinan ketikan manual manusia.
        if (isInput && timeDiff > 65) {
          scannerBufferRef.current = e.key;
        } else {
          if (!isInput && timeDiff > 95) {
            scannerBufferRef.current = '';
          }
          scannerBufferRef.current += e.key;
        }

        // Fallback debounce untuk scanner Bluetooth yang tidak mengirimkan akhiran Enter
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
        }
        fallbackTimeoutRef.current = setTimeout(() => {
          if (scannerBufferRef.current.length >= 4) {
            const candidate = scannerBufferRef.current.trim();
            const matched = products.find(
              (p) =>
                (p.barcode && p.barcode.toLowerCase() === candidate.toLowerCase()) ||
                p.sku.toLowerCase() === candidate.toLowerCase()
            );
            if (matched) {
              executeAutoScan(candidate);
              scannerBufferRef.current = '';
            }
          }
          scannerBufferRef.current = '';
        }, 75);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
    };
  }, [products, isPaymentModalOpen, isReceiptModalOpen, barcodeScannerAudio]);

  const categoryList = useMemo(() => {
    const fromProducts = products.map((p) => p.category);
    const fromMaster = storeCategories.map((c) => c.name);
    const combined = Array.from(new Set([...fromMaster, ...fromProducts])).filter(Boolean);
    return ['Semua', ...combined];
  }, [products, storeCategories]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <button
        onClick={toggleScannerMode}
        className={`fixed top-20 right-4 z-40 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${
          barcodeScannerMode
            ? 'bg-orange-500 text-white'
            : 'bg-slate-200 text-slate-700'
        }`}
      >
        <Barcode className="w-4 h-4" />
        {barcodeScannerMode ? 'Barcode Mode' : 'Manual Mode'}
      </button>

      {/* Floating Scan Feedback Banner */}
      {scanNotification && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-white flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 border max-w-md w-full mx-auto bg-slate-900/95 border-slate-700">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-md ${
              scanNotification.type === 'success'
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-rose-500 text-white shadow-rose-500/30'
            }`}
          >
            {scanNotification.type === 'success' ? (
              <Barcode className="w-5 h-5 animate-pulse" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider ${
                  scanNotification.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {scanNotification.title}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({scanNotification.code})
              </span>
            </div>
            {scanNotification.product ? (
              <div>
                <p className="text-xs sm:text-sm font-bold text-white truncate leading-snug">
                  {scanNotification.product.name}
                </p>
                <p className="text-[11px] font-mono font-bold text-emerald-300">
                  {formatRupiah(scanNotification.product.price)}{' '}
                  <span className="text-slate-300 font-normal">• +1 ke keranjang</span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-300 leading-snug">
                {scanNotification.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setScanNotification(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Center Main Product Grid Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/60">
        {/* Hardware Barcode Scanner Status Strip */}
        <div className="px-3 sm:px-6 py-2 bg-slate-900 text-white flex items-center justify-between gap-3 text-xs shrink-0 select-none border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <Barcode className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-xs text-white truncate">
                Scanner Barcode USB / Bluetooth
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30 shrink-0">
                Aktif &amp; Terhubung
              </span>
              <span className="hidden md:inline text-[11px] text-slate-400">
                — Tembak barcode pada barang, produk otomatis masuk ke keranjang kasir
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Audio Beep Toggle */}
            <button
              type="button"
              onClick={() => setBarcodeScannerAudio(!barcodeScannerAudio)}
              title={
                barcodeScannerAudio
                  ? 'Suara scanner aktif. Klik untuk membisukan.'
                  : 'Suara scanner dibisukan. Klik untuk mengaktifkan.'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                barcodeScannerAudio
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700'
                  : 'bg-slate-800/60 hover:bg-slate-700 text-slate-400'
              }`}
            >
              {barcodeScannerAudio ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Suara Beep: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Suara Beep: OFF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3 overflow-x-auto shrink-0 select-none no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            {categoryList.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/30'
                      : 'bg-slate-100/90 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredProducts.length}</strong> produk
            </span>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 pb-36 md:pb-6">
          {products.length === 0 ? (
            <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-2xs">
                <ShoppingBag className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Katalog KasirKu Belum Berisi Produk</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Silakan input data produk pertama Anda di katalog untuk mulai bertransaksi kasir.
              </p>
              <button
                onClick={onOpenNewProduct}
                className="mt-4 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm shadow-orange-500/30 transition-all"
              >
                <span>+ Input Barang Baru Pertama</span>
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Produk Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Tidak ada barang dengan kata kunci "{searchQuery}" pada kategori {selectedCategory}.
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('Semua');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition-colors"
                >
                  Reset Filter
                </button>
                <button
                  onClick={onOpenNewProduct}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
                >
                  + Tambah Produk Baru
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    cartQuantity={inCart?.quantity}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Cart Bar on Mobile & Tablet */}
        {cart.length > 0 && !isMobileCartOpen && (
          <div className="md:hidden fixed bottom-16 sm:bottom-18 left-0 right-0 z-20 px-3 sm:px-4 py-1.5 pointer-events-none">
            <div className="pointer-events-auto max-w-md mx-auto bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-orange-500/30">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 font-medium truncate">Total Belanja ({cart.length} item)</p>
                  <p className="text-sm font-black text-white font-mono truncate">{formatRupiah(cartGrandTotal)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold shrink-0 transition-all shadow-md shadow-orange-500/30 flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Buka Keranjang</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sticky Cart Panel */}
      <CartPanel
        onOpenPaymentModal={onOpenPaymentModal}
        onFastPayAndPrint={onFastPayAndPrint}
        onSaveDraft={onSaveDraft}
        isOpenOnMobile={isMobileCartOpen}
        onCloseMobile={() => setIsMobileCartOpen(false)}
      />
    </div>
  );
};
