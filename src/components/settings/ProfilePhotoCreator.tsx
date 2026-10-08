import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Users,
  Link,
  Check,
  RotateCcw,
  AlertCircle,
  Video,
  VideoOff,
  Image as ImageIcon,
} from 'lucide-react';

interface ProfilePhotoCreatorProps {
  avatar: string;
  onChangeAvatar: (newAvatarUrl: string) => void;
  userName?: string;
  userRole?: string;
}

// 8 curated store staff preset avatars
const PRESET_AVATARS = [
  {
    id: 'male_cashier_1',
    label: 'Kasir Pria Muda',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'female_cashier_1',
    label: 'Kasir Wanita',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'female_hijab_1',
    label: 'Petugas Wanita Berhijab',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'male_admin_1',
    label: 'Admin Kacamata',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'male_owner_1',
    label: 'Owner / KasirKu',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'male_warehouse_1',
    label: 'Petugas Gudang',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'female_staff_2',
    label: 'Petugas Kasir Ramah',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'male_senior_1',
    label: 'Petugas Senior',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  },
];

// Color gradient palettes for dynamic initials avatar creator
const COLOR_PALETTES = [
  { name: 'Oranye Almas', from: '#f97316', to: '#ea580c' },
  { name: 'Hijau Zamrud', from: '#10b981', to: '#059669' },
  { name: 'Biru Indigo', from: '#6366f1', to: '#4338ca' },
  { name: 'Ungu Violet', from: '#a855f7', to: '#7e22ce' },
  { name: 'Merah Rose', from: '#f43f5e', to: '#be123c' },
  { name: 'Kuning Amber', from: '#f59e0b', to: '#b45309' },
  { name: 'Biru Lautan', from: '#06b6d4', to: '#0e7490' },
  { name: 'Dark Slate', from: '#475569', to: '#1e293b' },
];

