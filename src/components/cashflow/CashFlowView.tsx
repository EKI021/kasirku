import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
  User,
  X,
  Save,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Check,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { CashFlow } from '../../types';
import { formatRupiah, formatDate } from '../../utils/currency';
import { exportCashFlowPDF } from '../../utils/pdfExportUtils';

export const CashFlowView: React.FC = () => {
  const {
    cashFlows,
    addCashFlowRecord,
    deleteCashFlowRecord,
    clearExpenseCashFlows,
    canDeleteCashOut,
    currentUser,
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [flowType, setFlowType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<string>('Operasional Toko');
  const [amount, setAmount] = useState<number>(50000);
  const [description, setDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modals for deleting cash out (Exclusive for Administrator)
  const [isClearExpensesModalOpen, setIsClearExpensesModalOpen] = useState<boolean>(false);
  const [selectedFlowToDelete, setSelectedFlowToDelete] = useState<CashFlow | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const expenseItems = cashFlows.filter((c) => c.type === 'expense');
  const totalIn = cashFlows
    .filter((c) => c.type === 'income')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalOut = expenseItems.reduce((sum, c) => sum + c.amount, 0);

  const netBalance = totalIn - totalOut;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Nominal harus lebih dari 0.');
      return;
    }
    if (!description.trim()) {
      alert('Keterangan kas wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      await addCashFlowRecord(flowType, category, amount, description);
      setIsModalOpen(false);
      setDescription('');
      setAmount(50000);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan arus kas.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearTotalExpenses = async () => {
    setIsDeleting(true);
    try {
      const res = await clearExpenseCashFlows();
      setIsClearExpensesModalOpen(false);
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal menghapus total kas keluar.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingleFlow = async () => {
    if (!selectedFlowToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteCashFlowRecord(selectedFlowToDelete.id);
      setSelectedFlowToDelete(null);
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal menghapus catatan kas.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPDF = () => {
    exportCashFlowPDF({
      cashFlows,
      totalIn,
      totalOut,
      netBalance,
      printedBy: currentUser?.name || 'Pemilik Toko',
      printedByRole:
        currentUser?.role === 'owner'
          ? 'Owner (Pemilik Toko)'
          : currentUser?.role === 'administrator'
          ? 'Administrator'
          : currentUser?.role || 'Staff Toko',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Wallet className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Pencatatan Arus Kas Toko (Cash Flow)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Catat kas masuk dan biaya operasional toko harian seperti token listrik, plastik, beban
            transportasi, dan pengeluaran kasir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Button Hapus Total Kas Keluar - HANYA TAMPIL UNTUK ADMINISTRATOR */}
          {canDeleteCashOut && expenseItems.length > 0 && (
            <button
              onClick={() => setIsClearExpensesModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Hapus seluruh total riwayat kas keluar toko (Khusus Akun Administrator)"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Hapus Total Kas Keluar</span>
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Unduh Rekap Buku Arus Kas Toko format PDF untuk arsip pemilik toko"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Unduh Arsip Kas PDF</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-orange-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Kas Masuk / Keluar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Kas Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Kas Masuk</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{formatRupiah(totalIn)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Dari kasir POS dan penerimaan modal</p>
        </div>

        {/* Total Kas Keluar with Administrator Delete Trigger */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Kas Keluar</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{formatRupiah(totalOut)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Biaya operasional &amp; belanja perlengkapan</p>

          {/* HANYA TAMPIL DI FITUR ADMINISTRATOR */}
          {canDeleteCashOut && expenseItems.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-rose-100/80 flex items-center justify-between">
              <span className="text-[10px] text-rose-700 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-500" />
                <span>Admin Only</span>
              </span>
              <button
                type="button"
                onClick={() => setIsClearExpensesModalOpen(true)}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs"
                title="Hapus seluruh total riwayat kas keluar toko (Khusus Administrator)"
              >
                <Trash2 className="w-3 h-3 text-rose-600" />
                <span>Hapus Total Kas Keluar</span>
              </button>
            </div>
          )}
        </div>

        {/* Saldo Kas Bersih */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Saldo Kas Bersih</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-black mt-2 ${
              netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatRupiah(netBalance)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Sisa kas riil di laci kasir</p>
        </div>
      </div>

      {/* Cash Flow Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Buku Kas KasirKu</h3>
          <span className="text-xs text-slate-500">{cashFlows.length} pencatatan transaksi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-3">Tipe</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-3">Petugas</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                {canDeleteCashOut && <th className="py-3 px-3 text-center">Aksi (Admin)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashFlows.length === 0 ? (
                <tr>
                  <td colSpan={canDeleteCashOut ? 7 : 6} className="py-8 text-center text-slate-400 text-xs italic">
                    Belum ada pencatatan kas masuk atau keluar
                  </td>
                </tr>
              ) : (
                cashFlows.map((cf) => (
                  <tr key={cf.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {formatDate(cf.date || cf.createdAt)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          cf.type === 'income'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {cf.type === 'income' ? '+' : '-'} {cf.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{cf.category}</td>
                    <td className="py-3 px-4 text-slate-600">{cf.description}</td>
                    <td className="py-3 px-3 text-slate-500">{cf.cashierName}</td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        cf.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {cf.type === 'income' ? '+' : '-'}
                      {formatRupiah(cf.amount)}
                    </td>
                    {/* HANYA TAMPIL DI FITUR ADMINISTRATOR */}
                    {canDeleteCashOut && (
                      <td className="py-3 px-3 text-center">
                        {cf.type === 'expense' ? (
                          <button
                            type="button"
                            onClick={() => setSelectedFlowToDelete(cf)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-rose-200/60 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                            title="Hapus catatan kas keluar ini (Khusus Administrator)"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span className="hidden sm:inline">Hapus</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Flow Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Catat Kas Masuk / Kas Keluar</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Arus Kas</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFlowType('income');
                      setCategory('Pemasukan Lain');
                    }}
                    className={`py-2 rounded-xl border font-bold text-xs ${
                      flowType === 'income'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Kas Masuk (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlowType('expense');
                      setCategory('Operasional Toko');
                    }}
                    className={`py-2 rounded-xl border font-bold text-xs ${
                      flowType === 'expense'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Kas Keluar (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-900 font-semibold"
                >
                  {flowType === 'expense' ? (
                    <>
                      <option value="Operasional Toko">Operasional Toko (Plastik/Kertas)</option>
                      <option value="Listrik & Utilitas">Listrik &amp; Air</option>
                      <option value="Belanja Modal / Suplai">Belanja Modal / Suplai</option>
                      <option value="Gaji / Uang Makan">Uang Makan / Gaji Kasir</option>
                      <option value="Lain-lain">Biaya Lain-lain</option>
                    </>
                  ) : (
                    <>
                      <option value="Penjualan POS">Penjualan POS Kasir</option>
                      <option value="Setoran Modal Awal">Setoran Modal Kas Awal</option>
                      <option value="Penerimaan Piutang">Penerimaan Pembayaran Piutang</option>
                      <option value="Pemasukan Lain">Pemasukan Tambahan Lain</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="50000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-bold text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan / Rincian *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Beli kantong kresek hitam 2 pack dan isolasi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/30"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Transaksi Kas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HAPUS TOTAL KAS KELUAR (KHUSUS ADMINISTRATOR) */}
      {isClearExpensesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-150 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-5 flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs text-white">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Hapus Total Kas Keluar</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-800 text-rose-100 border border-rose-500">
                    Admin Only
                  </span>
                </div>
                <p className="text-xs text-rose-100 mt-1">
                  Fitur eksklusif Administrator untuk membersihkan seluruh riwayat pengeluaran toko.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClearExpensesModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Jumlah Transaksi Kas Keluar:</span>
                  <span className="font-bold text-slate-900">{expenseItems.length} transaksi</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Total Nominal Kas Keluar:</span>
                  <span className="font-mono text-base font-black text-rose-700">
                    {formatRupiah(totalOut)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Dampak Pembersihan Kas Keluar:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-900">
                  <li>Seluruh riwayat biaya pengeluaran toko akan dihapus permanen dari Firestore database.</li>
                  <li>Total kas keluar akan direset menjadi <strong>Rp 0</strong>.</li>
                  <li>Saldo kas bersih toko akan otomatis bertambah kembali senilai <strong>+{formatRupiah(totalOut)}</strong>.</li>
                  <li>Catatan kas masuk (pemasukan POS) tetap aman dan tidak akan terhapus.</li>
                </ul>
              </div>

              <p className="text-xs text-slate-500 italic">
                Tindakan ini akan dicatat ke dalam <strong>Log Evidence Audit Trail</strong> sistem.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsClearExpensesModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleClearTotalExpenses}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:bg-rose-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-rose-600/30"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Semua Kas Keluar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS SATU CATATAN KAS KELUAR (KHUSUS ADMINISTRATOR) */}
      {selectedFlowToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-150 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-5 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold">Hapus Catatan Kas Keluar</h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  Akses Administrator KasirKu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFlowToDelete(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <p className="text-slate-600">
                Apakah Anda yakin ingin menghapus catatan kas keluar berikut?
              </p>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Kategori:</span>
                  <span className="font-bold text-slate-800">{selectedFlowToDelete.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Keterangan:</span>
                  <span className="font-semibold text-slate-800">{selectedFlowToDelete.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Nominal:</span>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatRupiah(selectedFlowToDelete.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Petugas:</span>
                  <span className="text-slate-700">{selectedFlowToDelete.cashierName}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSelectedFlowToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteSingleFlow}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Catatan Ini</span>
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
