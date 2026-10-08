import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Upload,
  Image as ImageIcon,
  Lock,
  Sparkles,
  AlertTriangle,
  Trash2,
  Barcode,
} from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { BarcodeSvg } from './BarcodeSvg';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onPrintBarcode?: (p: Product) => void;
}

const PRESET_IMAGES = [
  { label: 'Beras', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80' },
  { label: 'Minyak', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80' },
  { label: 'Gula', url: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400&auto=format&fit=crop&q=80' },
  { label: 'Telur', url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&auto=format&fit=crop&q=80' },
  { label: 'Mi Instan', url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80' },
  { label: 'Kopi', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80' },
  { label: 'Susu', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80' },
  { label: 'Sabun', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80' },
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onPrintBarcode,
}) => {
  const {
    upsertProduct,
    removeProduct,
    currentUser,
    canEditProductImage,
    canEditProductName,
    canEditCategory,
    canAddStock,
    canDeleteStock,
    canDeleteProduct,
    canEditFinanceFields,
    categories,
    addCategory,
  } = useStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isQuickAddCategoryOpen, setIsQuickAddCategoryOpen] = useState<boolean>(false);
  const [quickCatName, setQuickCatName] = useState<string>('');
  const [quickCatType, setQuickCatType] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    category: 'Sembako',
    price: 0,
    costPrice: 0,
    stock: 0,
    minStock: 5,
    unit: 'Pcs',
    imageUrl: '',
  });

  const [imageTab, setImageTab] = useState<'upload' | 'url' | 'presets'>('upload');

  useEffect(() => {
    if (productToEdit) {
      setFormData({ ...productToEdit });
    } else {
      const randomSku = `ALM-${Math.floor(1000 + Math.random() * 9000)}`;
      setFormData({
        id: `prod-${Date.now()}`,
        name: '',
        sku: randomSku,
        barcode: `899${Math.floor(100000000 + Math.random() * 900000000)}`,
        category: 'Sembako',
        price: 0,
        costPrice: 0,
        stock: 0,
        minStock: 5,
        unit: 'Pcs',
        imageUrl: '',
      });
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  // File upload handler converting image to Base64 data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    if (!canEditProductImage) {
      setFormError('Hanya akun Administrator dan Admin Gudang yang berhak mengubah gambar produk.');
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError('Ukuran file foto maksimal 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name || !formData.sku) {
      setFormError('Nama barang dan SKU wajib diisi.');
      return;
    }

    const prodToSave: Product = {
      id: productToEdit?.id || formData.id || `prod-${Date.now()}`,
      name: formData.name || '',
      sku: formData.sku || '',
      barcode: formData.barcode || '',
      category: formData.category || 'Umum',
      price: Number(formData.price) || 0,
      costPrice: Number(formData.costPrice) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 0,
      unit: formData.unit || 'Pcs',
      imageUrl: canEditProductImage ? (formData.imageUrl || '') : (productToEdit?.imageUrl || formData.imageUrl || ''),
      createdAt: productToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await upsertProduct(prodToSave);
      onClose();
    } catch (err) {
      console.error(err);
      setFormError('Gagal menyimpan produk ke database.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {productToEdit ? 'Edit Informasi Barang' : 'Tambah Barang Baru KasirKu'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Login Petugas: <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.roleName})
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs flex items-center justify-between animate-in fade-in">
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-400 hover:text-rose-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PRODUCT IMAGE SECTION WITH PRIVILEGE CHECK */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                <span>Foto / Gambar Produk</span>
              </span>

              {canEditProductImage ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Akses Edit Foto: Terbuka ({currentUser.role === 'warehouse_admin' ? 'Admin Gudang' : currentUser.role === 'administrator' ? 'Administrator' : 'Aktif'})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Terkunci (Administrator &amp; Admin Gudang)
                </span>
              )}
            </div>

            {/* Preview image */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-white border border-slate-300 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {canEditProductImage ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Foto dari Perangkat</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {formData.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      value={formData.imageUrl || ''}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="Atau tempel URL gambar web (https://...)"
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 text-slate-800 font-mono"
                    />

                    {/* Quick presets for admin convenience */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-slate-400">Preset contoh:</span>
                      {PRESET_IMAGES.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-white border border-slate-200 hover:bg-orange-50 hover:text-orange-600"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-snug">
                    <p className="font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-600" />
                      Hak Akses Foto Dibatasi
                    </p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      Sesuai previlage, hanya <strong>Administrator</strong> dan <strong>Admin Gudang</strong> yang dapat mengganti foto/gambar barang. Akun Owner dapat mengubah nama, kategori, harga, dan menambahkan stok barang di bawah.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BASIC PRODUCT INFO */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                Nama Barang / Stok *
              </label>
              {canEditProductName && currentUser.role !== 'administrator' && (
                <span className="text-[10px] text-emerald-600 font-semibold">
                  ✓ Diizinkan untuk {currentUser.role === 'warehouse_admin' ? 'Admin Gudang' : 'Owner'}
                </span>
              )}
            </div>
            <input
              type="text"
              required
              disabled={!canEditProductName}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Beras Ramos Premium 5kg"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 font-medium ${
                canEditProductName
                  ? 'border-slate-200 focus:outline-none focus:border-orange-500'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">SKU / Kode Barang *</label>
                {!canEditFinanceFields && (
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Admin
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                disabled={!canEditFinanceFields}
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="BRS-RMS-05"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-slate-900 ${
                  canEditFinanceFields
                    ? 'border-slate-200 focus:outline-none focus:border-orange-500'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Barcode Pemindai</label>
                <div className="flex items-center gap-1.5">
                  {canEditFinanceFields && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          barcode: `899${Math.floor(100000000 + Math.random() * 900000000)}`,
                        }))
                      }
                      className="text-[10px] text-orange-600 hover:text-orange-700 font-bold underline"
                      title="Buat nomor barcode acak baru"
                    >
                      + Acak Barcode
                    </button>
                  )}
                  {!canEditFinanceFields && (
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>
              </div>
              <input
                type="text"
                disabled={!canEditFinanceFields}
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="899123456001"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-slate-900 ${
                  canEditFinanceFields
                    ? 'border-slate-200 focus:outline-none focus:border-orange-500'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                }`}
              />

              {/* Live Barcode Visual Preview */}
              {(formData.barcode || formData.sku) && (
                <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Pratinjau Garis Barcode Toko
                  </span>
                  <div className="bg-white p-1 rounded border border-slate-200">
                    <BarcodeSvg
                      value={formData.barcode || formData.sku || '00000000'}
                      width={1.2}
                      height={28}
                      fontSize={10}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Kategori &amp; Jenis Barang *
                </label>
                {canEditCategory && (
                  <button
                    type="button"
                    onClick={() => setIsQuickAddCategoryOpen(!isQuickAddCategoryOpen)}
                    className="text-[10px] text-orange-600 hover:text-orange-700 font-bold underline"
                  >
                    {isQuickAddCategoryOpen ? 'Tutup' : '+ Kategori Baru'}
                  </button>
                )}
              </div>

              {/* Quick Add Inline Form */}
              {isQuickAddCategoryOpen ? (
                <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 space-y-2 mb-2">
                  <div>
                    <label className="text-[10px] font-bold text-orange-900 block">Nama Kategori</label>
                    <input
                      type="text"
                      placeholder="e.g. Minuman Dingin"
                      value={quickCatName}
                      onChange={(e) => setQuickCatName(e.target.value)}
                      className="w-full text-xs px-2 py-1 bg-white border border-orange-300 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-orange-900 block">Jenis Barang</label>
                    <input
                      type="text"
                      placeholder="e.g. Minuman Botol Kemasan"
                      value={quickCatType}
                      onChange={(e) => setQuickCatType(e.target.value)}
                      className="w-full text-xs px-2 py-1 bg-white border border-orange-300 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsQuickAddCategoryOpen(false)}
                      className="px-2 py-0.5 text-[10px] font-medium text-slate-600 bg-white rounded border border-slate-200"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (quickCatName.trim()) {
                          const created = await addCategory({
                            name: quickCatName.trim(),
                            itemType: quickCatType.trim() || 'Barang Toko',
                            description: '',
                          });
                          setFormData({ ...formData, category: created.name });
                          setQuickCatName('');
                          setQuickCatType('');
                          setIsQuickAddCategoryOpen(false);
                        }
                      }}
                      className="px-2.5 py-0.5 text-[10px] font-bold text-white bg-orange-500 hover:bg-orange-600 rounded shadow-2xs"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <select
                      disabled={!canEditCategory}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 font-semibold ${
                        canEditCategory
                          ? 'border-slate-200 focus:outline-none focus:border-orange-500'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                      }`}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name} ({cat.itemType})
                        </option>
                      ))}
                      {/* Allow custom fallback if category not in list */}
                      {formData.category &&
                        !categories.some((c) => c.name.toLowerCase() === formData.category?.toLowerCase()) && (
                          <option value={formData.category}>{formData.category}</option>
                        )}
                    </select>
                  </div>

                  {/* Show corresponding jenis barang badge */}
                  {(() => {
                    const matched = categories.find(
                      (c) => c.name.toLowerCase() === formData.category?.toLowerCase()
                    );
                    if (matched) {
                      return (
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Jenis: <strong className="text-slate-700">{matched.itemType}</strong>
                        </span>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
              <input
                type="text"
                disabled={!canEditFinanceFields}
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Pcs, Karung, Pouch, Dus"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 ${
                  canEditFinanceFields
                    ? 'border-slate-200 focus:outline-none focus:border-orange-500'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Harga Modal / Beli (HPP) (Rp)
                </label>
                {!canEditFinanceFields && (
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Admin
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="500"
                disabled={!canEditFinanceFields}
                value={formData.costPrice || ''}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 font-bold ${
                  canEditFinanceFields
                    ? 'border-slate-200 focus:outline-none focus:border-orange-500'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Harga Jual Kasir (Rp) *
                </label>
                {!canEditFinanceFields && (
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Admin
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="500"
                required
                disabled={!canEditFinanceFields}
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 font-bold ${
                  canEditFinanceFields
                    ? 'border-slate-200 focus:outline-none focus:border-orange-500'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                }`}
              />
            </div>
          </div>

          {/* STOCK QUANTITY SECTION WITH ADD & REMOVE STOK CONTROLS FOR OWNER */}
          <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>Jumlah Kuantitas Stok *</span>
                {(currentUser.role === 'owner' || currentUser.role === 'administrator') && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Akses Tambah &amp; Hapus Stok Aktif
                  </span>
                )}
              </label>

              <span className="text-[11px] font-bold text-orange-600">
                Saat Ini: {formData.stock || 0} {formData.unit || 'unit'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                required
                disabled={!canAddStock}
                value={formData.stock !== undefined ? formData.stock : ''}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className={`w-32 px-3 py-2 bg-white border rounded-xl text-slate-900 font-bold text-sm ${
                  canAddStock
                    ? 'border-orange-300 focus:outline-none focus:border-orange-500 ring-2 ring-orange-500/10'
                    : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                }`}
              />

              {/* Quick stock adjustment buttons (Menambah & Menghapus Stok) */}
              {canAddStock && (
                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                  <span className="text-[10px] text-slate-500">Tambah:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, stock: (Number(prev.stock) || 0) + 1 }))
                    }
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-orange-50 hover:text-orange-600 font-bold text-[11px] text-slate-700"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, stock: (Number(prev.stock) || 0) + 5 }))
                    }
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-orange-50 hover:text-orange-600 font-bold text-[11px] text-slate-700"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, stock: (Number(prev.stock) || 0) + 10 }))
                    }
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-orange-50 hover:text-orange-600 font-bold text-[11px] text-slate-700"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, stock: (Number(prev.stock) || 0) + 50 }))
                    }
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-orange-50 hover:text-orange-600 font-bold text-[11px] text-slate-700"
                  >
                    +50
                  </button>

                  <span className="text-[10px] text-slate-500 ml-1">Kurangi:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        stock: Math.max(0, (Number(prev.stock) || 0) - 1),
                      }))
                    }
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 font-bold text-[11px] text-slate-700"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        stock: Math.max(0, (Number(prev.stock) || 0) - 5),
                      }))
                    }
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 font-bold text-[11px] text-slate-700"
                  >
                    -5
                  </button>

                  {/* Button Hapus Stok (Kosongkan stok ke 0) */}
                  {canDeleteStock && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Kosongkan kuantitas stok barang ini menjadi 0 unit?')) {
                          setFormData((prev) => ({ ...prev, stock: 0 }));
                        }
                      }}
                      className="ml-auto px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] transition-colors"
                      title="Hapus stok menjadi 0 unit"
                    >
                      Hapus Stok (0)
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-orange-200/60 flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-600">
                Batas Minimum Stok (Peringatan Menipis):
              </label>
              <input
                type="number"
                min="0"
                disabled={!canEditFinanceFields}
                value={formData.minStock || ''}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                className={`w-24 px-2 py-1 bg-white border rounded-lg text-slate-900 font-bold text-xs ${
                  canEditFinanceFields
                    ? 'border-slate-300 focus:outline-none focus:border-orange-500'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                }`}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {productToEdit && canDeleteProduct && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold flex items-center gap-1.5 transition-colors text-xs"
                  title="Hapus produk ini dari database"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Produk Ini</span>
                </button>
              )}

              {productToEdit && onPrintBarcode && (
                <button
                  type="button"
                  onClick={() => {
                    onPrintBarcode(productToEdit);
                  }}
                  className="px-3 py-2 rounded-xl text-slate-700 hover:text-orange-600 hover:bg-orange-50 border border-slate-300 font-bold flex items-center gap-1.5 transition-colors text-xs"
                  title="Cetak Label Barcode Produk Ini untuk Ditempelkan ke Barang"
                >
                  <Barcode className="w-4 h-4 text-orange-500" />
                  <span>Cetak Barcode</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/30"
              >
                <Save className="w-4 h-4" />
                <span>Simpan ke Database</span>
              </button>
            </div>
          </div>
        </form>

        {/* In-app Delete Confirmation Dialog */}
        {showDeleteConfirm && productToEdit && (
          <div className="absolute inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Hapus Produk dari Database?</h4>
              <p className="text-xs text-slate-600">
                Yakin ingin menghapus <strong>"{productToEdit.name}"</strong> secara permanen dari katalog KasirKu?
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await removeProduct(productToEdit.id);
                      setShowDeleteConfirm(false);
                      onClose();
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