export const ProfilePhotoCreator: React.FC<ProfilePhotoCreatorProps> = ({
  avatar,
  onChangeAvatar,
  userName = 'Petugas Toko',
  userRole = 'cashier',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'initials' | 'presets' | 'url'>('upload');
  const [isCreatorExpanded, setIsCreatorExpanded] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [customInitials, setCustomInitials] = useState<string>('');
  const [selectedPaletteIdx, setSelectedPaletteIdx] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Cleanup camera stream on unmount or tab change
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'camera') {
      stopCameraStream();
    }
  }, [activeTab]);

  // Generate initials string
  const getComputedInitials = () => {
    if (customInitials.trim()) return customInitials.trim().toUpperCase().slice(0, 2);
    const clean = userName.trim();
    if (!clean) return 'AL';
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  // Helper to build SVG Initials data URL
  const buildInitialsAvatarUrl = (initials: string, paletteIndex: number) => {
    const palette = COLOR_PALETTES[paletteIndex] || COLOR_PALETTES[0];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="palGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.from}" />
          <stop offset="100%" stop-color="${palette.to}" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="100" fill="url(#palGrad)" />
      <circle cx="100" cy="100" r="92" fill="none" stroke="#ffffff" stroke-width="4" stroke-opacity="0.25" />
      <text x="50%" y="54%" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="76" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">
        ${initials}
      </text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // Handle Initials Creation
  const handleApplyInitials = (paletteIdx: number) => {
    setSelectedPaletteIdx(paletteIdx);
    const inits = getComputedInitials();
    const dataUrl = buildInitialsAvatarUrl(inits, paletteIdx);
    onChangeAvatar(dataUrl);
    setErrorMsg(null);
  };

  // Handle File Upload with Automatic Square Crop & Client-side Compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    try {
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            onChangeAvatar(readerEvent.target?.result as string);
            return;
          }

          // Center crop to 1:1 square
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          onChangeAvatar(compressedDataUrl);
        };
        img.onerror = () => {
          setErrorMsg('Gagal memproses file gambar. Silakan coba file lain.');
        };
        img.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setErrorMsg('Gagal mengunggah foto: ' + String(err));
    }
  };

  // Start Camera
  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 480 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      setCameraError(
        'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di peramban Anda.'
      );
      setIsCameraActive(false);
    }
  };

  // Capture Photo from Camera
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const videoWidth = video.videoWidth || 480;
      const videoHeight = video.videoHeight || 480;
      const minDim = Math.min(videoWidth, videoHeight);
      const startX = (videoWidth - minDim) / 2;
      const startY = (videoHeight - minDim) / 2;

      // Draw mirrored for natural selfie experience
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size);

      const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      onChangeAvatar(capturedDataUrl);
      stopCameraStream();
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg('Gagal mengambil gambar dari kamera: ' + String(err));
    }
  };

  // Apply custom URL
  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) {
      setErrorMsg('Masukkan URL gambar yang valid.');
      return;
    }
    onChangeAvatar(customUrlInput.trim());
    setErrorMsg(null);
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200">
      {/* Header & Live Preview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <img
              src={avatar || buildInitialsAvatarUrl(getComputedInitials(), 0)}
              alt="Foto Profil Petugas"
              className="w-16 h-16 rounded-full object-cover ring-3 ring-orange-500/30 shadow-md bg-white border border-slate-200"
            />
            <button
              type="button"
              onClick={() => setIsCreatorExpanded(!isCreatorExpanded)}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
              title="Buat atau ubah foto profil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Foto Profil Petugas
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-orange-100 text-orange-700">
                {userRole.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Buat foto profil untuk akun login kasir &amp; petugas toko
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatorExpanded(!isCreatorExpanded)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            isCreatorExpanded
              ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs shadow-orange-500/25'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{isCreatorExpanded ? 'Tutup Pilihan Foto' : 'Buat / Atur Foto'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Expandable Photo Creator Studio */}
      {isCreatorExpanded && (
        <div className="pt-3 border-t border-slate-200 space-y-3 animate-in fade-in duration-200">
          {/* Method Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-orange-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'camera'
                  ? 'bg-white text-orange-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('initials')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'initials'
                  ? 'bg-white text-orange-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inisial Warna</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'presets'
                  ? 'bg-white text-orange-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Koleksi Foto</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all col-span-2 sm:col-span-1 ${
                activeTab === 'url'
                  ? 'bg-white text-orange-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>Link URL</span>
            </button>
          </div>

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-center space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-orange-300 hover:border-orange-500 rounded-xl p-4 bg-orange-50/40 hover:bg-orange-50/80 transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Klik untuk Memilih Foto dari HP / Komputer
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mendukung JPG, PNG, WEBP (Otomatis dipotong rapi 1:1)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CAMERA SNAPSHOT */}
          {activeTab === 'camera' && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 text-center">
              {cameraError ? (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col items-center gap-2">
                  <VideoOff className="w-6 h-6 text-rose-500" />
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    Coba Akses Kamera Lagi
                  </button>
                </div>
              ) : isCameraActive ? (
                <div className="space-y-3">
                  <div className="relative mx-auto w-48 h-48 rounded-full overflow-hidden border-4 border-orange-500 shadow-inner bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Jepret Foto Sekarang</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-600">
                    <Video className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Ambil Foto Langsung Menggunakan Kamera / Webcam
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Kamera langsung mengambil foto profil petugas secara instan di depan kasir.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="mt-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Aktifkan Kamera Petugas</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INITIALS CREATOR */}
          {activeTab === 'initials' && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Buat Avatar Inisial Nama Petugas
                </span>
                <span className="text-[11px] font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                  Inisial: {getComputedInitials()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Kustom Inisial (Opsional)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Contoh: SA"
                    value={customInitials}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setCustomInitials(val);
                      if (val.trim()) {
                        const dataUrl = buildInitialsAvatarUrl(val.trim(), selectedPaletteIdx);
                        onChangeAvatar(dataUrl);
                      }
                    }}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-center focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomInitials('');
                      handleApplyInitials(selectedPaletteIdx);
                    }}
                    className="w-full text-xs py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Pakai Nama Asli</span>
                  </button>
                </div>
              </div>

              {/* Color Gradient Choices */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Pilih Warna Tema Latar Avatar:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {COLOR_PALETTES.map((pal, idx) => {
                    const isSelected = selectedPaletteIdx === idx;
                    return (
                      <button
                        key={pal.name}
                        type="button"
                        onClick={() => handleApplyInitials(idx)}
                        title={pal.name}
                        style={{
                          background: `linear-gradient(135deg, ${pal.from}, ${pal.to})`,
                        }}
                        className={`h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-2xs transition-transform hover:scale-105 active:scale-95 ${
                          isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-105' : ''
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRESET AVATARS */}
          {activeTab === 'presets' && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <span className="block text-xs font-bold text-slate-800">
                Pilih Dari Foto Petugas Toko Standar
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                {PRESET_AVATARS.map((item) => {
                  const isSelected = avatar === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChangeAvatar(item.url);
                        setErrorMsg(null);
                      }}
                      title={item.label}
                      className={`group relative rounded-full overflow-hidden p-0.5 border-2 transition-all ${
                        isSelected
                          ? 'border-orange-500 ring-2 ring-orange-500/40 scale-105'
                          : 'border-slate-200 hover:border-orange-400'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.label}
                        className="w-full aspect-square rounded-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-orange-600/40 flex items-center justify-center text-white">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOM URL */}
          {activeTab === 'url' && (
            <form
              onSubmit={handleApplyUrl}
              className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5"
            >
              <label className="block text-xs font-bold text-slate-800">
                Tempel Link URL Foto dari Internet
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://contoh.com/foto-petugas.jpg"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs"
                >
                  Terapkan
                </button>
              </div>
            </form>
          )}

          {/* Quick Avatar Status Indicator */}
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <Check className="w-3.5 h-3.5" />
              <span>Foto profil terpilih &amp; siap disimpan</span>
            </span>
            <button
              type="button"
              onClick={() => {
                const initialUrl = buildInitialsAvatarUrl(getComputedInitials(), 0);
                onChangeAvatar(initialUrl);
              }}
              className="text-slate-500 hover:text-slate-700 underline text-[11px]"
            >
              Reset ke Inisial Bawaan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
