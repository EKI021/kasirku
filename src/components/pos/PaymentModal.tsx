import React, { useState, useRef } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle,
  AlertCircle,
  Receipt,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  Volume2,
  Maximize2,
  Edit3,
  Save,
  Trash2,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PaymentMethod } from '../../types';
import { formatRupiah } from '../../utils/currency';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const {
    cartGrandTotal,
    customerName,
    completeTransaction,
    qrisConfig,
    updateQrisConfig,
    speakPaymentSuccess,
  } = useStore();

  const storeName = 'KasirKu';

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashAmount, setCashAmount] = useState<number>(cartGrandTotal);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // QRIS Real Image Upload & Zoom States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isZoomedQris, setIsZoomedQris] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Sound Test State
  const [isPlayingAudioTest, setIsPlayingAudioTest] = useState<boolean>(false);

  // Bank Account Inline Editor State
  const [showAccountEditor, setShowAccountEditor] = useState<boolean>(false);
  const [bankFormData, setBankFormData] = useState({
    bankName: qrisConfig.bankName || 'BCA',
    accountNumber: qrisConfig.accountNumber || '',
    accountHolder: qrisConfig.accountHolder || '',
    secondaryBankName: qrisConfig.secondaryBankName || 'MANDIRI',
    secondaryAccountNumber: qrisConfig.secondaryAccountNumber || '',
    secondaryAccountHolder: qrisConfig.secondaryAccountHolder || '',
    qrisMerchantNmid: qrisConfig.qrisMerchantNmid || '',
  });

  // Copy Feedback
  const [copiedBankKey, setCopiedBankKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickNominals = [
    cartGrandTotal, // Uang Pas
    Math.ceil(cartGrandTotal / 10000) * 10000,
    Math.ceil(cartGrandTotal / 50000) * 50000,
    100000,
    200000,
    500000,
  ].filter((val, idx, self) => val >= cartGrandTotal && self.indexOf(val) === idx);

  const change = Math.max(0, cashAmount - cartGrandTotal);
  const isCashSufficient = cashAmount >= cartGrandTotal;

  // Handle uploading real bank QRIS image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (JPG, PNG, atau WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        updateQrisConfig({
          qrisImageUrl: base64,
          useOfficialBankQris: true,
        });
        setUploadMessage('Foto Barcode QRIS Resmi dari Bank berhasil diunggah!');
        setTimeout(() => setUploadMessage(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded QRIS image
  const handleRemoveQrisImage = () => {
    if (confirm('Hapus gambar barcode QRIS yang diunggah?')) {
      updateQrisConfig({
        qrisImageUrl: '',
        useOfficialBankQris: false,
      });
      setUploadMessage('Gambar QRIS telah dihapus.');
      setTimeout(() => setUploadMessage(null), 3000);
    }
  };

  // Handle saving bank accounts
  const handleSaveBankAccounts = (e: React.FormEvent) => {
    e.preventDefault();
    updateQrisConfig({
      bankName: bankFormData.bankName.trim() || 'BCA',
      accountNumber: bankFormData.accountNumber.trim(),
      accountHolder: bankFormData.accountHolder.trim(),
      secondaryBankName: bankFormData.secondaryBankName.trim() || 'MANDIRI',
      secondaryAccountNumber: bankFormData.secondaryAccountNumber.trim(),
      secondaryAccountHolder: bankFormData.secondaryAccountHolder.trim(),
      qrisMerchantNmid: bankFormData.qrisMerchantNmid.trim(),
    });
    setShowAccountEditor(false);
    setUploadMessage('Data rekening bank berhasil diperbarui!');
    setTimeout(() => setUploadMessage(null), 3000);
  };

  // Copy bank account number to clipboard
  const handleCopyAccount = (numberToCopy: string, key: string) => {
    if (!numberToCopy) return;
    navigator.clipboard.writeText(numberToCopy);
    setCopiedBankKey(key);
    setTimeout(() => setCopiedBankKey(null), 2000);
  };

  // Test Voice Announcement "Pembayaran Berhasil"
  const handleTestAudio = () => {
    setIsPlayingAudioTest(true);
    speakPaymentSuccess('Pembayaran QRIS berhasil! Terima kasih.');
    setTimeout(() => setIsPlayingAudioTest(false), 2200);
  };

  // Confirm payment
  const handleConfirmPayment = async () => {
    if (paymentMethod === 'cash' && !isCashSufficient) {
      alert('Uang yang dibayarkan kurang dari total belanja.');
      return;
    }

    setIsProcessing(true);
    try {
      // Suara pengumuman "Pembayaran Berhasil" khusus QRIS langsung dibunyikan
      if (paymentMethod === 'qris') {
        speakPaymentSuccess('Pembayaran QRIS berhasil! Terima kasih.');
      }

      await completeTransaction(paymentMethod, cashAmount, paymentNotes);
      onClose();
    } catch (err) {
      console.error('Error completing payment:', err);
      alert('Terjadi kesalahan saat memproses transaksi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <h2 className="text-base font-bold text-slate-900">Pembayaran Kasir</h2>
              <p className="text-xs text-slate-500">
                Pelanggan: <span className="font-semibold text-slate-700">{customerName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast Notification */}
          {uploadMessage && (
            <div className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{uploadMessage}</span>
            </div>
          )}

          {/* Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* Total Tagihan Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between shadow-md shadow-orange-500/20">
              <div>
                <span className="text-xs font-medium text-orange-100 uppercase tracking-wider">
                  Total Tagihan
                </span>
                <p className="text-2xl font-black mt-0.5 tracking-tight">
                  {formatRupiah(cartGrandTotal)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Pilih Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-orange-500 bg-orange-50/60 text-orange-700 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs">Tunai (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'qris'
                      ? 'border-orange-500 bg-orange-50/60 text-orange-700 font-bold shadow-xs ring-2 ring-orange-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs">QRIS Instan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'transfer'
                      ? 'border-orange-500 bg-orange-50/60 text-orange-700 font-bold shadow-xs ring-2 ring-orange-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Transfer Bank</span>
                </button>
              </div>
            </div>

            {/* TUNAI / CASH VIEW */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nominal Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={cashAmount || ''}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    className="w-full text-lg font-bold px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500 text-slate-900"
                    placeholder="0"
                  />
                </div>

                {/* Quick Nominal Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {quickNominals.map((nom, idx) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => setCashAmount(nom)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                        cashAmount === nom
                          ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {idx === 0 ? 'Uang Pas' : formatRupiah(nom)}
                    </button>
                  ))}
                </div>

                {/* Change Indicator */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Kembalian :</span>
                  <span
                    className={`text-base font-extrabold ${
                      isCashSufficient ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {isCashSufficient ? formatRupiah(change) : 'Nominal kurang!'}
                  </span>
                </div>
              </div>
            )}

            {/* QRIS PAYMENT VIEW */}
            {paymentMethod === 'qris' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                {/* Hidden File Input for uploading Real Bank QRIS */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                {/* Real Bank QRIS Image Display OR Upload Prompt */}
                {qrisConfig.qrisImageUrl ? (
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative group p-3 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block">
                      <img
                        src={qrisConfig.qrisImageUrl}
                        alt="QRIS Resmi Bank"
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl bg-white cursor-pointer"
                        onClick={() => setIsZoomedQris(true)}
                        title="Klik untuk memperbesar gambar QRIS"
                      />

                      {/* Floating Zoom Button */}
                      <button
                        type="button"
                        onClick={() => setIsZoomedQris(true)}
                        className="absolute bottom-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl shadow-md transition-all flex items-center gap-1 text-[11px] font-bold"
                        title="Perbesar gambar agar mudah di-scan"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Perbesar</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Barcode QRIS Resmi Bank Aktif</span>
                      </div>
                      {qrisConfig.qrisMerchantNmid && (
                        <p className="text-[11px] text-slate-500 font-mono">
                          NMID: <strong className="text-slate-700">{qrisConfig.qrisMerchantNmid}</strong>
                        </p>
                      )}
                      <p className="text-xs text-slate-600">
                        Pindai via BCA, Mandiri, BRImo, BNI, Dana, GoPay, OVO, ShopeePay.
                      </p>
                    </div>

                    {/* Actions for uploaded QRIS */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Ganti Gambar QRIS</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveQrisImage}
                        className="p-1.5 rounded-xl text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                        title="Hapus gambar barcode QRIS"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* UPLOAD REAL BANK QRIS DROPZONE */
                  <div className="space-y-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/50 hover:bg-orange-50/80 rounded-2xl p-5 sm:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center text-orange-600 transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Upload Gambar Barcode QRIS Resmi dari Bank
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Klik di sini untuk memilih foto barcode QRIS (BCA, Mandiri, BRI, BNI, Dana, dll.)
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-orange-200 text-orange-700 text-[11px] font-bold shadow-2xs">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Pilih File Gambar (JPG / PNG / WebP)
                      </span>
                    </div>

                    {/* Temporary fallback barcode display until user uploads real bank barcode */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center text-xs space-y-1">
                      <p className="font-semibold text-slate-700">
                        {storeName} — QRIS Siap Dipindai
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Nominal terkunci: <strong>{formatRupiah(cartGrandTotal)}</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* Sound Test & Audio Indicator */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Suara &quot;Pembayaran Berhasil&quot; aktif</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestAudio}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      isPlayingAudioTest
                        ? 'bg-emerald-600 text-white border-emerald-600 scale-98 shadow-sm'
                        : 'bg-white text-slate-700 hover:text-emerald-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                    title="Dengarkan pengumuman suara saat pelanggan bayar QRIS"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isPlayingAudioTest ? 'Memutar Suara...' : 'Tes Suara Kasir'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TRANSFER BANK VIEW */}
            {paymentMethod === 'transfer' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <span>Rekening Tujuan {storeName}:</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBankFormData({
                        bankName: qrisConfig.bankName || 'BCA',
                        accountNumber: qrisConfig.accountNumber || '',
                        accountHolder: qrisConfig.accountHolder || '',
                        secondaryBankName: qrisConfig.secondaryBankName || 'MANDIRI',
                        secondaryAccountNumber: qrisConfig.secondaryAccountNumber || '',
                        secondaryAccountHolder: qrisConfig.secondaryAccountHolder || '',
                        qrisMerchantNmid: qrisConfig.qrisMerchantNmid || '',
                      });
                      setShowAccountEditor(!showAccountEditor);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-orange-300 text-orange-600 font-bold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{showAccountEditor ? 'Tutup Editor' : 'Input / Ubah No. Rekening'}</span>
                  </button>
                </div>

                {/* Inline Bank Account Input Editor */}
                {showAccountEditor ? (
                  <form onSubmit={handleSaveBankAccounts} className="p-4 bg-white rounded-2xl border border-orange-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-800 text-xs">Input Rekening Bank Toko</span>
                      <span className="text-[10px] text-slate-400">Tersimpan otomatis ke sistem</span>
                    </div>

                    {/* Bank Utama */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-orange-600 uppercase">Rekening Utama (Wajib)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-600 mb-0.5">Nama Bank</label>
                          <input
                            type="text"
                            required
                            value={bankFormData.bankName}
                            onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                            placeholder="Contoh: BCA, MANDIRI, BRI"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-600 mb-0.5">Nomor Rekening</label>
                          <input
                            type="text"
                            required
                            value={bankFormData.accountNumber}
                            onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                            placeholder="Contoh: 8820193321"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5">Atas Nama (Pemilik)</label>
                        <input
                          type="text"
                          required
                          value={bankFormData.accountHolder}
                          onChange={(e) => setBankFormData({ ...bankFormData, accountHolder: e.target.value })}
                          placeholder="Contoh: KASIRKU RETAIL"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {/* Bank Cadangan (Opsional) */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600 uppercase">Rekening Kedua (Opsional)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-600 mb-0.5">Nama Bank 2</label>
                          <input
                            type="text"
                            value={bankFormData.secondaryBankName}
                            onChange={(e) => setBankFormData({ ...bankFormData, secondaryBankName: e.target.value })}
                            placeholder="Contoh: MANDIRI / BRI"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-600 mb-0.5">No. Rekening 2</label>
                          <input
                            type="text"
                            value={bankFormData.secondaryAccountNumber}
                            onChange={(e) => setBankFormData({ ...bankFormData, secondaryAccountNumber: e.target.value })}
                            placeholder="Nomor rekening"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAccountEditor(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Rekening</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Display Rekening List with 1-Click Copy */
                  <div className="space-y-2">
                    {/* Bank 1 */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-orange-600 text-xs tracking-wider">
                            {qrisConfig.bankName || 'BANK'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            Utama
                          </span>
                        </div>
                        <p className="font-mono font-bold text-slate-900 text-sm truncate">
                          {qrisConfig.accountNumber || 'Belum diisi'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          A.N: <strong className="text-slate-700">{qrisConfig.accountHolder || 'KasirKu'}</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyAccount(qrisConfig.accountNumber, 'primary')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                          copiedBankKey === 'primary'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {copiedBankKey === 'primary' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Bank 2 (if present) */}
                    {qrisConfig.secondaryAccountNumber && (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-blue-600 text-xs tracking-wider">
                              {qrisConfig.secondaryBankName || 'BANK 2'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                              Cadangan
                            </span>
                          </div>
                          <p className="font-mono font-bold text-slate-900 text-sm truncate">
                            {qrisConfig.secondaryAccountNumber}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            A.N: <strong className="text-slate-700">{qrisConfig.secondaryAccountHolder || qrisConfig.accountHolder || 'KasirKu'}</strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyAccount(qrisConfig.secondaryAccountNumber || '', 'secondary')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                            copiedBankKey === 'secondary'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {copiedBankKey === 'secondary' ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Pembayaran (Opsional)
              </label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Contoh: No. ref transfer atau pesanan khusus"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={isProcessing || (paymentMethod === 'cash' && !isCashSufficient)}
              onClick={handleConfirmPayment}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-orange-500/30 transition-all active:scale-98"
            >
              {isProcessing ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Selesaikan Transaksi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX FOR REAL QRIS BARCODE */}
      {isZoomedQris && qrisConfig.qrisImageUrl && (
        <div
          onClick={() => setIsZoomedQris(false)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-3xl max-w-sm sm:max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-4"
          >
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{storeName}</h3>
                <p className="text-[11px] text-slate-500">Scan QRIS Resmi Bank</p>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomedQris(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-white rounded-2xl border-2 border-slate-900 shadow-inner">
              <img
                src={qrisConfig.qrisImageUrl}
                alt="Barcode QRIS Toko"
                className="w-72 h-72 sm:w-80 sm:h-80 object-contain mx-auto"
              />
            </div>

            <div className="space-y-1 w-full">
              <p className="text-base font-black text-orange-600 font-mono">
                {formatRupiah(cartGrandTotal)}
              </p>
              <p className="text-xs text-slate-600">
                Arahkan kamera aplikasi perbankan atau e-wallet ke barcode di atas
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsZoomedQris(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              Tutup Tampilan Penuh
            </button>
          </div>
        </div>
      )}
    </>
  );
};
