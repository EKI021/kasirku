import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PosView } from './components/pos/PosView';
import { StockOpnameView } from './components/stock/StockOpnameView';
import { ProductManagementView } from './components/stock/ProductManagementView';
import { ProductModal } from './components/stock/ProductModal';
import { FinancialAnalyticsView } from './components/analytics/FinancialAnalyticsView';
import { TransactionHistoryView } from './components/transactions/TransactionHistoryView';
import { CashFlowView } from './components/cashflow/CashFlowView';
import { EvidenceLogsView } from './components/evidence/EvidenceLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { PaymentModal } from './components/pos/PaymentModal';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { LoginModal } from './components/auth/LoginModal';
import { Transaction } from './types';
import {
  Lock,
  ShoppingBag,
  ClipboardCheck,
  Package,
  Receipt,
  Menu,
  BarChart3,
} from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    latestCompletedTransaction,
    setLatestCompletedTransaction,
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    cart,
    cartGrandTotal,
    completeTransaction,
    clearCart,
    canAccessTab,
    currentUser,
    isAuthenticated,
  } = useStore();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
  const [draftOrder, setDraftOrder] = useState<any[] | null>(null);

  // Keyboard shortcut Ctrl+/ for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick Action: Bayar & Cetak Langsung (Fast Checkout)
  const handleFastPayAndPrint = async () => {
    if (cart.length === 0) return;
    try {
      await completeTransaction('cash', cartGrandTotal, 'Bayar Pas Kasir');
    } catch (err) {
      console.error(err);
      alert('Gagal menyelesaikan transaksi.');
    }
  };

  // Draft handling
  const handleSaveDraft = () => {
    if (cart.length === 0) return;
    setDraftOrder([...cart]);
    clearCart();
    alert('Keranjang disimpan sebagai draft nota! Anda dapat membukanya kembali dari menu Daftar Draft.');
  };

  const handleOpenDrafts = () => {
    if (!draftOrder || draftOrder.length === 0) {
      alert('Tidak ada draft pesanan yang tersimpan.');
      return;
    }
    alert(`Terdapat draft tersimpan (${draftOrder.length} item).`);
  };

  const handleOpenReceiptFromHistory = (tx: Transaction) => {
    setLatestCompletedTransaction(tx);
    setIsReceiptModalOpen(true);
  };

  const hasAccess = canAccessTab(activeTab);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased">
      {/* Left Sidebar (Desktop Fixed + Mobile/Tablet Off-canvas Drawer) */}
      <Sidebar
        onOpenLogin={() => setIsLoginModalOpen(true)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <Header
          onOpenNewProduct={() => setIsAddProductModalOpen(true)}
          onOpenDrafts={handleOpenDrafts}
          onToggleMobileMenu={() => setIsMobileNavOpen((prev) => !prev)}
        />

        {/* View Switcher with Previlage Enforcement */}
        <main className="flex-1 flex overflow-hidden min-w-0">
          {!hasAccess ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-50 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-2xs">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Akses Tidak Diizinkan</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Role Anda saat ini adalah <strong>{currentUser?.name || 'Belum Login'}</strong> ({currentUser?.roleName || '-'}).
                Anda tidak memiliki hak akses untuk membuka modul ini. Silakan hubungi Administrator atau masuk dengan akun yang sesuai.
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'pos' && (
                <PosView
                  onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
                  onOpenNewProduct={() => setIsAddProductModalOpen(true)}
                  onFastPayAndPrint={handleFastPayAndPrint}
                  onSaveDraft={handleSaveDraft}
                />
              )}

              {activeTab === 'stock_opname' && <StockOpnameView />}

              {activeTab === 'products' && (
                <ProductManagementView
                  isAddModalOpen={isAddProductModalOpen}
                  setIsAddModalOpen={setIsAddProductModalOpen}
                />
              )}

              {activeTab === 'analytics' && <FinancialAnalyticsView />}

              {activeTab === 'transactions' && (
                <TransactionHistoryView onSelectReceipt={handleOpenReceiptFromHistory} />
              )}

              {activeTab === 'cash_flow' && <CashFlowView />}

              {activeTab === 'evidence_logs' && <EvidenceLogsView />}

              {activeTab === 'settings' && <SettingsView />}
            </>
          )}
        </main>

        {/* Mobile & Tablet Bottom Navigation Bar (Visible only on < lg, perfectly symmetrical 5 columns) */}
        <nav
          aria-label="Navigasi Bawah Mobile dan Tablet"
          className="lg:hidden shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1.5 py-1 z-30 select-none shadow-sm"
        >
          <div className="grid grid-cols-5 gap-1 max-w-lg mx-auto w-full items-center">
            {/* Kasir */}
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition-all relative ${
                activeTab === 'pos'
                  ? 'text-orange-600 font-bold bg-orange-50/80 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-5 h-5 mb-0.5 shrink-0" />
              <span className="text-[10px] leading-tight truncate">Kasir</span>
              {cart.length > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 bg-orange-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Analisis Keuangan */}
            {canAccessTab('analytics') ? (
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition-all ${
                  activeTab === 'analytics'
                    ? 'text-orange-600 font-bold bg-orange-50/80 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="w-5 h-5 mb-0.5 shrink-0" />
                <span className="text-[10px] leading-tight truncate">Analisis</span>
              </button>
            ) : canAccessTab('stock_opname') ? (
              <button
                type="button"
                onClick={() => setActiveTab('stock_opname')}
                className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition-all ${
                  activeTab === 'stock_opname'
                    ? 'text-orange-600 font-bold bg-orange-50/80 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardCheck className="w-5 h-5 mb-0.5 shrink-0" />
                <span className="text-[10px] leading-tight truncate">Opname</span>
              </button>
            ) : (
              <div />
            )}

            {/* Katalog Produk */}
            {canAccessTab('products') && (
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition-all ${
                  activeTab === 'products'
                    ? 'text-orange-600 font-bold bg-orange-50/80 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-5 h-5 mb-0.5 shrink-0" />
                <span className="text-[10px] leading-tight truncate">Katalog</span>
              </button>
            )}

            {/* Struk */}
            {canAccessTab('transactions') && (
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition-all ${
                  activeTab === 'transactions'
                    ? 'text-orange-600 font-bold bg-orange-50/80 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Receipt className="w-5 h-5 mb-0.5 shrink-0" />
                <span className="text-[10px] leading-tight truncate">Struk</span>
              </button>
            )}

            {/* Menu Drawer */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl text-slate-500 hover:text-slate-800 transition-all"
              title="Buka menu navigasi lengkap"
            >
              <Menu className="w-5 h-5 mb-0.5 shrink-0" />
              <span className="text-[10px] leading-tight truncate">Menu</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Global Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={latestCompletedTransaction}
      />

      <LoginModal
        isOpen={!isAuthenticated || isLoginModalOpen}
        canClose={isAuthenticated}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Modal triggered from header button on other views */}
      {activeTab !== 'products' && (
        <ProductModal
          isOpen={isAddProductModalOpen}
          onClose={() => setIsAddProductModalOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
