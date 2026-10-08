import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  FolderPlus,
  CheckCircle2,
  X,
  AlertCircle,
  Barcode,
  Printer,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/currency';
import { ProductModal } from './ProductModal';
import { BarcodePrintModal } from './BarcodePrintModal';

interface ProductManagementViewProps {
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const {
    products,
    removeProduct,
    adjustProductStock,
    canDeleteProduct,
    canDeleteStock,
    canAddStock,
    currentUser,
    setActiveTab,
  } = useStore();

  const [search, setSearch] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('Semua');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Barcode Printing State
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState<boolean>(false);
  const [barcodeTargetProduct, setBarcodeTargetProduct] = useState<Product | null>(null);

  // In-app confirmation dialog states (no window.confirm which is blocked in iframes!)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['Semua', ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCat === 'Semua' || p.category === selectedCat;
      const matchSearch =
        search.trim() === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search));
      const matchLowStock = onlyLowStock ? p.stock <= p.minStock : true;
      return matchCat && matchSearch && matchLowStock;
    });
  }, [products, selectedCat, search, onlyLowStock]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setIsAddModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await removeProduct(deleteTarget.id);
      showToast(`Produk "${deleteTarget.name}" berhasil dihapus dari database.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus produk.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Katalog &amp; Manajemen Stok Barang
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data master barang, harga modal (HPP), harga jual, batas minimum stok, dan kode
            barcode KasirKu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {products.length > 0 && (
            <button
              onClick={() => {
                setBarcodeTargetProduct(null);
                setIsBarcodeModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              title="Cetak label barcode produk untuk ditempelkan pada fisik barang toko"
            >
              <Barcode className="w-4 h-4 text-orange-400" />
              <span>Cetak Label Barcode</span>
            </button>
          )}

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-orange-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, SKU, atau barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800"
            />
          </div>

          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800 font-semibold"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'Semua' ? 'Semua Kategori' : c}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-400"
            />
            <span>Stok Menipis / Habis</span>
          </label>
        </div>

        <span className="text-xs text-slate-500">
          Total <strong>{filtered.length}</strong> produk aktif di database
        </span>
      </div>

      {/* Product Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <FolderPlus className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Katalog Produk Masih Kosong</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Belum ada produk terdaftar di katalog. Anda dapat memasukkan data barang toko secara
              mandiri menggunakan tombol di atas.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm shadow-orange-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>Input Barang Baru Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-3">SKU &amp; Barcode</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Harga Modal (HPP)</th>
                  <th className="py-3 px-3 text-right">Harga Jual</th>
                  <th className="py-3 px-3 text-right">Margin Laba</th>
                  <th className="py-3 px-3 text-center">Stok Saat Ini</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((prod) => {
                  const margin = prod.price - prod.costPrice;
                  const marginPct = prod.price > 0 ? Math.round((margin / prod.price) * 100) : 0;
                  const isLow = prod.stock <= prod.minStock;
                  const isOut = prod.stock <= 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{prod.name}</p>
                            <span className="text-[10px] text-slate-400">Satuan: {prod.unit}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        <div>{prod.sku}</div>
                        <div className="text-[10px] text-slate-400">{prod.barcode || '-'}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {prod.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatRupiah(prod.costPrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(prod.price)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold">
                        +{formatRupiah(margin)}{' '}
                        <span className="text-[10px] text-emerald-500">({marginPct}%)</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isOut
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3" />}
                          {prod.stock} {prod.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Cetak Barcode Produk Ini */}
                          <button
                            onClick={() => {
                              setBarcodeTargetProduct(prod);
                              setIsBarcodeModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-slate-200"
                            title="Cetak Label Barcode Produk Ini (Tempelkan pada Barang)"
                          >
                            <Barcode className="w-3.5 h-3.5 text-orange-600" />
                          </button>

                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-slate-200"
                            title={
                              currentUser.role === 'owner'
                                ? 'Ubah Nama, Kategori, atau Stok'
                                : 'Edit Lengkap Produk'
                            }
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick buttons for Owner to add or delete stock */}
                          {currentUser.role === 'owner' && (
                            <>
                              <button
                                onClick={() =>
                                  adjustProductStock(
                                    prod.id,
                                    prod.stock + 10,
                                    'Penambahan stok cepat oleh Owner (+10)'
                                  )
                                }
                                className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                                title="Tambah 10 stok"
                              >
                                +10
                              </button>

                              <button
                                onClick={() => {
                                  adjustProductStock(
                                    prod.id,
                                    0,
                                    'Penghapusan stok menjadi 0 oleh Owner'
                                  );
                                  showToast(`Stok "${prod.name}" berhasil dikosongkan (0 unit).`);
                                }}
                                className="px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
                                title="Hapus stok (kosongkan menjadi 0)"
                              >
                                Hapus Stok (0)
                              </button>
                            </>
                          )}

                          {canDeleteProduct && (
                            <button
                              onClick={() => setDeleteTarget({ id: prod.id, name: prod.name })}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                              title="Hapus Produk dari Database"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Edit / Add Product */}
      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
        onPrintBarcode={(prod) => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
          setBarcodeTargetProduct(prod);
          setIsBarcodeModalOpen(true);
        }}
      />

      {/* Modal Cetak Label Barcode */}
      <BarcodePrintModal
        isOpen={isBarcodeModalOpen}
        onClose={() => {
          setIsBarcodeModalOpen(false);
          setBarcodeTargetProduct(null);
        }}
        initialProduct={barcodeTargetProduct}
        onNavigateToPos={() => setActiveTab('pos')}
      />

      {/* Custom In-app Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Produk dari Database?</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Apakah Anda yakin ingin menghapus produk <strong className="text-slate-900">"{deleteTarget.name}"</strong> secara permanen?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border bg-slate-900 text-white text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.text}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
