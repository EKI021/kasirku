import React, { useState, useEffect } from 'react';
import { X, Lock, User, Eye, EyeOff, Store, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, canClose = true }) => {
  const { loginWithCredentials, currentUser } = useStore();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Cleanse form, history, and previous session indicators on open to support maximum account security
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setShowPassword(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await loginWithCredentials(username, password);
      if (result.success) {
        setSuccessMessage(result.message);
        setTimeout(() => {
          setIsLoading(false);
          onClose?.();
        }, 500);
      } else {
        setErrorMessage(result.message);
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan saat verifikasi login: ' + String(err));
      setIsLoading(false);
    }
  };

  const showCloseButton = canClose && currentUser !== null && onClose;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Close Button (only accessible if user is already authenticated) */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs flex items-center justify-center text-white transition-all shadow-sm"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Gambar Toko Kelontong Header */}
        <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80"
            alt="KasirKu"
            className="w-full h-full object-cover object-center opacity-85 brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>

          {/* Branding Toko Kelontong */}
          <div className="absolute bottom-4 left-6 right-6 text-white flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs mb-1">
                <Store className="w-3 h-3" />
                <span>KasirKu</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white drop-shadow-sm">
                Akses Login Sistem
              </h2>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-medium text-slate-300">
                Sistem Kasir &amp; Stok Opname
              </span>
            </div>
          </div>
        </div>

        {/* Body Content - Clean & Professional without default credentials or unnecessary texts */}
        <div className="p-6 sm:p-7 space-y-4">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Username Akses Login
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ketik username Anda..."
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input with Eye Logo (Makesure Password) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Kata Sandi (Password)
                </label>
                <span className="text-[11px] text-slate-400">
                  Klik ikon mata untuk memastikan kata sandi
                </span>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ketik kata sandi Anda..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full text-sm pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 transition-all font-mono"
                />
                {/* Logo Mata untuk makesure password */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 focus:outline-none transition-colors"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi (Make sure)'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-orange-600" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition-all disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? 'Memverifikasi Akses...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-[10px] text-slate-400 font-medium">
              Powered By Eky Rinaldo
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
