import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  ClipboardList,
  Clock,
  Store,
  Bell,
  RefreshCw,
  Barcode,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface HeaderProps {
  onOpenNewProduct: () => void;
  onOpenDrafts: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewProduct,
  onOpenDrafts,
  onToggleMobileMenu,
}) => {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    products,
    syncStatus,
    barcodeScannerMode,
    setBarcodeScannerMode,
    triggerBarcodeScan,
    scanFeedback,
    scannerFocusRequest,
  } = useStore();

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scannerFocusRequest > 0) {
      searchInputRef.current?.focus();
    }
  }, [scannerFocusRequest]);

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'pos':
        return { main: 'Point of Sale (POS)', sub: 'Kasir Transaksi Cepat' };
      case 'stock_opname':
        return { main: 'Stok Opname', sub: 'Audit & Penyesuaian Fisik Inventaris' };
      case 'products':
        return { main: 'Katalog & Manajemen Stok', sub: 'Master Data Barang Toko' };
      case 'analytics':
        return { main: 'Analisis Keuangan', sub: 'Pemasukan, Laba Kotor, HPP & Cashflow' };
      case 'transactions':
        return { main: 'Riwayat Transaksi', sub: 'Faktur & Struk Kasir' };
      case 'cash_flow':
        return { main: 'Arus Kas Toko', sub: 'Pencatatan Kas Masuk & Biaya Operasional' };
      case 'evidence_logs':
        return { main: 'Log Evidence Kegiatan', sub: 'Audit Trail Forensik & Rekam Jejak (Admin Only)' };
      case 'settings':
        return { main: 'Pengaturan Toko & DB', sub: 'Konfigurasi Firebase & Backup' };
      default:
        return { main: 'KasirKu', sub: 'Sistem Kasir' };
    }
  };

  const breadcrumb = getBreadcrumbTitle();
  const lowStockItems = products.filter((p) => p.stock <= p.minStock);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 800);
  };

  // Handle Search Input Change & Auto-Submit on Barcode Scanner detection
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);

    if (barcodeScannerMode && val.trim().length >= 4) {
      // Check if value is exact barcode or SKU
      const clean = val.trim();
      const match = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === clean.toLowerCase()) ||
          p.sku.toLowerCase() === clean.toLowerCase()
      );
      if (match) {
        triggerBarcodeScan(clean);
      }
    }
  };

  // Handle Enter key for Barcode Scanner auto-submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        if (barcodeScannerMode) {
          triggerBarcodeScan(searchQuery);
        } else {
          // If scanner mode is off, enter also attempts to scan if it matches barcode/sku
          const match = products.find(
            (p) =>
              (p.barcode && p.barcode.toLowerCase() === searchQuery.trim().toLowerCase()) ||
              p.sku.toLowerCase() === searchQuery.trim().toLowerCase()
          );
          if (match) {
            triggerBarcodeScan(searchQuery);
          }
        }
      }
    }
  };

  return (
    <header className="relative h-16 bg-white border-b border-slate-200 px-3.5 sm:px-6 flex items-center justify-between shrink-0">
      {/* Title / Breadcrumbs + Mobile Hamburger */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="Buka Menu Navigasi"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
            {breadcrumb.main}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">{breadcrumb.sub}</p>
        </div>
      </div>

      {/* Center Search Input with Scanner Auto-submit */}
      <div className="relative w-96 max-w-md hidden md:block">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={
            barcodeScannerMode
              ? 'Scan barcode (Auto-submit aktif) atau cari barang...'
              : 'Cari barang atau scan barcode (Ctrl+/)...'
          }
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full text-xs text-slate-800 pl-9 pr-24 py-2 rounded-xl border transition-all ${
            barcodeScannerMode
              ? 'bg-orange-50/40 border-orange-300 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20'
              : 'bg-slate-100/80 hover:bg-slate-100 focus:bg-white border-transparent focus:border-orange-500 focus:outline-none'
          }`}
        />

        {/* Barcode Mode Quick Pill in Search Bar */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setBarcodeScannerMode(!barcodeScannerMode)}
            title={
              barcodeScannerMode
                ? 'Mode Barcode Scanner Aktif (Auto-submit saat di-scan). Klik untuk mematikan.'
                : 'Mode Barcode Scanner Nonaktif. Klik untuk mengaktifkan.'
            }
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
              barcodeScannerMode
                ? 'bg-orange-500 text-white shadow-2xs'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            <Barcode className="w-3 h-3" />
            <span className="hidden xl:inline">{barcodeScannerMode ? 'SCAN ON' : 'SCAN OFF'}</span>
          </button>
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            /
          </kbd>
        </div>
      </div>

      {/* Right Action Buttons matching reference image */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Mobile Search Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          title="Cari Produk & Barcode"
          aria-label="Cari"
        >
          {isMobileSearchOpen ? (
            <X className="w-4 h-4 text-orange-600" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>

        {/* Quick Sync Button */}
        <button
          onClick={handleManualSync}
          title="Sinkronisasi Data Firebase"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-orange-500' : ''}`} />
        </button>

        {/* Low Stock Warning Pill */}
        {lowStockItems.length > 0 && (
          <button
            onClick={() => setActiveTab('stock_opname')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lowStockItems.length} Menipis</span>
          </button>
        )}

        {/* Draft List Button */}
        <button
          onClick={onOpenDrafts}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
          <span>Daftar Draft</span>
        </button>

        {/* New Product Button */}
        <button
          onClick={onOpenNewProduct}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs shadow-orange-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Produk</span>
        </button>

        {/* Clock Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono font-medium text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime || '08:00:00'}</span>
        </div>
      </div>

      {/* Mobile Expandable Search Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 z-40 bg-white border-b border-slate-200 px-3.5 py-2.5 shadow-md flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={barcodeScannerMode ? 'Scan barcode (Auto-submit aktif)...' : 'Cari produk / ketik barcode...'}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full text-xs text-slate-800 pl-9 pr-8 py-2 rounded-xl bg-slate-100 border border-transparent focus:border-orange-500 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setBarcodeScannerMode(!barcodeScannerMode)}
            className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-[10px] font-bold transition-all shrink-0 ${
              barcodeScannerMode
                ? 'bg-orange-500 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>{barcodeScannerMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      )}

      {/* Floating Scanner Auto-submit Toast Notification */}
      {scanFeedback && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 -bottom-9 z-40 px-4 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            scanFeedback.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-900 text-rose-200 border border-rose-500/30'
          }`}
        >
          {scanFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{scanFeedback.text}</span>
        </div>
      )}
    </header>
  );
};
