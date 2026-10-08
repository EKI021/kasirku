import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  User,
  Tag,
  FileText,
  CreditCard,
  Printer,
  FileBox,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../utils/currency';

interface CartPanelProps {
  onOpenPaymentModal: () => void;
  onFastPayAndPrint: () => void;
  onSaveDraft: () => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  onOpenPaymentModal,
  onFastPayAndPrint,
  onSaveDraft,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const {
    cart,
    removeFromCart,
    changeQuantity,
    clearCart,
    customerName,
    setCustomerName,
    customerType,
    setCustomerType,
    orderNotes,
    setOrderNotes,
    orderDiscount,
    setOrderDiscount,
    cartSubtotal,
    cartTotalDiscount,
    cartGrandTotal,
    transactions,
  } = useStore();

  const [showNotesInput, setShowNotesInput] = useState<boolean>(false);
  const [showDiscountInput, setShowDiscountInput] = useState<boolean>(false);

  const currentOrderNumber = transactions.length + 1;

  return (
    <aside
      className={`bg-white select-none shadow-xs flex flex-col h-full shrink-0 ${
        isOpenOnMobile
          ? 'fixed inset-0 z-50 w-full animate-in slide-in-from-bottom duration-250 md:animate-none'
          : 'hidden md:flex md:w-80 lg:w-96 md:border-l md:border-slate-200'
      }`}
    >
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <span className="font-bold text-slate-900 text-base">
              Order #{currentOrderNumber}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-500 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
              >
                Kosongkan
              </button>
            )}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Tutup Keranjang"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Customer & Customer Type */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Nama Pembeli..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full text-xs pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800"
            />
          </div>

          <select
            value={customerType}
            onChange={(e) =>
              setCustomerType(e.target.value as 'regular' | 'member' | 'wholesale')
            }
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 text-slate-800 font-medium"
          >
            <option value="regular">Pelanggan Umum</option>
            <option value="member">Member VIP (Diskon 3%)</option>
            <option value="wholesale">Grosir / Reseller</option>
          </select>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Keranjang Belanja Kosong</p>
            <p className="text-xs text-slate-600 mt-1 max-w-[200px]">
              Klik tombol (+) pada kartu produk atau scan barcode untuk menambah belanjaan kasir.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const itemSubtotal = item.product.price * item.quantity;
            return (
              <div
                key={item.product.id}
                className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                      {formatRupiah(item.product.price)} × {item.quantity} ={' '}
                      <span className="font-bold text-slate-800">
                        {formatRupiah(itemSubtotal)}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                    title="Hapus barang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quantity Controls and Add Notes */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                    <button
                      onClick={() => changeQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => changeQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-600 font-medium">
                    Sisa: {item.product.stock - item.quantity} {item.product.unit}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Actions */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
          {/* Notes or Discounts toggles */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium hover:underline"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Diskon Manual</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => setShowNotesInput(!showNotesInput)}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Catatan Nota</span>
            </button>
          </div>

          {showDiscountInput && (
            <div className="p-2.5 rounded-lg bg-orange-50/70 border border-orange-200 flex items-center gap-2">
              <span className="text-xs font-medium text-orange-800">Diskon (Rp):</span>
              <input
                type="number"
                min="0"
                step="500"
                value={orderDiscount || ''}
                onChange={(e) => setOrderDiscount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full text-xs px-2 py-1 bg-white border border-orange-300 rounded focus:outline-none text-slate-800 font-bold"
              />
            </div>
          )}

          {showNotesInput && (
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Tambahkan catatan (misal: Kemas kardus, pesanan titipan)..."
              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 text-slate-800"
            />
          )}

          {/* Pricing Breakdown (matching reference) */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Sub total :</span>
              <span className="font-semibold text-slate-800">{formatRupiah(cartSubtotal)}</span>
            </div>

            {customerType === 'member' && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Diskon Member VIP (3%) :</span>
                <span>-{formatRupiah(Math.round(cartSubtotal * 0.03))}</span>
              </div>
            )}

            {orderDiscount > 0 && (
              <div className="flex justify-between text-orange-600 font-medium">
                <span>Diskon Manual :</span>
                <span>-{formatRupiah(orderDiscount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total :</span>
              <span className="text-xl font-extrabold text-orange-600">
                {formatRupiah(cartGrandTotal)}
              </span>
            </div>
          </div>

          {/* Action Buttons matching RestroBit Layout */}
          <div className="space-y-2 pt-1">
            <button
              onClick={onSaveDraft}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <FileBox className="w-3.5 h-3.5" />
              <span>Simpan Sebagai Draft Nota</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenPaymentModal}
                className="py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all active:scale-[0.98]"
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar &amp; Kasir</span>
              </button>

              <button
                onClick={onFastPayAndPrint}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                <span>Bayar &amp; Cetak</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
