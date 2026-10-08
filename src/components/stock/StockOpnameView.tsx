import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  Save,
  RotateCcw,
  FileSpreadsheet,
  Calendar,
  User,
  History,
  Info,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StockOpnameItem, StockOpname } from '../../types';
import { formatRupiah, formatDate } from '../../utils/currency';
import { exportToCSV } from '../../utils/exportUtils';

export const StockOpnameView: React.FC = () => {
  const { products, stockOpnames, saveStockOpname, currentUser } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'new_audit' | 'history'>('new_audit');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDiscrepancyOnly, setFilterDiscrepancyOnly] = useState<boolean>(false);
  const [operatorName, setOperatorName] = useState<string>(currentUser.name);
  const [opnameNotes, setOpnameNotes] = useState<string>('');
  const [applyLiveAdjustment, setApplyLiveAdjustment] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Selected historic opname for modal
  const [selectedHistoryOpname, setSelectedHistoryOpname] = useState<StockOpname | null>(null);

  // Initialize local audit items from current products
  const [auditItems, setAuditItems] = useState<Record<string, { physical: number; reason: StockOpnameItem['reason'] }>>(() => {
    const map: Record<string, { physical: number; reason: StockOpnameItem['reason'] }> = {};
    products.forEach((p) => {
      map[p.id] = { physical: p.stock, reason: 'sesuai' };
    });
    return map;
  });

  // Keep audit items in sync if products length changes
  React.useEffect(() => {
    setAuditItems((prev) => {
      const next = { ...prev };
      products.forEach((p) => {
        if (next[p.id] === undefined) {
          next[p.id] = { physical: p.stock, reason: 'sesuai' };
        }
      });
      return next;
    });
  }, [products]);

  const handlePhysicalChange = (productId: string, value: number) => {
    const val = Math.max(0, value);
    const prod = products.find((p) => p.id === productId);
    const systemStock = prod ? prod.stock : 0;
    const diff = val - systemStock;

    setAuditItems((prev) => ({
      ...prev,
      [productId]: {
        physical: val,
        reason: diff === 0 ? 'sesuai' : prev[productId]?.reason === 'sesuai' ? 'rusak' : prev[productId]?.reason || 'rusak',
      },
    }));
  };

  const handleReasonChange = (productId: string, reason: StockOpnameItem['reason']) => {
    setAuditItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        reason,
      },
    }));
  };

  const resetAllToSystem = () => {
    const next: Record<string, { physical: number; reason: StockOpnameItem['reason'] }> = {};
    products.forEach((p) => {
      next[p.id] = { physical: p.stock, reason: 'sesuai' };
    });
    setAuditItems(next);
  };

  // Compile evaluated items
  const evaluatedItems: StockOpnameItem[] = useMemo(() => {
    return products.map((p) => {
      const audit = auditItems[p.id] || { physical: p.stock, reason: 'sesuai' };
      const physicalStock = audit.physical;
      const difference = physicalStock - p.stock;
      const differenceValue = difference * p.costPrice;

      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        unit: p.unit,
        systemStock: p.stock,
        physicalStock,
        difference,
        costPrice: p.costPrice,
        differenceValue,
        reason: audit.reason,
      };
    });
  }, [products, auditItems]);

  // Filtered for table display
  const displayedItems = useMemo(() => {
    return evaluatedItems.filter((item) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDiscrepancy = filterDiscrepancyOnly ? item.difference !== 0 : true;
      return matchSearch && matchDiscrepancy;
    });
  }, [evaluatedItems, searchQuery, filterDiscrepancyOnly]);

  // Overall statistics
  const totalAudited = evaluatedItems.length;
  const itemsWithDiscrepancy = evaluatedItems.filter((i) => i.difference !== 0);
  const totalDiscrepancyQty = evaluatedItems.reduce((sum, i) => sum + i.difference, 0);
  const totalDiscrepancyValue = evaluatedItems.reduce((sum, i) => sum + i.differenceValue, 0);
  const matchingItemsCount = evaluatedItems.filter((i) => i.difference === 0).length;

  // Handle Submit Opname
  const handleSubmitOpname = async () => {
    if (!operatorName.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const opnameNum = `SO/${new Date().toISOString().slice(0, 7).replace('-', '')}/${String(
        stockOpnames.length + 1
      ).padStart(3, '0')}`;

      await saveStockOpname(
        {
          opnameNumber: opnameNum,
          date: new Date().toISOString(),
          operator: operatorName,
          totalItemsChecked: totalAudited,
          totalDiscrepancyQty,
          totalDiscrepancyValue,
          items: evaluatedItems,
          status: 'completed',
          notes: opnameNotes || 'Sesi Stok Opname KasirKu',
        },
        applyLiveAdjustment
      );

      alert('Stok opname berhasil disimpan dan disinkronkan ke database!');
      setOpnameNotes('');
      setActiveSubTab('history');
    } catch (err) {
      console.error('Error saving stock opname:', err);
      alert('Gagal menyimpan hasil stok opname.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export Opname Table
  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Nama Barang',
      'Satuan',
      'Stok Sistem',
      'Stok Fisik',
      'Selisih (Qty)',
      'HPP (Rp)',
      'Nilai Selisih (Rp)',
      'Alasan/Keterangan',
    ];

    const rows = evaluatedItems.map((item) => [
      item.sku,
      item.productName,
      item.unit,
      item.systemStock,
      item.physicalStock,
      item.difference,
      item.costPrice,
      item.differenceValue,
      item.reason,
    ]);

    exportToCSV(`Stok_Opname_Toko_Almas_${new Date().toISOString().slice(0, 10)}`, [
      headers,
      ...rows,
    ]);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* Top Banner & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Modul Stok Opname &amp; Audit Fisik
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cocokkan stok fisik barang di rak/gudang dengan data sistem. Selisih langsung
            disesuaikan dan tercatat ke Firebase Firestore.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSubTab('new_audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'new_audit'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sesi Audit Aktif
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'history'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Opname ({stockOpnames.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'new_audit' ? (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Total Item Diaudit
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalAudited} SKU</p>
              <span className="text-[11px] text-slate-400 font-medium">
                Semua produk aktif toko
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-emerald-600 uppercase">
                Stok Sesuai (Akurat)
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {matchingItemsCount} SKU
              </p>
              <span className="text-[11px] text-emerald-700 font-medium">
                {totalAudited > 0
                  ? `${Math.round((matchingItemsCount / totalAudited) * 100)}% akurasi inventaris`
                  : '0%'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-amber-600 uppercase">
                Barang Ada Selisih
              </span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {itemsWithDiscrepancy.length} SKU
              </p>
              <span className="text-[11px] text-amber-700 font-medium">
                {totalDiscrepancyQty >= 0 ? `+${totalDiscrepancyQty}` : totalDiscrepancyQty} unit total selisih
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Dampak Finansial Selisih
              </span>
              <p
                className={`text-2xl font-black mt-1 ${
                  totalDiscrepancyValue < 0
                    ? 'text-rose-600'
                    : totalDiscrepancyValue > 0
                    ? 'text-emerald-600'
                    : 'text-slate-900'
                }`}
              >
                {formatRupiah(totalDiscrepancyValue)}
              </p>
              <span className="text-[11px] text-slate-500 font-medium">
                Dihitung berdasarkan HPP barang
              </span>
            </div>
          </div>

          {/* Action and Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter nama barang / SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={filterDiscrepancyOnly}
                  onChange={(e) => setFilterDiscrepancyOnly(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-400"
                />
                <span>Hanya Tampilkan Selisih ({itemsWithDiscrepancy.length})</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAllToSystem}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Samakan ke Sistem</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Barang &amp; SKU</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3 text-right">Stok Sistem</th>
                    <th className="py-3 px-4 text-center">Fisik Aktual (Input)</th>
                    <th className="py-3 px-3 text-center">Selisih</th>
                    <th className="py-3 px-3 text-right">HPP</th>
                    <th className="py-3 px-3 text-right">Nilai Selisih</th>
                    <th className="py-3 px-4">Keterangan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-700">
                          {products.length === 0
                            ? 'Belum Ada Barang untuk Diaudit Stok Opname'
                            : 'Tidak Ada Barang yang Sesuai Filter'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                          {products.length === 0
                            ? 'Silakan input produk toko Anda di menu "Katalog & Stok" terlebih dahulu.'
                            : 'Coba ubah kata kunci pencarian atau matikan filter "Hanya Selisih".'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedItems.map((item) => {
                    const isDiff = item.difference !== 0;
                    return (
                      <tr
                        key={item.productId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isDiff ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <span className="font-mono text-[10px] text-slate-400">
                            {item.sku} • {item.unit}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {products.find((p) => p.id === item.productId)?.category}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                          {item.systemStock}
                        </td>

                        {/* Physical count input */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() =>
                                handlePhysicalChange(item.productId, item.physicalStock - 1)
                              }
                              className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shadow-2xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={item.physicalStock}
                              onChange={(e) =>
                                handlePhysicalChange(item.productId, Number(e.target.value))
                              }
                              className="w-14 text-center font-bold text-xs bg-transparent focus:outline-none text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handlePhysicalChange(item.productId, item.physicalStock + 1)
                              }
                              className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shadow-2xs"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Difference Badge */}
                        <td className="py-3 px-3 text-center">
                          {item.difference === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Sesuai
                            </span>
                          ) : item.difference < 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              {item.difference} {item.unit}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                              +{item.difference} {item.unit}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatRupiah(item.costPrice)}
                        </td>

                        <td
                          className={`py-3 px-3 text-right font-mono font-bold ${
                            item.differenceValue < 0
                              ? 'text-rose-600'
                              : item.differenceValue > 0
                              ? 'text-sky-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.differenceValue === 0
                            ? 'Rp 0'
                            : formatRupiah(item.differenceValue)}
                        </td>

                        {/* Reason / Notes */}
                        <td className="py-3 px-4">
                          {isDiff ? (
                            <select
                              value={item.reason}
                              onChange={(e) =>
                                handleReasonChange(
                                  item.productId,
                                  e.target.value as StockOpnameItem['reason']
                                )
                              }
                              className="text-xs px-2 py-1 bg-white border border-amber-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-orange-500"
                            >
                              <option value="rusak">Barang Rusak / Cacat</option>
                              <option value="kadaluwarsa">Kadaluwarsa / Expired</option>
                              <option value="hilang">Hilang / Susut Rak</option>
                              <option value="salah_hitung">Salah Hitung Sebelumnya</option>
                              <option value="bonus_supplier">Bonus / Lebih Kirim</option>
                            </select>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Kondisi Cocok</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submission Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-500" />
              <span>Konfirmasi &amp; Penyelesaian Audit Stok Opname</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Petugas Pemeriksa / Kasir
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="Nama operator..."
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Sesi Audit
                </label>
                <input
                  type="text"
                  value={opnameNotes}
                  onChange={(e) => setOpnameNotes(e.target.value)}
                  placeholder="Contoh: Audit berkala rak sembako dan pendingin..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyLiveAdjustment}
                  onChange={(e) => setApplyLiveAdjustment(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400"
                />
                <span>
                  Langsung perbarui stok sistem dengan angka fisik aktual (Live Stock Adjustment)
                </span>
              </label>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitOpname}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-orange-500/30 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Terapkan Hasil Stok Opname'}
                </span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* History of Past Stock Opnames */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Arsip Rekapitulasi Stok Opname
              </h3>
              <span className="text-xs text-slate-500">
                Total {stockOpnames.length} audit tersimpan di database
              </span>
            </div>

            {stockOpnames.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Belum Ada Riwayat Opname</p>
                <p className="text-xs text-slate-500 mt-1">
                  Lakukan audit pada tab "Sesi Audit Aktif" untuk menyimpan laporan perdana.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stockOpnames.map((so) => (
                  <div
                    key={so.id}
                    className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{so.opnameNumber}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {so.status === 'completed' ? 'Selesai & Disesuaikan' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Pemeriksa: <strong className="text-slate-700">{so.operator}</strong> •{' '}
                        {formatDate(so.date || so.createdAt)}
                      </p>
                      {so.notes && (
                        <p className="text-xs text-slate-600 mt-0.5 italic">"{so.notes}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                          Item Diperiksa
                        </span>
                        <span className="font-bold text-slate-800">
                          {so.totalItemsChecked || so.items?.length || 0} SKU
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                          Selisih Fisik
                        </span>
                        <span
                          className={`font-bold ${
                            so.totalDiscrepancyQty < 0
                              ? 'text-rose-600'
                              : so.totalDiscrepancyQty > 0
                              ? 'text-sky-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {so.totalDiscrepancyQty} unit
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                          Nilai Selisih
                        </span>
                        <span
                          className={`font-bold ${
                            so.totalDiscrepancyValue < 0
                              ? 'text-rose-600'
                              : so.totalDiscrepancyValue > 0
                              ? 'text-sky-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {formatRupiah(so.totalDiscrepancyValue)}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedHistoryOpname(so)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Detail Audit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Detail History Opname */}
      {selectedHistoryOpname && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Detail Audit: {selectedHistoryOpname.opnameNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Petugas: {selectedHistoryOpname.operator} •{' '}
                  {formatDate(selectedHistoryOpname.date || selectedHistoryOpname.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryOpname(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between text-xs">
                <span>
                  Catatan: <strong>{selectedHistoryOpname.notes || '-'}</strong>
                </span>
                <span>
                  Total Selisih Finansial:{' '}
                  <strong className="text-rose-600">
                    {formatRupiah(selectedHistoryOpname.totalDiscrepancyValue)}
                  </strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="p-2.5">Barang</th>
                      <th className="p-2.5 text-right">Sistem</th>
                      <th className="p-2.5 text-right">Fisik</th>
                      <th className="p-2.5 text-center">Selisih</th>
                      <th className="p-2.5 text-right">Nilai Selisih</th>
                      <th className="p-2.5">Alasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedHistoryOpname.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-semibold text-slate-900">{it.productName}</td>
                        <td className="p-2.5 text-right">{it.systemStock}</td>
                        <td className="p-2.5 text-right font-bold">{it.physicalStock}</td>
                        <td className="p-2.5 text-center font-bold">
                          {it.difference === 0 ? (
                            <span className="text-emerald-600">0</span>
                          ) : (
                            <span className="text-rose-600">{it.difference}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          {formatRupiah(it.differenceValue)}
                        </td>
                        <td className="p-2.5 capitalize">{it.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedHistoryOpname(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
