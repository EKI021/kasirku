import React from 'react';
import {
  ShoppingBag,
  ClipboardCheck,
  Package,
  BarChart3,
  Receipt,
  Wallet,
  Settings,
  Database,
  CheckCircle2,
  LogOut,
  Sparkles,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ActiveNavTab } from '../../types';

interface SidebarProps {
  onOpenLogin: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenLogin,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const {
    activeTab,
    setActiveTab,
    products,
    cart,
    currentUser,
    isFirebaseActive,
    canAccessTab,
    activityLogs,
    logout,
  } = useStore();

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const allNavItems: {
    id: ActiveNavTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'pos',
      label: 'Kasir (POS)',
      icon: ShoppingBag,
      badge: cart.length > 0 ? `${cart.length} item` : undefined,
      badgeColor: 'bg-orange-500 text-white',
    },
    {
      id: 'stock_opname',
      label: 'Stok Opname',
      icon: ClipboardCheck,
      badge: lowStockCount > 0 ? `${lowStockCount} cek` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 font-semibold',
    },
    {
      id: 'products',
      label: 'Katalog & Stok',
      icon: Package,
      badge: products.length,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'analytics',
      label: 'Analisis Keuangan',
      icon: BarChart3,
    },
    {
      id: 'transactions',
      label: 'Riwayat Struk',
      icon: Receipt,
    },
    {
      id: 'cash_flow',
      label: 'Arus Kas Toko',
      icon: Wallet,
    },
    {
      id: 'evidence_logs',
      label: 'Log Evidence',
      icon: ShieldAlert,
      badge: activityLogs.length > 0 ? activityLogs.length : undefined,
      badgeColor: 'bg-purple-100 text-purple-800 font-bold',
    },
    {
      id: 'settings',
      label: 'Pengaturan & DB',
      icon: Settings,
    },
  ];

  // Filter navigation items by role privileges
  const allowedNavItems = allNavItems.filter((item) => canAccessTab(item.id));

  const handleSelectTab = (tabId: ActiveNavTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderSidebarContent = (isDrawer = false) => (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-lg">KasirKu</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                POS
              </span>
            </div>
            <p className="text-xs text-slate-500">Retail &amp; Stok Opname</p>
          </div>
        </div>

        {isDrawer && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Tutup Navigasi"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User / Cashier Profile Box */}
      {currentUser && (
        <div className="p-3 mx-3 my-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-200 shadow-2xs shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                    currentUser.role === 'administrator'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : currentUser.role === 'owner'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : currentUser.role === 'warehouse_admin'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {currentUser.role === 'administrator'
                    ? 'Admin'
                    : currentUser.role === 'warehouse_admin'
                    ? 'Gudang'
                    : currentUser.role === 'owner'
                    ? 'Owner'
                    : 'Kasir'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate">@{currentUser.username}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={() => {
                setActiveTab('settings');
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-1.5 px-2 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 text-[10px] font-bold transition-colors text-center"
              title="Ganti kata sandi & profil akun saya"
            >
              Profil Saya
            </button>
            <button
              onClick={() => {
                onOpenLogin();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold transition-colors text-center"
              title="Ganti akun login / beralih hak akses"
            >
              Ganti Akun
            </button>
          </div>
        </div>
      )}

      {/* Navigation Links Filtered by Role Previlage */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Hak Akses: {currentUser ? currentUser.role.replace('_', ' ') : 'Belum Login'}
          </p>
        </div>

        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-200/60 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Database / Sync Status & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">Firestore DB</span>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              isFirebaseActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            {isFirebaseActive ? 'Aktif' : 'Offline'}
          </span>
        </div>

        <button
          onClick={() => {
            logout();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-colors shadow-2xs"
          title="Keluar dari sesi sistem KasirKu"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>Keluar Sistem (Logout)</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col h-screen shrink-0 select-none">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile & Tablet Off-Canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-250">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
