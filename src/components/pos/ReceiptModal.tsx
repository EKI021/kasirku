import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  ArrowRight,
  Settings2,
  FileText,
  Copy,
  Scissors,
} from 'lucide-react';
import { Transaction } from '../../types';
import { formatRupiah, formatDate } from '../../utils/currency';
import { executeThermalPrint } from '../../utils/printReceipt';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [copies, setCopies] = useState<1 | 2>(1);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    executeThermalPrint({
      paperSize: paperWidth,
      invoiceNumber: transaction.invoiceNumber.replace(/\//g, '-'),
    });
  };

  // Barcode visualization stripe generator based on invoice string
  const renderBarcodeStripe = () => {
    return (
      <div className="flex items-center justify-center gap-[2px] py-1 my-1 overflow-hidden opacity-85">
        {[2, 1, 3, 1, 2, 4, 1, 2, 3, 2, 1, 3, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 4, 1, 3, 2].map(
          (w, i) => (
            <div
              key={i}
              className="bg-black"
              style={{
                width: `${w * (paperWidth === '58mm' ? 1.2 : 1.6)}px`,
                height: paperWidth === '58mm' ? '28px' : '36px',
              }}
            />
          )
        )}
      </div>
    );
  };

  const renderSingleReceipt = (copyLabel?: string) => (
    <div
      className={`thermal-receipt-paper bg-white font-mono leading-tight text-black transition-all ${
        paperWidth === '58mm' ? 'paper-58mm max-w-[280px] text-[11px]' : 'paper-80mm max-w-[360px] text-xs'
      } p-4 rounded-xl border border-slate-200/90 shadow-2xs mx-auto`}
    >
      {/* Header KasirKu */}
      <div className="text-center pb-2">
        <h2 className="font-extrabold text-sm tracking-wider uppercase">KASIRKU</h2>
        <p className="text-[10px] text-slate-700">RETAIL • SEMBAKO • GROSIR</p>
        <p className="text-[9px] text-slate-600">Jl. Raya Perintis Kemerdekaan No. 18</p>
        <p className="text-[9px] text-slate-600">Telp/WA: 0812-9876-5432</p>
        {copyLabel && (
          <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold border border-black uppercase">
            {copyLabel}
          </span>
        )}
      </div>

      <div className="thermal-dash border-t border-dashed border-black/80 my-2" />

      {/* Transaction Metadata */}
      <div className="space-y-0.5 text-[10px] text-slate-800">
        <div className="flex justify-between">
          <span>NO. NOTA:</span>
          <span className="font-bold">{transaction.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>TANGGAL:</span>
          <span>{formatDate(transaction.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>KASIR:</span>
          <span className="truncate max-w-[140px]">{transaction.cashierName}</span>
        </div>
        <div className="flex justify-between">
          <span>PELANGGAN:</span>
          <span className="truncate max-w-[140px]">
            {transaction.customerName} ({transaction.customerType})
          </span>
        </div>
      </div>

      <div className="thermal-dash border-t border-dashed border-black/80 my-2" />

      {/* Itemized List */}
      <div className="space-y-2 py-1">
        {transaction.items.map((item, idx) => (
          <div key={idx} className="receipt-item-row">
            <div className="font-bold truncate text-[11px]">{item.name}</div>
            <div className="flex justify-between pl-2 text-[10px]">
              <span>
                {item.quantity} × {formatRupiah(item.price)}
              </span>
              <span className="font-bold">{formatRupiah(item.subtotal)}</span>
            </div>
            {item.discount > 0 && (
              <div className="flex justify-between pl-2 text-[9px] text-slate-600">
                <span>Diskon item:</span>
                <span>-{formatRupiah(item.discount)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="thermal-dash border-t border-dashed border-black/80 my-2" />

      {/* Totals Breakdown */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatRupiah(transaction.subtotal)}</span>
        </div>
        {transaction.discount > 0 && (
          <div className="flex justify-between text-slate-700">
            <span>Total Hemat:</span>
            <span>-{formatRupiah(transaction.discount)}</span>
          </div>
        )}

        <div className="thermal-double-dash border-t-2 border-dashed border-black my-1" />

        <div className="flex justify-between font-extrabold text-xs pt-0.5">
          <span>TOTAL:</span>
          <span>{formatRupiah(transaction.total)}</span>
        </div>

        <div className="flex justify-between text-[10px] text-slate-700 pt-1">
          <span>METODE:</span>
          <span className="uppercase font-bold">{transaction.paymentMethod}</span>
        </div>
        <div className="flex justify-between text-[10px] text-slate-700">
          <span>BAYAR:</span>
          <span>{formatRupiah(transaction.amountPaid)}</span>
        </div>
        {transaction.change > 0 && (
          <div className="flex justify-between text-[10px] font-bold">
            <span>KEMBALIAN:</span>
            <span>{formatRupiah(transaction.change)}</span>
          </div>
        )}
      </div>

      <div className="thermal-dash border-t border-dashed border-black/80 my-2" />

      {/* Barcode & Footer */}
      <div className="text-center pt-1 space-y-1">
        {renderBarcodeStripe()}
        <span className="font-mono text-[9px] tracking-widest">{transaction.invoiceNumber}</span>

        <p className="text-[10px] font-bold mt-2">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
        <p className="text-[9px] text-slate-600 leading-tight">
          Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.
        </p>
        <p className="text-[8px] text-slate-500 font-sans">
          Powered by KasirKu POS • Cloud Firestore
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[94vh]">
        {/* Top Header Controls (no-print) */}
        <div className="no-print px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Struk Transaksi Selesai
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                showSettings
                  ? 'bg-orange-100 text-orange-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-200/60'
              }`}
              title="Pengaturan Format Printer Thermal"
            >
              <Settings2 className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Format</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thermal Settings Panel (no-print) */}
        {showSettings && (
          <div className="no-print p-3 bg-orange-50/60 border-b border-orange-200 text-xs space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Ukuran Kertas Thermal:</span>
              <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    paperWidth === '58mm'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  58mm (Mini POS)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    paperWidth === '80mm'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  80mm (Standar)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Jumlah Lembar Struk:</span>
              <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setCopies(1)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    copies === 1
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1x (Pembeli)
                </button>
                <button
                  type="button"
                  onClick={() => setCopies(2)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    copies === 2
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2x (+Arsip Kasir)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Thermal Receipt Content Container (Captured by @media print) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100/60 flex justify-center">
          <div id="printable-receipt-container" className="w-full">
            {copies === 1 ? (
              renderSingleReceipt()
            ) : (
              <div className="space-y-4">
                {renderSingleReceipt('LEMBAR PEMBELI')}

                {/* Scissors cutting indicator */}
                <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-mono py-1">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>- - - - - - - Potong Di Sini - - - - - - -</span>
                </div>

                {renderSingleReceipt('ARSIP TOKO / KASIR')}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions (no-print) */}
        <div className="no-print p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            <span>Cetak Struk Thermal ({paperWidth})</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20 transition-all"
          >
            <span>Transaksi Baru</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
