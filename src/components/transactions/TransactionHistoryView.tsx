import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Download,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Eye,
  FileText,
  Trash2,
  AlertTriangle,
  Check,
  X,
  ShieldAlert,
  RotateCcw,
  Package,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Transaction } from '../../types';
import { formatRupiah, formatDate } from '../../utils/currency';
import { exportToCSV } from '../../utils/exportUtils';
import { exportTransactionHistoryPDF } from '../../utils/pdfExportUtils';

interface TransactionHistoryViewProps {
  onSelectReceipt: (tx: Transaction) => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  onSelectReceipt,
}) => {
  const {
    transactions,
    currentUser,
    deleteTransaction,
    clearAllTransactions,
    canDeleteReceipt,
  } = useStore();

  const [search, setSearch] = useState<string>('');
  const [filterMethod, setFilterMethod] = useState<string>('all');

  // Delete modal state
  const [selectedTxToDelete, setSelectedTxToDelete] = useState<Transaction | null>(null);
  const [returnStockOnDelete, setReturnStockOnDelete] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk delete modal state
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [returnStockOnClearAll, setReturnStockOnClearAll] = useState<boolean>(false);
  const [clearConfirmInput, setClearConfirmInput] = useState<string>('');
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        search.trim() === '' ||
        tx.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        tx.customerName.toLowerCase().includes(search.toLowerCase()) ||
        tx.cashierName.toLowerCase().includes(search.toLowerCase());
      const matchMethod = filterMethod === 'all' || tx.paymentMethod === filterMethod;
      return matchSearch && matchMethod;
    });
  }, [transactions, search, filterMethod]);

  const totalFilteredRevenue = filtered.reduce((sum, tx) => sum + tx.total, 0);

  const handleExportCSV = () => {
    const headers = [
      'No. Nota / Faktur',
      'Tanggal',
      'Kasir',
      'Pelanggan',
      'Tipe Pelanggan',
      'Metode Bayar',
      'Jumlah Item',
      'Subtotal (Rp)',
      'Diskon (Rp)',
      'Total Akhir (Rp)',
      'Uang Diterima (Rp)',
      'Kembalian (Rp)',
    ];

    const rows = filtered.map((tx) => [
      tx.invoiceNumber,
      formatDate(tx.createdAt),
      tx.cashierName,
      tx.customerName,
      tx.customerType,
      tx.paymentMethod.toUpperCase(),
      tx.items.reduce((s, i) => s + i.quantity, 0),
      tx.subtotal,
      tx.discount,
      tx.total,
      tx.amountPaid,
      tx.change,
    ]);

    exportToCSV(`Riwayat_Transaksi_Toko_Almas_${new Date().toISOString().slice(0, 10)}`, [
      headers,
      ...rows,
    ]);
  };

  const handleExportPDF = () => {
    let filterDescription = 'Semua Transaksi';
    if (filterMethod !== 'all') {
      filterDescription = `Metode Pembayaran: ${filterMethod.toUpperCase()}`;
    }
    if (search.trim()) {
      filterDescription += ` (Kata Kunci: "${search}")`;
    }

    exportTransactionHistoryPDF({
      transactions: filtered,
      printedBy: currentUser?.name || 'Pemilik Toko',
      printedByRole:
        currentUser?.role === 'owner'
          ? 'Owner (Pemilik Toko)'
          : currentUser?.role === 'administrator'
          ? 'Administrator'
          : currentUser?.role || 'Staff Toko',
      filterLabel: filterDescription,
    });
  };

  const handleConfirmDelete = async () => {
    if (!selectedTxToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteTransaction(selectedTxToDelete.id, returnStockOnDelete);
      if (res.success) {
        showToast(res.message);
        setSelectedTxToDelete(null);
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus struk.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmClearAll = async () => {
    if (clearConfirmInput.trim().toUpperCase() !== 'HAPUS SEMUA') {
      alert('Ketik "HAPUS SEMUA" untuk mengonfirmasi pembersihan riwayat transaksi.');
      return;
    }
    setIsClearingAll(true);
    try {
      const res = await clearAllTransactions(returnStockOnClearAll);
      if (res.success) {
        showToast(res.message);
        setIsClearAllModalOpen(false);
        setClearConfirmInput('');
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat membersihkan riwayat.');
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-900/95 border border-emerald-500/30 text-white px-4 py-3 rounded-xl shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Check className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Receipt className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Riwayat Transaksi &amp; Faktur Penjualan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Arsip seluruh struk pembayaran kasir, status metode bayar, cetak ulang thermal receipt, serta hapus riwayat struk untuk Administrator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {canDeleteReceipt && transactions.length > 0 && (
            <button
              onClick={() => {
                setClearConfirmInput('');
                setIsClearAllModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Bersihkan riwayat seluruh struk (Akses Administrator)"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Bersihkan Riwayat</span>
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shadow-orange-500/25"
            title="Unduh Riwayat Transaksi Penjualan format PDF resmi untuk arsip pemilik toko"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Unduh Arsip PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no nota, pembeli, kasir..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800"
            />
          </div>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full sm:w-auto text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800 font-semibold"
          >
            <option value="all">Semua Metode Pembayaran</option>
            <option value="cash">Tunai (Cash)</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer Bank</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Total Omzet Terfilter: <strong className="text-slate-900 text-sm">{formatRupiah(totalFilteredRevenue)}</strong>
        </div>
      </div>

      {/* Transaction List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Faktur / Nota</th>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3">Pembeli</th>
                <th className="py-3 px-3">Kasir</th>
                <th className="py-3 px-3 text-center">Metode</th>
                <th className="py-3 px-3 text-right">Total Belanja</th>
                <th className="py-3 px-4 text-center">Aksi &amp; Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan pencarian
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {tx.invoiceNumber}
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        {tx.items.length} jenis item ({tx.items.reduce((s, i) => s + i.quantity, 0)} pcs)
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {formatDate(tx.createdAt)}
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-800">
                      {tx.customerName}
                      <span className="block text-[10px] text-slate-400 capitalize">
                        {tx.customerType}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-600">{tx.cashierName}</td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          tx.paymentMethod === 'cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.paymentMethod === 'qris'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {tx.paymentMethod === 'cash' ? (
                          <Banknote className="w-3 h-3" />
                        ) : tx.paymentMethod === 'qris' ? (
                          <QrCode className="w-3 h-3" />
                        ) : (
                          <CreditCard className="w-3 h-3" />
                        )}
                        {tx.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(tx.total)}
                      {tx.discount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-sans font-normal">
                          Hemat {formatRupiah(tx.discount)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectReceipt(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-orange-600 transition-colors"
                          title="Cetak ulang struk nota kasir"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak</span>
                        </button>

                        {canDeleteReceipt ? (
                          <button
                            onClick={() => {
                              setSelectedTxToDelete(tx);
                              setReturnStockOnDelete(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 bg-rose-50/50 hover:bg-rose-100 hover:text-rose-700 transition-colors"
                            title={`Hapus riwayat struk ${tx.invoiceNumber} (Akses ${currentUser.roleName})`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Hapus</span>
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center p-1 text-slate-300"
                            title="Hapus struk hanya diizinkan untuk akun Administrator atau Pemilik Toko"
                          >
                            <Trash2 className="w-3.5 h-3.5 opacity-30 cursor-not-allowed" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL HAPUS SATU STRUK */}
      {selectedTxToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start gap-4">
              <div className="p-3 bg-rose-500 text-white rounded-xl shadow-sm shadow-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-rose-950">
                  Hapus Riwayat Struk Transaksi
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Tindakan ini memerlukan hak akses Administrator / Pemilik Toko.
                </p>
              </div>
              <button
                onClick={() => setSelectedTxToDelete(null)}
                className="text-rose-400 hover:text-rose-700 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Nomor Faktur / Nota:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedTxToDelete.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Tanggal Transaksi:</span>
                  <span className="text-slate-700">{formatDate(selectedTxToDelete.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Nama Pembeli:</span>
                  <span className="font-semibold text-slate-800">{selectedTxToDelete.customerName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Kasir:</span>
                  <span className="text-slate-700">{selectedTxToDelete.cashierName}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Total Nilai Struk:</span>
                  <span className="font-mono font-extrabold text-rose-600 text-sm">
                    {formatRupiah(selectedTxToDelete.total)}
                  </span>
                </div>
              </div>

              {/* Items in receipt */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  <span>Daftar Barang dalam Struk ({selectedTxToDelete.items.length} jenis item):</span>
                </p>
                <div className="max-h-36 overflow-y-auto bg-slate-50/70 border border-slate-200/60 rounded-xl p-2.5 divide-y divide-slate-100 text-xs">
                  {selectedTxToDelete.items.map((item, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800 truncate max-w-[220px]">
                        {item.name}
                      </span>
                      <span className="font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                        {item.quantity} pcs × {formatRupiah(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock restoration checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={returnStockOnDelete}
                  onChange={(e) => setReturnStockOnDelete(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-emerald-950 flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                    Kembalikan stok barang ke inventaris toko (Restock)
                  </span>
                  <p className="text-emerald-700 text-[11px] mt-0.5">
                    Otomatis menambahkan kembali{' '}
                    <strong>
                      {selectedTxToDelete.items.reduce((s, i) => s + i.quantity, 0)} pcs
                    </strong>{' '}
                    barang ke etalase &amp; database sistem.
                  </p>
                </div>
              </label>

              {/* Security info */}
              <div className="flex items-start gap-2 bg-slate-100/80 p-3 rounded-xl text-[11px] text-slate-600">
                <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Penghapusan struk ini akan dicatat secara otomatis ke dalam <strong>Bukti Audit (Evidence Logs)</strong> oleh akun <strong>{currentUser.name}</strong> ({currentUser.roleName}).
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedTxToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 rounded-xl transition-all shadow-sm shadow-rose-600/30 flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Struk Ini</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BERSIHKAN SEMUA STRUK (BULK CLEAR) */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-rose-500 text-white p-5 flex items-start gap-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold">
                  Bersihkan Seluruh Riwayat Struk
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  Aksi Administrator: Menghapus {transactions.length} riwayat struk penjualan.
                </p>
              </div>
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Peringatan Penting!</span>
                </div>
                <p>
                  Semua arsip struk faktur kasir ({transactions.length} transaksi) akan dihapus secara permanen dari sistem KasirKu.
                </p>
              </div>

              {/* Return stock checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={returnStockOnClearAll}
                  onChange={(e) => setReturnStockOnClearAll(e.target.checked)}
                  className="mt-0.5 rounded text-orange-500 focus:ring-orange-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
                    Kembalikan seluruh kuantitas stok barang ke inventaris?
                  </span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Centang bila transaksi dihapus karena pembatalan transaksi riil dan stok barang fisik masih berada di toko.
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ketik <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">HAPUS SEMUA</span> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  placeholder="HAPUS SEMUA"
                  value={clearConfirmInput}
                  onChange={(e) => setClearConfirmInput(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                disabled={isClearingAll}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                disabled={isClearingAll || clearConfirmInput.trim().toUpperCase() !== 'HAPUS SEMUA'}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm shadow-rose-600/30 flex items-center gap-1.5"
              >
                {isClearingAll ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Membersihkan...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Seluruh Riwayat Struk</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
