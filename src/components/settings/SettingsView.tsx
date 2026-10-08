import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Database,
  RefreshCw,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Server,
  FileCode,
  Barcode,
  Zap,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Package,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  UserPlus,
  Users,
  Tag,
  Volume2,
  VolumeX,
  Power,
  PowerOff,
  Layers,
  X,
  Lock,
  Search,
  QrCode,
  CreditCard,
  Upload,
  Image as ImageIcon,
  Building2,
  Sparkles,
  Save,
  Camera,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductCategory, StoreUser, UserRole } from '../../types';
import { ProfilePhotoCreator } from './ProfilePhotoCreator';

export const SettingsView: React.FC = () => {
  const {
    isFirebaseActive,
    products,
    transactions,
    stockOpnames,
    cashFlows,
    activityLogs,
    barcodeScannerMode,
    setBarcodeScannerMode,
    barcodeScannerAudio,
    setBarcodeScannerAudio,
    triggerBarcodeScan,
    scanFeedback,
    currentUser,
    canManageSystemUsers,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    systemUsers,
    addSystemUser,
    updateSystemUser,
    toggleSystemUserStatus,
    deleteSystemUser,
    qrisConfig,
    updateQrisConfig,
    speakPaymentSuccess,
    testVoiceAlerts,
  } = useStore();

  // Navigation tab inside Settings: 'users' | 'categories' | 'scanner' | 'payment'
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'users' | 'categories' | 'scanner' | 'payment'
  >('users');

  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [testBarcodeInput, setTestBarcodeInput] = useState<string>('');

  // ---------------- USER MANAGEMENT MODAL STATE ----------------
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>('create');
  const [userFormData, setUserFormData] = useState<{
    id?: string;
    username: string;
    password: string;
    name: string;
    role: UserRole;
    status: 'active' | 'disabled';
    email?: string;
    avatar?: string;
  }>({
    username: '',
    password: '',
    name: '',
    role: 'cashier',
    status: 'active',
  });
  const [showUserPassword, setShowUserPassword] = useState<boolean>(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

  // ---------------- CATEGORY MODAL STATE ----------------
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'create' | 'edit'>('create');
  const [categoryFormData, setCategoryFormData] = useState<{
    id?: string;
    name: string;
    itemType: string;
    description: string;
  }>({
    name: '',
    itemType: '',
    description: '',
  });
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');

  // ---------------- REAL BANK & QRIS SETTINGS STATE ----------------
  const [qrisSettingsForm, setQrisSettingsForm] = useState({
    bankName: qrisConfig.bankName || 'BCA',
    accountNumber: qrisConfig.accountNumber || '',
    accountHolder: qrisConfig.accountHolder || '',
    secondaryBankName: qrisConfig.secondaryBankName || '',
    secondaryAccountNumber: qrisConfig.secondaryAccountNumber || '',
    secondaryAccountHolder: qrisConfig.secondaryAccountHolder || '',
    qrisMerchantNmid: qrisConfig.qrisMerchantNmid || '',
  });
  const [paymentSavedMsg, setPaymentSavedMsg] = useState<string | null>(null);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const qrisFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQrisSettingsForm({
      bankName: qrisConfig.bankName || 'BCA',
      accountNumber: qrisConfig.accountNumber || '',
      accountHolder: qrisConfig.accountHolder || '',
      secondaryBankName: qrisConfig.secondaryBankName || '',
      secondaryAccountNumber: qrisConfig.secondaryAccountNumber || '',
      secondaryAccountHolder: qrisConfig.secondaryAccountHolder || '',
      qrisMerchantNmid: qrisConfig.qrisMerchantNmid || '',
    });
  }, [qrisConfig]);

  const handleUploadBankQrisImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Pilih file gambar berformat JPG, PNG, atau WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file gambar maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      if (base64) {
        updateQrisConfig({
          qrisImageUrl: base64,
          useOfficialBankQris: true,
        });
        setPaymentSavedMsg('Foto barcode QRIS resmi dari bank berhasil diunggah!');
        setTimeout(() => setPaymentSavedMsg(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBankQrisImage = () => {
    if (confirm('Hapus foto barcode QRIS yang diunggah?')) {
      updateQrisConfig({
        qrisImageUrl: '',
        useOfficialBankQris: false,
      });
      setPaymentSavedMsg('Foto QRIS berhasil dihapus.');
      setTimeout(() => setPaymentSavedMsg(null), 3000);
    }
  };

  const handleSaveBankSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateQrisConfig({
      bankName: qrisSettingsForm.bankName.trim() || 'BCA',
      accountNumber: qrisSettingsForm.accountNumber.trim(),
      accountHolder: qrisSettingsForm.accountHolder.trim(),
      secondaryBankName: qrisSettingsForm.secondaryBankName.trim(),
      secondaryAccountNumber: qrisSettingsForm.secondaryAccountNumber.trim(),
      secondaryAccountHolder: qrisSettingsForm.secondaryAccountHolder.trim(),
      qrisMerchantNmid: qrisSettingsForm.qrisMerchantNmid.trim(),
    });
    setPaymentSavedMsg('Pengaturan Rekening Bank & QRIS Toko Berhasil Disimpan!');
    setTimeout(() => setPaymentSavedMsg(null), 3500);
  };

  const handleTestPaymentVoice = () => {
    setIsTestingVoice(true);
    testVoiceAlerts();
    setTimeout(() => setIsTestingVoice(false), 8000); // Durasi estimasi suara
  };

  // ---------------- SELF PASSWORD CHANGE STATE ----------------
  const [ownPassword, setOwnPassword] = useState<string>('');
  const [ownConfirmPassword, setOwnConfirmPassword] = useState<string>('');
  const [showOwnPassword, setShowOwnPassword] = useState<boolean>(false);
  const [showOwnConfirmPassword, setShowOwnConfirmPassword] = useState<boolean>(false);
  const [ownAvatar, setOwnAvatar] = useState<string>('');
  const [ownProfileSuccessMsg, setOwnProfileSuccessMsg] = useState<string | null>(null);
  const [isPhotoStudioOpen, setIsPhotoStudioOpen] = useState<boolean>(false);

  const handleSaveOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!ownPassword.trim() && !ownAvatar) {
      alert('Ketik kata sandi baru atau pilih foto profil baru yang ingin diperbarui.');
      return;
    }

    if (ownPassword.trim()) {
      if (ownPassword.trim().length < 3) {
        alert('Kata sandi baru minimal 3 karakter.');
        return;
      }
      if (ownPassword.trim() !== ownConfirmPassword.trim()) {
        alert('Konfirmasi kata sandi tidak cocok dengan kata sandi baru. Mohon periksa kembali.');
        return;
      }
    }

    try {
      await updateSystemUser({
        ...currentUser,
        password: ownPassword.trim() || currentUser.password,
        avatar: ownAvatar || currentUser.avatar,
      });

      setOwnPassword('');
      setOwnConfirmPassword('');
      setOwnProfileSuccessMsg(`Kata sandi & foto profil akun Anda (${currentUser.name}) berhasil diperbarui!`);
      setTimeout(() => setOwnProfileSuccessMsg(null), 4500);
    } catch (err) {
      alert('Gagal memperbarui profil: ' + String(err));
    }
  };

  // ---------------- USER CRUD HANDLERS ----------------
  const openCreateUserModal = () => {
    if (!canManageSystemUsers) {
      alert(
        'Akses Ditolak: Fitur membuat akses login hanya berlaku di privilege Administrator saja.'
      );
      return;
    }
    setUserModalMode('create');
    setUserFormData({
      username: '',
      password: '',
      name: '',
      role: 'cashier',
      status: 'active',
      email: '',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    });
    setShowUserPassword(false);
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: StoreUser) => {
    const isSelf = currentUser?.id === user.id;
    if (!canManageSystemUsers && !isSelf) {
      alert(
        'Akses Ditolak: Anda hanya berhak mengedit kata sandi dan profil akun Anda sendiri. Pengelolaan akun pengguna lain dikhususkan untuk Administrator.'
      );
      return;
    }
    setUserModalMode('edit');
    setUserFormData({
      id: user.id,
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
      status: user.status,
      email: user.email,
      avatar: user.avatar,
    });
    setShowUserPassword(false);
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError(null);

    const isSelfEdit = userModalMode === 'edit' && currentUser?.id === userFormData.id;

    if (!canManageSystemUsers && !isSelfEdit) {
      setUserModalError(
        'Akses Ditolak: Anda hanya berwenang mengedit kata sandi dan profil akun Anda sendiri.'
      );
      return;
    }

    const cleanUsername = userFormData.username.trim().toLowerCase();
    if (!cleanUsername) {
      setUserModalError('Username wajib diisi.');
      return;
    }
    if (!userFormData.name.trim()) {
      setUserModalError('Nama lengkap wajib diisi.');
      return;
    }
    if (userModalMode === 'create' && !userFormData.password.trim()) {
      setUserModalError('Kata sandi wajib diisi untuk pengguna baru.');
      return;
    }

    // Check duplicate username
    const existing = systemUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername &&
        (userModalMode === 'create' || u.id !== userFormData.id)
    );
    if (existing) {
      setUserModalError(`Username "${cleanUsername}" sudah digunakan oleh ${existing.name}.`);
      return;
    }

    try {
      if (userModalMode === 'create') {
        await addSystemUser({
          username: cleanUsername,
          password: userFormData.password.trim(),
          name: userFormData.name.trim(),
          role: userFormData.role,
          roleName: getRoleBadge(userFormData.role).name,
          email: userFormData.email?.trim() || `${cleanUsername}@tokoalmas.id`,
          avatar:
            userFormData.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          status: userFormData.status,
        });
      } else if (userFormData.id) {
        const currentUserData = systemUsers.find((u) => u.id === userFormData.id);
        if (!currentUserData) return;

        await updateSystemUser({
          ...currentUserData,
          username: cleanUsername,
          password: userFormData.password.trim() || currentUserData.password,
          name: userFormData.name.trim(),
          role: userFormData.role,
          roleName: getRoleBadge(userFormData.role).name,
          status: userFormData.status,
          avatar: userFormData.avatar || currentUserData.avatar,
        });
      }
      setIsUserModalOpen(false);
    } catch (err) {
      setUserModalError('Gagal menyimpan pengguna: ' + String(err));
    }
  };

  const handleDeleteUser = async (user: StoreUser) => {
    if (!canManageSystemUsers) {
      alert('Akses Ditolak: Hanya privilege Administrator yang berwenang menghapus akun pengguna.');
      return;
    }

    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus akun akses "${user.name}" (@${user.username})? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    const res = await deleteSystemUser(user.id);
    if (!res.success) {
      alert(res.message);
    }
  };

  // ---------------- CATEGORY CRUD HANDLERS ----------------
  const openCreateCategoryModal = () => {
    setCategoryModalMode('create');
    setCategoryFormData({
      name: '',
      itemType: '',
      description: '',
    });
    setCategoryModalError(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: ProductCategory) => {
    setCategoryModalMode('edit');
    setCategoryFormData({
      id: cat.id,
      name: cat.name,
      itemType: cat.itemType,
      description: cat.description || '',
    });
    setCategoryModalError(null);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryModalError(null);

    const cleanName = categoryFormData.name.trim();
    const cleanType = categoryFormData.itemType.trim();

    if (!cleanName) {
      setCategoryModalError('Nama kategori wajib diisi.');
      return;
    }
    if (!cleanType) {
      setCategoryModalError('Jenis barang wajib diisi (misal: Bahan Pokok, Minuman Dingin, dll).');
      return;
    }

    // Check duplicate
    const existing = categories.find(
      (c) =>
        c.name.toLowerCase() === cleanName.toLowerCase() &&
        (categoryModalMode === 'create' || c.id !== categoryFormData.id)
    );
    if (existing) {
      setCategoryModalError(`Kategori dengan nama "${cleanName}" sudah ada.`);
      return;
    }

    try {
      if (categoryModalMode === 'create') {
        await addCategory({
          name: cleanName,
          itemType: cleanType,
          description: categoryFormData.description.trim(),
        });
      } else if (categoryFormData.id) {
        const cur = categories.find((c) => c.id === categoryFormData.id);
        if (!cur) return;
        await updateCategory({
          ...cur,
          name: cleanName,
          itemType: cleanType,
          description: categoryFormData.description.trim(),
        });
      }
      setIsCategoryModalOpen(false);
    } catch (err) {
      setCategoryModalError('Gagal menyimpan kategori: ' + String(err));
    }
  };

  const handleDeleteCategory = async (cat: ProductCategory) => {
    const productsInCat = products.filter(
      (p) => p.category.toLowerCase() === cat.name.toLowerCase()
    );
    const countWarning =
      productsInCat.length > 0
        ? `\nPerhatian: Ada ${productsInCat.length} produk di katalog yang menggunakan kategori ini!`
        : '';

    if (
      !confirm(
        `Hapus kategori "${cat.name}" (Jenis: ${cat.itemType}) dari sistem?${countWarning}`
      )
    ) {
      return;
    }
    await deleteCategory(cat.id);
  };

  // ---------------- BEEP TEST HANDLER ----------------
  const handleTestBeep = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(key);
    setTimeout(() => setCopiedPath(null), 1500);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'administrator':
        return {
          name: 'Administrator',
          style: 'bg-purple-100 text-purple-800 border-purple-200',
          desc: 'Full akses + Log Evidence forensik & master setting',
        };
      case 'owner':
        return {
          name: 'Owner (Pemilik Toko)',
          style: 'bg-amber-100 text-amber-800 border-amber-200',
          desc: 'Monitoring, ubah nama/kategori barang & kelola stok',
        };
      case 'warehouse_admin':
        return {
          name: 'Admin Gudang',
          style: 'bg-blue-100 text-blue-800 border-blue-200',
          desc: 'Audit stok opname fisik & inventaris gudang',
        };
      case 'cashier':
        return {
          name: 'Kasir',
          style: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          desc: 'Transaksi kasir POS & riwayat faktur nota',
        };
    }
  };

  // Filtered users & categories
  const filteredUsers = systemUsers.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const filteredCategories = categories.filter((c) => {
    const q = categorySearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.itemType.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
                <Settings className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Pengaturan Sistem KasirKu
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kelola akses login real sistem, tambah kategori &amp; jenis barang, serta konfigurasi scanner barcode &amp; rekening QRIS bank real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">
              Sesi Anda:
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {currentUser ? `${currentUser.name} (${currentUser.role})` : 'Belum Login'}
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-100 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveSettingsTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSettingsTab === 'users'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Akses Login Sistem</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeSettingsTab === 'users'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {systemUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSettingsTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSettingsTab === 'categories'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kategori &amp; Jenis Barang</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeSettingsTab === 'categories'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSettingsTab('scanner')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSettingsTab === 'scanner'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>Pengaturan Scan Barcode</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold uppercase ${
                barcodeScannerMode ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {barcodeScannerMode ? 'Aktif' : 'Mati'}
            </span>
          </button>

          <button
            onClick={() => setActiveSettingsTab('payment')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSettingsTab === 'payment'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Bank &amp; QRIS Real</span>
            {qrisConfig.qrisImageUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: MANAJEMEN AKSES LOGIN SISTEM & GANTI PASSWORD SAYA     */}
      {/* ============================================================== */}
      {activeSettingsTab === 'users' && (
        <div className="space-y-4">
          {/* Panel Ganti Kata Sandi & Profil Akun Saya (Untuk Semua Privilege Role) */}
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 p-4 sm:p-6 rounded-2xl border border-orange-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-orange-200/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-500 text-white rounded-xl shadow-xs shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    <span>Setingan Profil &amp; Kata Sandi Petugas</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-100 text-orange-800 border border-orange-200">
                      Privilege: {currentUser?.roleName || currentUser?.role}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Ubah foto profil &amp; kata sandi akun Anda ({currentUser?.name}) secara mandiri.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 font-mono px-2.5 py-1 rounded-lg bg-white/80 border border-orange-200">
                  @{currentUser?.username}
                </span>
              </div>
            </div>

            {/* Success Banner */}
            {ownProfileSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{ownProfileSuccessMsg}</span>
              </div>
            )}

            {/* Form Container: Symmetrical 2-Box Grid */}
            <form onSubmit={handleSaveOwnProfile} className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 pt-1">
              {/* Left Box (xl:col-span-4): Compact Avatar & Photo Studio Action */}
              <div className="xl:col-span-4 bg-white p-4 rounded-2xl border border-orange-200/80 shadow-2xs flex flex-col justify-between space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Foto Profil Saya
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={ownAvatar || currentUser?.avatar}
                        alt={currentUser?.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-orange-400 ring-2 ring-orange-100 shadow-xs"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                        <Camera className="w-3 h-3" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{currentUser?.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono truncate">@{currentUser?.username}</p>
                      <span className="inline-block mt-0.5 text-[9px] font-extrabold uppercase px-2 py-0.2 rounded bg-orange-50 text-orange-700 border border-orange-200">
                        {currentUser?.roleName || currentUser?.role}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPhotoStudioOpen(!isPhotoStudioOpen)}
                  className="w-full py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isPhotoStudioOpen ? 'Tutup Pilihan Foto' : 'Ganti / Buat Foto Profil'}</span>
                </button>
              </div>

              {/* Right Box (xl:col-span-8): Kata Sandi Baru Inputs */}
              <div className="xl:col-span-8 bg-white p-4 rounded-2xl border border-orange-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* New Password Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Kata Sandi Baru *
                    </label>
                    <div className="relative">
                      <input
                        type={showOwnPassword ? 'text' : 'password'}
                        placeholder="Ketik kata sandi baru Anda..."
                        value={ownPassword}
                        onChange={(e) => setOwnPassword(e.target.value)}
                        className="w-full text-xs pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono text-slate-800 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOwnPassword(!showOwnPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center"
                        title={showOwnPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showOwnPassword ? <EyeOff className="w-4 h-4 text-orange-600" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Konfirmasi Kata Sandi Baru *
                    </label>
                    <div className="relative">
                      <input
                        type={showOwnConfirmPassword ? 'text' : 'password'}
                        placeholder="Ulangi kata sandi baru..."
                        value={ownConfirmPassword}
                        onChange={(e) => setOwnConfirmPassword(e.target.value)}
                        className="w-full text-xs pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono text-slate-800 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOwnConfirmPassword(!showOwnConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center"
                        title={showOwnConfirmPassword ? 'Sembunyikan' : 'Lihat'}
                      >
                        {showOwnConfirmPassword ? <EyeOff className="w-4 h-4 text-orange-600" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Row */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap">
                  <span className="text-[11px] text-slate-400">
                    Sandi minimal 3 karakter. Klik Simpan untuk memperbarui.
                  </span>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-xs font-bold shadow-sm shadow-orange-500/25 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Kata Sandi Baru</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Collapsible Photo Creator Studio */}
            {isPhotoStudioOpen && (
              <div className="p-4 bg-white rounded-2xl border border-orange-200 shadow-2xs space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <span>Studio Foto &amp; Avatar Petugas</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsPhotoStudioOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <ProfilePhotoCreator
                  avatar={ownAvatar || currentUser?.avatar || ''}
                  onChangeAvatar={(url) => {
                    setOwnAvatar(url);
                  }}
                  userName={currentUser?.name || ''}
                  userRole={currentUser?.roleName || currentUser?.role}
                />
              </div>
            )}
          </div>

          {/* Daftar Akun Login & Pengelolaan Privilege (HANYA DITAMPILKAN UNTUK PRIVILEGE OWNER & ADMINISTRATOR) */}
          {(currentUser?.role === 'owner' || currentUser?.role === 'administrator') && (
            <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0" />
                    <h3 className="text-base font-bold text-slate-900">
                      Daftar Akun Login &amp; Pengelolaan Privilege
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Hanya tampil di akun Owner &amp; Administrator. Pengelolaan penuh (membuat akun, menghapus, serta menonaktifkan akun) dikhususkan untuk Administrator.
                  </p>
                </div>

                {canManageSystemUsers ? (
                  <button
                    type="button"
                    onClick={openCreateUserModal}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm shadow-orange-500/25 transition-all w-full sm:w-auto shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Tambah Akses Login Baru</span>
                  </button>
                ) : (
                  <div
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold cursor-not-allowed select-none w-full sm:w-auto shrink-0"
                    title="Hanya privilege Administrator yang berwenang membuat akun login baru"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>+ Tambah Akses (Khusus Admin)</span>
                  </div>
                )}
              </div>

              {/* Privilege Notice for Owner */}
              {!canManageSystemUsers && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-900 text-xs flex items-start gap-3 shadow-2xs">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-950">
                      Mode Pemantauan Akun (Owner)
                    </p>
                    <p className="text-amber-800 leading-relaxed">
                      Sebagai Owner, Anda berhak memantau seluruh daftar akun login petugas dan aktivitas terakhirnya. Namun pembuatan akun baru, penonaktifan akun, dan penghapusan akun dikhususkan untuk privilege Administrator.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Stat Pill Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Akun</span>
                  <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{systemUsers.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Akun Aktif</span>
                  <p className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5">
                    {systemUsers.filter((u) => u.status === 'active').length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80">
                  <span className="text-[10px] uppercase font-bold text-rose-600">Akun Nonaktif</span>
                  <p className="text-lg sm:text-xl font-black text-rose-700 mt-0.5">
                    {systemUsers.filter((u) => u.status === 'disabled').length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80">
                  <span className="text-[10px] uppercase font-bold text-purple-600">Hak Akses</span>
                  <p className="text-lg sm:text-xl font-black text-purple-700 mt-0.5">4 Role</p>
                </div>
              </div>

              {/* Search Filter */}
              <div className="relative pt-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari akun login berdasarkan nama, username, atau role..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              {/* Mobile Card View (HP / Small Screens: < 768px) */}
              <div className="block md:hidden space-y-3 pt-1">
                {filteredUsers.map((user) => {
                  const badge = getRoleBadge(user.role);
                  const isSelf = currentUser?.id === user.id;
                  const isActive = user.status === 'active';

                  return (
                    <div
                      key={user.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        !isActive ? 'bg-rose-50/20 border-rose-200/60' : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className={`w-11 h-11 rounded-full object-cover border-2 shrink-0 ${
                              !isActive ? 'grayscale opacity-60 border-slate-200' : 'border-orange-200 ring-2 ring-orange-50'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-slate-900 text-sm truncate">{user.name}</h4>
                              {isSelf && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase bg-orange-100 text-orange-700 border border-orange-200 shrink-0">
                                  Akun Saya
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">@{user.username}</p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border shrink-0 ${badge.style}`}
                        >
                          {badge.name.split(' ')[0]}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Nonaktif
                            </span>
                          )}
                        </div>

                        <div>
                          {canManageSystemUsers ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleSystemUserStatus(user.id)}
                                disabled={isSelf && isActive}
                                className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                                  isActive
                                    ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                } disabled:opacity-40`}
                                title="Toggle status aktif/nonaktif"
                              >
                                {isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditUserModal(user)}
                                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 hover:bg-slate-100"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                disabled={isSelf}
                                className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 disabled:opacity-40 hover:bg-rose-100"
                                title="Hapus akun"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : isSelf ? (
                            <button
                              type="button"
                              onClick={() => openEditUserModal(user)}
                              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Ganti Password / Edit Profil</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Terkunci (Admin only)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (Tablet & Laptop: >= 768px) */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Pengguna &amp; Profil</th>
                      <th className="py-3 px-4">Username Akses</th>
                      <th className="py-3 px-4">Role Privilege</th>
                      <th className="py-3 px-4">Status Akun</th>
                      <th className="py-3 px-4">Terakhir Masuk</th>
                      <th className="py-3 px-4 text-center">Aksi Manajemen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => {
                      const badge = getRoleBadge(user.role);
                      const isSelf = currentUser?.id === user.id;
                      const isActive = user.status === 'active';

                      return (
                        <tr
                          key={user.id}
                          className={`transition-colors ${
                            !isActive ? 'bg-rose-50/30 text-slate-400' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className={`w-9 h-9 rounded-full object-cover border ${
                                  !isActive ? 'grayscale opacity-60' : 'border-slate-200'
                                }`}
                              />
                              <div>
                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {isSelf && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase bg-orange-100 text-orange-700 border border-orange-200">
                                      Sedang Digunakan
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800">
                              @{user.username}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${badge.style}`}
                            >
                              {badge.name}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">{badge.desc}</p>
                          </td>

                          <td className="py-3 px-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Aktif (Enabled)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Nonaktif (Disabled)
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>

                          <td className="py-3 px-4 text-center">
                            {canManageSystemUsers ? (
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Toggle Enable / Disable */}
                                <button
                                  type="button"
                                  onClick={() => toggleSystemUserStatus(user.id)}
                                  disabled={isSelf && isActive}
                                  title={
                                    isSelf && isActive
                                      ? 'Tidak dapat menonaktifkan akun sendiri'
                                      : isActive
                                      ? 'Nonaktifkan akses login akun ini'
                                      : 'Aktifkan kembali akses login akun ini'
                                  }
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    isActive
                                      ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                  {isActive ? (
                                    <PowerOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Power className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {/* Edit Button */}
                                <button
                                  type="button"
                                  onClick={() => openEditUserModal(user)}
                                  title="Edit data login, username, kata sandi & foto profil"
                                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={isSelf}
                                  title={
                                    isSelf
                                      ? 'Tidak dapat menghapus akun sendiri'
                                      : 'Hapus akun dari sistem'
                                  }
                                  className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : isSelf ? (
                              <button
                                type="button"
                                onClick={() => openEditUserModal(user)}
                                title="Ganti kata sandi & edit profil akun Anda"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-all shadow-2xs"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Ganti Password / Edit Profil</span>
                              </button>
                            ) : (
                              <div
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-[11px] font-semibold select-none cursor-not-allowed"
                                title="Pengelolaan akun pengguna lain dikhususkan untuk Administrator"
                              >
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>Terkunci</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Petunjuk Akses Login Sistem:</span>
                </p>
                <p>
                  • Setiap petugas dapat mengubah kata sandi akunnya sendiri secara mandiri kapan saja.
                </p>
                <p>
                  • Saat akun di-<strong>Disable (Nonaktif)</strong> oleh Administrator, petugas yang mencoba login dengan username tersebut akan ditolak.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: MANAJEMEN KATEGORI BARANG & JENIS BARANG                */}
      {/* ============================================================== */}
      {activeSettingsTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Master Kategori Barang &amp; Jenis Barang Toko
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Tambahkan kategori barang baru dan tentukan jenis barangnya (misal: Sembako, Minuman Kemasan, Makanan Ringan, Bumbu Dapur).
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateCategoryModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm shadow-orange-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Kategori / Jenis Barang</span>
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative pt-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kategori atau jenis barang..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCategories.map((cat) => {
                const count = products.filter(
                  (p) => p.category.toLowerCase() === cat.name.toLowerCase()
                ).length;

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-orange-300 hover:shadow-2xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-lg bg-orange-50 text-orange-600 border border-orange-200/60">
                            <Tag className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                              Jenis: {cat.itemType}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditCategoryModal(cat)}
                            title="Edit Kategori & Jenis Barang"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            title="Hapus Kategori"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Terdaftar di Katalog:</span>
                      <span className="font-bold text-slate-800 px-2 py-0.5 rounded-full bg-slate-100">
                        {count} Produk
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: PENGATURAN SCAN BARCODE                                */}
      {/* ============================================================== */}
      {activeSettingsTab === 'scanner' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            {/* Main Toggle Barcode Scanner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-orange-50/50 border border-orange-200/70">
              <div className="flex items-start gap-3">
                <div
                  className={`p-3 rounded-xl ${
                    barcodeScannerMode
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Barcode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Aktifkan Fitur Scan Barcode
                    </h3>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        barcodeScannerMode
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {barcodeScannerMode ? 'Fitur Aktif' : 'Fitur Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    Ketika diaktifkan, alat barcode scanner fisik (USB/Bluetooth) akan otomatis mendeteksi kode produk dan langsung menambahkannya ke keranjang kasir (Point of Sale) tanpa perlu klik mouse.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-slate-700">
                  {barcodeScannerMode ? 'AKTIF' : 'NONAKTIF'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={barcodeScannerMode}
                  onClick={() => setBarcodeScannerMode(!barcodeScannerMode)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    barcodeScannerMode ? 'bg-orange-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      barcodeScannerMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Audio Beep Settings */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    barcodeScannerAudio
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {barcodeScannerAudio ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Suara Beep Kasir (Audio Feedback)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Memainkan nada &quot;beep&quot; khas kasir ritel setiap kali pemindai barcode berhasil membaca kode produk.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleTestBeep}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                >
                  Cek Suara Beep
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={barcodeScannerAudio}
                  onClick={() => setBarcodeScannerAudio(!barcodeScannerAudio)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    barcodeScannerAudio ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      barcodeScannerAudio ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Direct Barcode Lookup */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Verifikasi &amp; Pemindaian Barcode:
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik atau scan barcode barang..."
                  value={testBarcodeInput}
                  onChange={(e) => setTestBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && testBarcodeInput.trim()) {
                      triggerBarcodeScan(testBarcodeInput.trim());
                      setTestBarcodeInput('');
                    }
                  }}
                  className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (testBarcodeInput.trim()) {
                      triggerBarcodeScan(testBarcodeInput.trim());
                      setTestBarcodeInput('');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs"
                >
                  Pindai Barcode
                </button>
              </div>

              {scanFeedback && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    scanFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {scanFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{scanFeedback.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: BANK & QRIS REAL (UPLOAD FOTO QRIS & INPUT NO REKENING)    */}
      {/* ============================================================== */}
      {activeSettingsTab === 'payment' && (
        <div className="space-y-4">
          {/* Success Banner */}
          {paymentSavedMsg && (
            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-md shadow-emerald-600/20 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{paymentSavedMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setPaymentSavedMsg(null)}
                className="p-1 hover:bg-white/20 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Hidden File Input for Real Bank QRIS Image */}
          <input
            type="file"
            ref={qrisFileInputRef}
            onChange={handleUploadBankQrisImage}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Upload Gambar Barcode QRIS Resmi Bank (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Foto Barcode QRIS Resmi dari Bank
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Upload foto barcode asli dari bank Anda
                    </p>
                  </div>
                </div>

                {qrisConfig.qrisImageUrl ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
                      <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 inline-block mb-3">
                        <img
                          src={qrisConfig.qrisImageUrl}
                          alt="QRIS Bank Asli"
                          className="w-56 h-56 object-contain rounded-lg bg-white"
                        />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Barcode Real dari Bank Aktif</span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Foto ini tampil otomatis saat konsumen memilih pembayaran QRIS di kasir.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => qrisFileInputRef.current?.click()}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Ganti Gambar Barcode</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveBankQrisImage}
                        className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-bold border border-slate-200 transition-colors"
                        title="Hapus foto barcode QRIS"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      onClick={() => qrisFileInputRef.current?.click()}
                      className="border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/50 hover:bg-orange-50/80 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center text-orange-600 transition-colors">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Unggah Foto Barcode QRIS Resmi dari Bank
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                          Jika sudah menerima stiker/file QRIS dari Bank (BCA, Mandiri, BRI, BNI, Dana, GoPay), klik untuk mengunggah gambarnya di sini.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-orange-200 text-orange-700 text-xs font-bold shadow-2xs">
                        <ImageIcon className="w-4 h-4" />
                        <span>Pilih Gambar (JPG, PNG, WebP)</span>
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <span>💡</span>
                        <span>Petunjuk Barcode Bank Real:</span>
                      </p>
                      <p className="text-[11px] leading-relaxed text-amber-700">
                        Anda dapat mengunduh gambar QRIS dari aplikasi m-banking atau screenshot lembar QRIS resmi bank Anda, lalu upload langsung melalui tombol di atas.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sound Test Panel for QRIS "Pembayaran Berhasil" */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Suara &quot;Pembayaran Berhasil&quot;
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Otomatis berbunyi saat transaksi QRIS selesai
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestPaymentVoice}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      isTestingVoice
                        ? 'bg-emerald-600 text-white border-emerald-600 scale-98 shadow-sm'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isTestingVoice ? 'Memutar...' : 'Uji Suara'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>
                    Fitur suara menggunakan kombinasi lonceng kasir Web Audio + suara ucapan manusia Indonesia (TTS) &quot;Pembayaran QRIS berhasil! Terima kasih.&quot;
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Input No. Rekening Bank & Identitas Toko (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-4">
              <form onSubmit={handleSaveBankSettings} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Input Nomor Rekening Bank Toko
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Digunakan saat konsumen membayar via Transfer Bank di kasir
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                    Real Bank Data
                  </span>
                </div>

                {/* Rekening Utama */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                      Rekening Bank Utama (Wajib)
                    </span>
                    <span className="text-[11px] text-slate-400">Tampil paling atas di kasir</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Bank
                      </label>
                      <input
                        type="text"
                        required
                        value={qrisSettingsForm.bankName}
                        onChange={(e) =>
                          setQrisSettingsForm({ ...qrisSettingsForm, bankName: e.target.value })
                        }
                        placeholder="Contoh: BCA, MANDIRI, BRI, BNI"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor Rekening
                      </label>
                      <input
                        type="text"
                        required
                        value={qrisSettingsForm.accountNumber}
                        onChange={(e) =>
                          setQrisSettingsForm({ ...qrisSettingsForm, accountNumber: e.target.value })
                        }
                        placeholder="Contoh: 8820193321"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Pemilik Rekening (Atas Nama)
                    </label>
                    <input
                      type="text"
                      required
                      value={qrisSettingsForm.accountHolder}
                      onChange={(e) =>
                        setQrisSettingsForm({ ...qrisSettingsForm, accountHolder: e.target.value })
                      }
                      placeholder="Contoh: KASIRKU RETAIL / NAMA PEMILIK"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Rekening Kedua / Cadangan */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Rekening Bank Kedua / Cadangan (Opsional)
                    </span>
                    <span className="text-[11px] text-slate-400">Alternatif pembayaran</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Bank 2
                      </label>
                      <input
                        type="text"
                        value={qrisSettingsForm.secondaryBankName}
                        onChange={(e) =>
                          setQrisSettingsForm({
                            ...qrisSettingsForm,
                            secondaryBankName: e.target.value,
                          })
                        }
                        placeholder="Contoh: MANDIRI, BSI, SEABANK"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor Rekening 2
                      </label>
                      <input
                        type="text"
                        value={qrisSettingsForm.secondaryAccountNumber}
                        onChange={(e) =>
                          setQrisSettingsForm({
                            ...qrisSettingsForm,
                            secondaryAccountNumber: e.target.value,
                          })
                        }
                        placeholder="Nomor rekening kedua"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Atas Nama Rekening 2
                    </label>
                    <input
                      type="text"
                      value={qrisSettingsForm.secondaryAccountHolder}
                      onChange={(e) =>
                        setQrisSettingsForm({
                          ...qrisSettingsForm,
                          secondaryAccountHolder: e.target.value,
                        })
                      }
                      placeholder="Atas nama pemilik rekening kedua"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* NMID Merchant ID QRIS Resmi */}
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    NMID QRIS Resmi Bank (National Merchant ID - Opsional)
                  </label>
                  <input
                    type="text"
                    value={qrisSettingsForm.qrisMerchantNmid}
                    onChange={(e) =>
                      setQrisSettingsForm({
                        ...qrisSettingsForm,
                        qrisMerchantNmid: e.target.value,
                      })
                    }
                    placeholder="Contoh: ID1020038812903"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400">
                    Nomor identitas merchant terdaftar pada Bank Indonesia / ASPI
                  </p>
                </div>

                {/* Save Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Perubahan langsung aktif di menu kasir POS
                  </span>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-orange-500/30 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Rekening &amp; QRIS</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: TAMBAH / EDIT AKSES LOGIN SISTEM                        */}
      {/* ============================================================== */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {userModalMode === 'create'
                    ? 'Tambah Akses Login Baru'
                    : currentUser?.id === userFormData.id
                    ? 'Ganti Password & Edit Profil Saya'
                    : 'Edit Akses Login Sistem'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 overflow-y-auto flex-1">
              {userModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{userModalError}</span>
                </div>
              )}

              {/* Fitur Buat Foto Profil Petugas (Creat Foto Profil) */}
              <ProfilePhotoCreator
                avatar={userFormData.avatar || ''}
                onChangeAvatar={(newAvatar) =>
                  setUserFormData((prev) => ({ ...prev, avatar: newAvatar }))
                }
                userName={userFormData.name}
                userRole={userFormData.role}
              />

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Username Akses Login *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: kasir_pagi, owner, gudang, dll..."
                  value={userFormData.username}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })
                  }
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-orange-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Gunakan huruf kecil atau angka tanpa spasi.
                </span>
              </div>

              {/* Password with Eye Makesure Logo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Kata Sandi (Password) *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Klik ikon mata untuk memastikan
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showUserPassword ? 'text' : 'password'}
                    required={userModalMode === 'create'}
                    placeholder={
                      userModalMode === 'edit'
                        ? 'Kosongkan jika tidak ingin mengubah kata sandi'
                        : 'Masukkan kata sandi akun...'
                    }
                    value={userFormData.password}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, password: e.target.value })
                    }
                    className="w-full text-xs pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    title={showUserPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi (Make sure)'}
                  >
                    {showUserPassword ? (
                      <EyeOff className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nama Lengkap Petugas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Siti Aminah"
                  value={userFormData.name}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, name: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Role Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Pilih Tingkat Hak Akses (Role Privilege) *
                  </label>
                  {!canManageSystemUsers && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Dikunci Admin
                    </span>
                  )}
                </div>
                <select
                  disabled={!canManageSystemUsers}
                  value={userFormData.role}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      role: e.target.value as UserRole,
                    })
                  }
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-orange-500 disabled:opacity-60 disabled:bg-slate-100"
                >
                  <option value="administrator">
                    1. Administrator (Akses Penuh &amp; Log Evidence)
                  </option>
                  <option value="owner">
                    2. Owner / Pemilik Toko (Akses Terpadu &amp; Kelola Stok)
                  </option>
                  <option value="cashier">
                    3. Kasir (Transaksi Kasir POS &amp; Faktur Penjualan)
                  </option>
                  <option value="warehouse_admin">
                    4. Admin Gudang (Stok Opname &amp; Inventaris Fisik)
                  </option>
                </select>
              </div>

              {/* Status Enable / Disable */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Status Akses Login
                  </label>
                  {!canManageSystemUsers && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Dikunci Admin
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!canManageSystemUsers}
                    onClick={() => setUserFormData({ ...userFormData, status: 'active' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      userFormData.status === 'active'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <Power className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Aktif (Enabled)</span>
                  </button>

                  <button
                    type="button"
                    disabled={!canManageSystemUsers}
                    onClick={() => setUserFormData({ ...userFormData, status: 'disabled' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      userFormData.status === 'disabled'
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <PowerOff className="w-3.5 h-3.5 text-rose-600" />
                    <span>Nonaktif (Disabled)</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm shadow-orange-500/25"
                >
                  Simpan Akses Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: TAMBAH / EDIT KATEGORI & JENIS BARANG                   */}
      {/* ============================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {categoryModalMode === 'create'
                    ? 'Tambah Kategori & Jenis Barang Baru'
                    : 'Edit Kategori & Jenis Barang'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              {categoryModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{categoryModalError}</span>
                </div>
              )}

              {/* Nama Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nama Kategori Barang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Sembako, Minuman Kemasan, Makanan Ringan..."
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, name: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-semibold"
                />
              </div>

              {/* Jenis Barang */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Jenis Barang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Bahan Pokok Pangan, Minuman Botol & Dingin, Bumbu Dapur..."
                  value={categoryFormData.itemType}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, itemType: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Klasifikasi turunan jenis barang yang dijual.
                </span>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Deskripsi / Contoh Produk
                </label>
                <textarea
                  rows={2}
                  placeholder="contoh: Beras Ramos, Minyak Goreng Bimoli, Gula Gulaku..."
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm shadow-orange-500/25"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
