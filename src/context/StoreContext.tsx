import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Transaction,
  StockOpname,
  CashFlow,
  ActiveNavTab,
  PaymentMethod,
  UserRole,
  StoreUser,
  ActivityLog,
  ProductCategory,
  StoreBankQrisConfig,
} from '../types';
import { VoiceAlertService } from '../utils/voice';
import {
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  INITIAL_STOCK_OPNAMES,
  INITIAL_CASH_FLOWS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_CATEGORIES,
  INITIAL_SYSTEM_USERS,
} from '../data/initialProducts';
import {
  subscribeToProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
  updateProductStockInFirestore,
  subscribeToTransactions,
  createTransactionInFirestore,
  deleteTransactionFromFirestore,
  clearAllTransactionsFromFirestore,
  subscribeToStockOpnames,
  saveStockOpnameToFirestore,
  subscribeToCashFlows,
  addCashFlowToFirestore,
  deleteCashFlowFromFirestore,
  clearExpenseCashFlowsFromFirestore,
  subscribeToActivityLogs,
  logActivityToFirestore,
  subscribeToCategories,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  subscribeToSystemUsers,
  saveSystemUserToFirestore,
  updateSystemUserStatusInFirestore,
  deleteSystemUserFromFirestore,
  clearAllFirestoreData,
  seedSampleProducts,
  saveStoreSettingsToFirestore,
} from '../firebase/services';

export const SYSTEM_USERS: StoreUser[] = INITIAL_SYSTEM_USERS;

export const GUEST_USER: StoreUser = {
  id: 'guest',
  username: '',
  name: 'Petugas Toko (Belum Login)',
  role: 'cashier',
  roleName: 'Belum Terautentikasi',
  email: '',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  status: 'disabled',
};

interface StoreContextType {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  products: Product[];
  transactions: Transaction[];
  stockOpnames: StockOpname[];
  cashFlows: CashFlow[];
  activityLogs: ActivityLog[];
  cart: CartItem[];
  customerName: string;
  setCustomerName: (name: string) => void;
  customerType: 'regular' | 'member' | 'wholesale';
  setCustomerType: (type: 'regular' | 'member' | 'wholesale') => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  orderDiscount: number;
  setOrderDiscount: (discount: number) => void;
  
  // Cart Actions
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  changeQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTotalDiscount: number;
  cartGrandTotal: number;
  
  // Business logic
  completeTransaction: (
    method: PaymentMethod,
    amountPaid: number,
    notes?: string
  ) => Promise<Transaction>;
  deleteTransaction: (
    transactionId: string,
    returnStock?: boolean
  ) => Promise<{ success: boolean; message: string }>;
  clearAllTransactions: (
    returnStock?: boolean
  ) => Promise<{ success: boolean; message: string }>;
  saveStockOpname: (
    opname: Omit<StockOpname, 'id' | 'createdAt'>,
    applyAdjustment: boolean
  ) => Promise<StockOpname>;
  upsertProduct: (product: Product) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  addCashFlowRecord: (
    type: 'income' | 'expense',
    category: string,
    amount: number,
    description: string
  ) => Promise<void>;
  deleteCashFlowRecord: (
    flowId: string
  ) => Promise<{ success: boolean; message: string }>;
  clearExpenseCashFlows: () => Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
    totalDeletedAmount: number;
  }>;
  logAction: (
    actionType: ActivityLog['actionType'],
    description: string,
    targetId?: string,
    evidenceData?: string
  ) => Promise<void>;
  
  // Role & Permissions
  currentUser: StoreUser;
  isAuthenticated: boolean;
  switchUser: (user: StoreUser) => void;
  logout: () => void;
  canAccessTab: (tab: ActiveNavTab) => boolean;
  canEditProductImage: boolean;
  canEditProductName: boolean;
  canEditCategory: boolean;
  canAddStock: boolean;
  canDeleteStock: boolean;
  canDeleteProduct: boolean;
  canDeleteReceipt: boolean;
  canDeleteCashOut: boolean;
  canEditFinanceFields: boolean;
  canManageSystemUsers: boolean;
  monthlySalesTarget: number;
  setMonthlySalesTarget: (target: number) => Promise<void>;
  clearMonthlySalesTarget: () => Promise<void>;
  adjustProductStock: (productId: string, newStock: number, reason?: string) => Promise<void>;
  
  // Dynamic Product Categories & Jenis Barang
  categories: ProductCategory[];
  addCategory: (category: Omit<ProductCategory, 'id' | 'createdAt'>) => Promise<ProductCategory>;
  updateCategory: (category: ProductCategory) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Dynamic System User Login Management (Tambah, Edit, Disable/Enable)
  systemUsers: StoreUser[];
  addSystemUser: (user: Omit<StoreUser, 'id' | 'createdAt'>) => Promise<StoreUser>;
  updateSystemUser: (user: StoreUser) => Promise<void>;
  toggleSystemUserStatus: (userId: string) => Promise<void>;
  deleteSystemUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  loginWithCredentials: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; message: string; user?: StoreUser }>;

  // Database controls
  clearAllData: () => Promise<string>;
  loadSampleData: () => Promise<string>;
  isFirebaseActive: boolean;
  syncStatus: 'synced' | 'syncing' | 'ready';
  
  // Modals & UI triggers
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  latestCompletedTransaction: Transaction | null;
  setLatestCompletedTransaction: (tx: Transaction | null) => void;
  isReceiptModalOpen: boolean;
  setIsReceiptModalOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  barcodeScannerMode: boolean;
  setBarcodeScannerMode: (enabled: boolean) => void;
  scannerFocusRequest: number;
  triggerFocusScannerInput: () => void;
  barcodeScannerAudio: boolean;
  setBarcodeScannerAudio: (enabled: boolean) => void;
  scanFeedback: { text: string; type: 'success' | 'error' } | null;
  triggerBarcodeScan: (barcodeOrQuery: string) => boolean;
  playScannerBeep: (type?: 'success' | 'error') => void;
  qrisConfig: StoreBankQrisConfig;
  updateQrisConfig: (newConfig: Partial<StoreBankQrisConfig>) => void;
  speakPaymentSuccess: (text?: string) => void;
  testVoiceAlerts: () => void;
}

export const INITIAL_QRIS_CONFIG: StoreBankQrisConfig = {
  qrisImageUrl: '',
  bankName: 'BCA',
  accountNumber: '882-019-3321',
  accountHolder: 'KASIRKU RETAIL',
  secondaryBankName: 'MANDIRI',
  secondaryAccountNumber: '132-00-9844-123',
  secondaryAccountHolder: 'KASIRKU RETAIL',
  qrisMerchantNmid: 'ID1020038849201',
  useOfficialBankQris: false,
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Dynamic System Users List (Real User Accounts)
  const [systemUsers, setSystemUsers] = useState<StoreUser[]>(() => {
    try {
      const saved = localStorage.getItem('almas_system_users');

      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SYSTEM_USERS;
  });

  const [currentUser, setCurrentUser] = useState<StoreUser>(() => {
    try {
      const savedId = localStorage.getItem('almas_user_id');
      const found = systemUsers.find((u) => u.id === savedId && u.status !== 'disabled');
      return found || GUEST_USER;
    } catch {
      return GUEST_USER;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedId = localStorage.getItem('almas_user_id');
      if (savedId) {
        const found = systemUsers.find((u) => u.id === savedId && u.status !== 'disabled');
        return !!found;
      }
      return false;
    } catch {
      return false;
    }
  });

  // Dynamic Product Categories & Jenis Barang
  const [categories, setCategories] = useState<ProductCategory[]>(() => {
    try {
      const saved = localStorage.getItem('almas_categories');

      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CATEGORIES;
  });

  const [activeTab, setActiveTab] = useState<ActiveNavTab>('pos');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [stockOpnames, setStockOpnames] = useState<StockOpname[]>(INITIAL_STOCK_OPNAMES);
  const [cashFlows, setCashFlows] = useState<CashFlow[]>(INITIAL_CASH_FLOWS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('Pelanggan Umum');
  const [customerType, setCustomerType] = useState<'regular' | 'member' | 'wholesale'>('regular');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [orderDiscount, setOrderDiscount] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Barcode Scanner Mode State
  const [barcodeScannerMode, setBarcodeScannerModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('almas_barcode_scanner_mode');
      return saved ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [scannerFocusRequest, setScannerFocusRequest] = useState<number>(0);

  const triggerFocusScannerInput = () => {
    setScannerFocusRequest(Date.now());
  };

  // Barcode Scanner Beep Audio
  const [barcodeScannerAudio, setBarcodeScannerAudioState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('almas_barcode_scanner_audio');
      return saved ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const setBarcodeScannerAudio = (enabled: boolean) => {
    setBarcodeScannerAudioState(enabled);
    try {
      localStorage.setItem('almas_barcode_scanner_audio', String(enabled));
    } catch (e) {
      console.warn('Could not persist barcodeScannerAudio:', e);
    }
  };

  const [scanFeedback, setScanFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const setBarcodeScannerMode = (enabled: boolean) => {
    setBarcodeScannerModeState(enabled);
    try {
      localStorage.setItem('almas_barcode_scanner_mode', String(enabled));
    } catch (e) {
      console.warn('Could not persist barcodeScannerMode:', e);
    }
  };

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [latestCompletedTransaction, setLatestCompletedTransaction] = useState<Transaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'ready'>('ready');

  // Real Bank QRIS & Account Settings
  const [qrisConfig, setQrisConfig] = useState<StoreBankQrisConfig>(() => {
    try {
      const saved = localStorage.getItem('almas_qris_config');

      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_QRIS_CONFIG;
  });

  const updateQrisConfig = (newConfig: Partial<StoreBankQrisConfig>) => {
    setQrisConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      try {
        localStorage.setItem('almas_qris_config', JSON.stringify(updated));
        saveStoreSettingsToFirestore({ qrisConfig: updated }).catch(console.warn);
      } catch (e) {
        console.warn('Could not persist qrisConfig:', e);
      }
      return updated;
    });
  };

  // Suara pengumuman "Pembayaran Berhasil" (Melodic payment chime + Indonesian TTS voice)
  const speakPaymentSuccess = (customText?: string) => {
    const text = customText || 'Pembayaran berhasil, terima kasih.';
    VoiceAlertService.speak(text, 0.9);
  };

  const testVoiceAlerts = () => {
    // 1. Simulasikan "Pembayaran berhasil"
    speakPaymentSuccess('Pembayaran berhasil, sejumlah lima puluh ribu rupiah. Terima kasih.');
    
    // 2. Simulasikan "Stok menipis" setelah jeda
    setTimeout(() => {
      VoiceAlertService.speak('Perhatian, stok barang Sabun Cuci tersisa 5 buah.', 0.9);
    }, 3500);
  };

  // Permissions evaluation based on user prompt rules
  const canAccessTab = (tab: ActiveNavTab): boolean => {
    if (!currentUser) return false;
    switch (currentUser.role) {
      case 'administrator':
        // Full access including evidence logs
        return true;
      case 'cashier':
        // POS, Transactions, and Settings (for changing own password & profile)
        return tab === 'pos' || tab === 'transactions' || tab === 'settings';
      case 'warehouse_admin':
        // Stock Opname, Catalog, and Settings (for changing own password & profile)
        return tab === 'stock_opname' || tab === 'products' || tab === 'settings';
      case 'owner':
        // Owner can access POS, stock opname, products, analytics, transactions, cash flow, settings
        // BUT strictly CANNOT access evidence_logs (administrator only)
        return tab !== 'evidence_logs';
      default:
        return false;
    }
  };

  // Administrator and Warehouse Admin can edit product image
  const canEditProductImage =
    currentUser?.role === 'administrator' || currentUser?.role === 'warehouse_admin';

  // Owner, Administrator, and Warehouse Admin can edit product name and category
  const canEditProductName =
    currentUser?.role === 'administrator' ||
    currentUser?.role === 'owner' ||
    currentUser?.role === 'warehouse_admin';
  const canEditCategory =
    currentUser?.role === 'administrator' ||
    currentUser?.role === 'owner' ||
    currentUser?.role === 'warehouse_admin';
  
  // Owner, Administrator, and Warehouse Admin can add stock
  const canAddStock = currentUser?.role === 'administrator' || currentUser?.role === 'owner' || currentUser?.role === 'warehouse_admin';

  // Owner and Administrator can delete stock (reduce or clear stock quantity to 0)
  const canDeleteStock = currentUser?.role === 'administrator' || currentUser?.role === 'owner';

  // Permanent deletion of product master record is enabled for Administrator and Owner
  const canDeleteProduct = currentUser?.role === 'administrator' || currentUser?.role === 'owner';

  // Deletion of receipt / transaction history is enabled for Administrator and Owner
  const canDeleteReceipt = currentUser?.role === 'administrator' || currentUser?.role === 'owner';

  // Deletion of total cash out (hapus total kas keluar) is EXCLUSIVELY enabled for Administrator
  const canDeleteCashOut = currentUser?.role === 'administrator';

  // Monthly Sales Target state (Target Omzet Bulanan)
  const [monthlySalesTarget, setMonthlySalesTargetState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('almas_monthly_sales_target');
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return 30000000; // Default Rp 30.000.000 per bulan
  });

  const setMonthlySalesTarget = async (target: number): Promise<void> => {
    setMonthlySalesTargetState(target);
    try {
      localStorage.setItem('almas_monthly_sales_target', String(target));
      saveStoreSettingsToFirestore({ monthlySalesTarget: target }).catch(console.warn);
    } catch (e) {
      console.warn('Could not persist monthly sales target:', e);
    }
  };

  // Reset monthly sales target to default (30.000.000) - Administrator only
  const clearMonthlySalesTarget = async (): Promise<void> => {
    const DEFAULT_TARGET = 30000000;
    setMonthlySalesTargetState(DEFAULT_TARGET);
    try {
      localStorage.removeItem('almas_monthly_sales_target');
      saveStoreSettingsToFirestore({ monthlySalesTarget: DEFAULT_TARGET }).catch(console.warn);
    } catch (e) {
      console.warn('Could not clear monthly sales target:', e);
    }
  };

  // Financial fields (HPP, Selling Price, SKU) are editable by Administrator
  const canEditFinanceFields = currentUser?.role === 'administrator';

  // System User Accounts & Profile Photo Creator: strictly Administrator only!
  const canManageSystemUsers = currentUser?.role === 'administrator';

  // Log action helper
  const logAction = async (
    actionType: ActivityLog['actionType'],
    description: string,
    targetId?: string,
    evidenceData?: string
  ): Promise<void> => {
    const log: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'unauthenticated',
      userName: currentUser?.name || 'Sistem Keamanan',
      userRole: currentUser?.role || 'cashier',
      actionType,
      description,
      ...(targetId ? { targetId } : {}),
      ...(evidenceData ? { evidenceData } : {}),
    };

    setActivityLogs((prev) => [log, ...prev]);
    logActivityToFirestore(log).catch(console.warn);
  };

  const switchUser = (user: StoreUser) => {
    if (currentUser) {
      logAction('LOGOUT', `Pengguna ${currentUser.name} keluar sesi`);
    }
    setCurrentUser(user);
    try {
      localStorage.setItem('almas_user_id', user.id);
    } catch {}

    // Adjust tab if new role doesn't have access to current tab
    if (user.role === 'cashier' && activeTab !== 'pos' && activeTab !== 'transactions') {
      setActiveTab('pos');
    } else if (user.role === 'warehouse_admin' && activeTab !== 'stock_opname' && activeTab !== 'products') {
      setActiveTab('stock_opname');
    } else if (user.role === 'owner' && activeTab === 'evidence_logs') {
      setActiveTab('analytics');
    }

    logAction('LOGIN', `Pengguna ${user.name} (${user.roleName}) berhasil masuk`);
  };

  // Logout & Security Cleansing - Full session cleanup
  const logout = () => {
    if (currentUser && isAuthenticated) {
      logAction('LOGOUT', `Sesi logout keamanan: Pengguna ${currentUser.name} (@${currentUser.username}) keluar sistem.`);
    }
    setIsAuthenticated(false);
    setCurrentUser(GUEST_USER);
    try {
      // Clear all session-related localStorage items
      localStorage.removeItem('almas_user_id');
      // Optionally clear other sensitive data on logout (uncomment if needed)
      // localStorage.removeItem('almas_system_users');
      // localStorage.removeItem('almas_categories');
      // localStorage.removeItem('almas_barcode_scanner_mode');
      // localStorage.removeItem('almas_barcode_scanner_audio');
      // localStorage.removeItem('almas_qris_config');
      // localStorage.removeItem('almas_monthly_sales_target');
    } catch {
      // Ignore localStorage errors (e.g., private browsing mode)
    }
    setCart([]);
    setSearchQuery('');
    setScanFeedback(null);
    setActiveTab('pos');
  };

  // Connect Firebase Firestore real-time listeners (no auto-seeding dummy data!)
  useEffect(() => {
    setSyncStatus('syncing');
    let unsubProducts: (() => void) | undefined;
    let unsubTransactions: (() => void) | undefined;
    let unsubStockOpnames: (() => void) | undefined;
    let unsubCashFlows: (() => void) | undefined;
    let unsubActivityLogs: (() => void) | undefined;
    let unsubCategories: (() => void) | undefined;
    let unsubSystemUsers: (() => void) | undefined;

    try {
      unsubProducts = subscribeToProducts(
        (data) => {
          setProducts(data || []);
          setSyncStatus('synced');
          setIsFirebaseActive(true);
        },
        () => {
          setIsFirebaseActive(false);
          setSyncStatus('ready');
        }
      );

      unsubTransactions = subscribeToTransactions(
        (data) => {
          setTransactions(data || []);
        },
        () => {}
      );

      unsubStockOpnames = subscribeToStockOpnames(
        (data) => {
          setStockOpnames(data || []);
        },
        () => {}
      );

      unsubCashFlows = subscribeToCashFlows(
        (data) => {
          setCashFlows(data || []);
        },
        () => {}
      );

      unsubActivityLogs = subscribeToActivityLogs(
        (data) => {
          setActivityLogs(data || []);
        },
        () => {}
      );

      unsubCategories = subscribeToCategories(
        (data) => {
          if (data && data.length > 0) {
            setCategories(data);
            try {
              localStorage.setItem('almas_categories', JSON.stringify(data));
            } catch {}
          }
        },
        () => {}
      );

      unsubSystemUsers = subscribeToSystemUsers(
        (data) => {
          if (data && data.length > 0) {
            setSystemUsers(data);
            try {
              localStorage.setItem('almas_system_users', JSON.stringify(data));
            } catch {}
          }
        },
        () => {}
      );
    } catch (err) {
      console.warn('Firebase listeners fallback:', err);
      setIsFirebaseActive(false);
      setSyncStatus('ready');
    }

    return () => {
      unsubProducts?.();
      unsubTransactions?.();
      unsubStockOpnames?.();
      unsubCashFlows?.();
      unsubActivityLogs?.();
      unsubCategories?.();
      unsubSystemUsers?.();
    };
  }, []);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Stok "${product.name}" saat ini habis (0 unit)!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Jumlah melebihi stok yang tersedia (${product.stock} ${product.unit}).`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const clampedQty = Math.min(qty, item.product.stock);
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              alert(`Maksimal stok tercatat adalah ${item.product.stock} ${item.product.unit}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setOrderDiscount(0);
    setOrderNotes('');
    setCustomerName('Pelanggan Umum');
  };

  // Cart Totals
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartItemDiscounts = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  const memberDiscount = customerType === 'member' ? Math.round(cartSubtotal * 0.03) : 0;
  const cartTotalDiscount = cartItemDiscounts + orderDiscount + memberDiscount;
  const cartGrandTotal = Math.max(0, cartSubtotal - cartTotalDiscount);

  // Complete POS Transaction
  const completeTransaction = async (
    method: PaymentMethod,
    amountPaid: number,
    notes?: string
  ): Promise<Transaction> => {
    const invoiceNum = `INV/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${String(
      transactions.length + 1
    ).padStart(4, '0')}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber: invoiceNum,
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        price: item.product.price,
        costPrice: item.product.costPrice,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
        discount: item.discount || 0,
      })),
      subtotal: cartSubtotal,
      discount: cartTotalDiscount,
      total: cartGrandTotal,
      paymentMethod: method,
      amountPaid: method === 'cash' ? amountPaid : cartGrandTotal,
      change: method === 'cash' ? Math.max(0, amountPaid - cartGrandTotal) : 0,
      cashierName: currentUser.name,
      customerName: customerName.trim() || 'Pelanggan Umum',
      customerType,
      notes: notes || orderNotes || '',
      createdAt: new Date().toISOString(),
    };

    // Update product stock locally
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = cart.find((ci) => ci.product.id === p.id);
        if (cartItem) {
          const updatedStock = Math.max(0, p.stock - cartItem.quantity);
          updateProductStockInFirestore(p.id, updatedStock).catch(console.warn);
          return { ...p, stock: updatedStock };
        }
        return p;
      })
    );

    // Save transaction to state and Firestore
    setTransactions((prev) => [newTx, ...prev]);
    createTransactionInFirestore(newTx).catch(console.warn);

    // Record cash flow entry automatically for cash/qris revenue
    const flowRecord: CashFlow = {
      id: `cf-${Date.now()}`,
      type: 'income',
      category: `Penjualan POS (${method.toUpperCase()})`,
      amount: cartGrandTotal,
      description: `Transaksi ${invoiceNum} - ${customerName}`,
      cashierName: currentUser.name,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setCashFlows((prev) => [flowRecord, ...prev]);
    addCashFlowToFirestore(flowRecord).catch(console.warn);

    // Evidence Log
    logAction(
      'TRANSACTION_CREATE',
      `Transaksi kasir baru ${invoiceNum} dibuat oleh ${currentUser.name} (${cart.length} item, Total ${cartGrandTotal})`,
      newTx.id,
      JSON.stringify({ invoiceNumber: invoiceNum, total: cartGrandTotal, method, itemsCount: cart.length })
    );

    setLatestCompletedTransaction(newTx);
    clearCart();
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);

    // Suara ucapan "Pembayaran Berhasil"
    const formattedTotal = cartGrandTotal.toLocaleString('id-ID');
    VoiceAlertService.speak(`Pembayaran berhasil, sejumlah ${formattedTotal} rupiah. Terima kasih.`, 0.9);

    // Cek stok menipis setelah transaksi berhasil
    setTimeout(() => {
      cart.forEach((item) => {
        const updatedProduct = products.find((p) => p.id === item.product.id);
        if (updatedProduct && updatedProduct.stock < 10) {
          VoiceAlertService.speak(
            `Perhatian, stok barang ${updatedProduct.name} tersisa ${updatedProduct.stock} ${updatedProduct.unit}.`,
            0.9
          );
        }
      });
    }, 3000); // Beri jeda 3 detik setelah suara pembayaran

    return newTx;
  };

  // Delete Transaction / Receipt History (Hapus Riwayat Struk)
  const deleteTransaction = async (
    transactionId: string,
    returnStock: boolean = true
  ): Promise<{ success: boolean; message: string }> => {
    if (currentUser?.role !== 'administrator' && currentUser?.role !== 'owner') {
      return {
        success: false,
        message: 'Akses ditolak: Hanya Administrator atau Pemilik Toko yang berhak menghapus riwayat struk.',
      };
    }

    const targetTx = transactions.find((t) => t.id === transactionId);
    if (!targetTx) {
      return { success: false, message: 'Data riwayat struk tidak ditemukan.' };
    }

    // 1. Kembalikan stok item ke inventaris jika diminta
    if (returnStock && targetTx.items && targetTx.items.length > 0) {
      setProducts((prev) =>
        prev.map((p) => {
          const matchedItem = targetTx.items.find((item) => item.productId === p.id);
          if (matchedItem) {
            const restoredStock = p.stock + matchedItem.quantity;
            updateProductStockInFirestore(p.id, restoredStock).catch(console.warn);
            return { ...p, stock: restoredStock, updatedAt: new Date().toISOString() };
          }
          return p;
        })
      );
    }

    // 2. Hapus transaksi dari state lokal & Firestore
    setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    deleteTransactionFromFirestore(transactionId).catch(console.warn);

    // 3. Catat audit bukti riwayat (evidence log)
    await logAction(
      'TRANSACTION_DELETE',
      `Riwayat struk nota ${targetTx.invoiceNumber} dihapus oleh ${currentUser.name} (${currentUser.roleName}). ${
        returnStock ? 'Stok produk berhasil dikembalikan ke inventaris.' : 'Stok produk tidak diubah.'
      }`,
      targetTx.id,
      JSON.stringify({
        invoiceNumber: targetTx.invoiceNumber,
        total: targetTx.total,
        customerName: targetTx.customerName,
        paymentMethod: targetTx.paymentMethod,
        returnStock,
        deletedBy: currentUser.name,
        deletedByRole: currentUser.role,
        deletedAt: new Date().toISOString(),
        items: targetTx.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          qty: i.quantity,
          subtotal: i.subtotal,
        })),
      })
    );

    return {
      success: true,
      message: `Struk nota ${targetTx.invoiceNumber} berhasil dihapus!${
        returnStock ? ' Stok barang telah dikembalikan ke inventaris.' : ''
      }`,
    };
  };

  // Clear all transactions history (Bersihkan Seluruh Riwayat Struk)
  const clearAllTransactions = async (
    returnStock: boolean = false
  ): Promise<{ success: boolean; message: string }> => {
    if (currentUser?.role !== 'administrator' && currentUser?.role !== 'owner') {
      return {
        success: false,
        message: 'Akses ditolak: Hanya Administrator atau Pemilik Toko yang berhak membersihkan seluruh riwayat struk.',
      };
    }

    const count = transactions.length;
    if (count === 0) {
      return { success: true, message: 'Tidak ada riwayat struk untuk dihapus.' };
    }

    if (returnStock) {
      setProducts((prev) =>
        prev.map((p) => {
          let additionalStock = 0;
          transactions.forEach((tx) => {
            tx.items.forEach((item) => {
              if (item.productId === p.id) {
                additionalStock += item.quantity;
              }
            });
          });
          if (additionalStock > 0) {
            const newStock = p.stock + additionalStock;
            updateProductStockInFirestore(p.id, newStock).catch(console.warn);
            return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
          }
          return p;
        })
      );
    }

    setTransactions([]);
    clearAllTransactionsFromFirestore().catch(console.warn);

    await logAction(
      'TRANSACTIONS_CLEAR',
      `Seluruh riwayat struk (${count} transaksi) dibersihkan oleh ${currentUser.name} (${currentUser.roleName}). ${
        returnStock ? 'Stok produk dikembalikan ke inventaris.' : 'Stok produk tidak diubah.'
      }`,
      'all_transactions',
      JSON.stringify({
        totalTransactionsCleared: count,
        returnStock,
        clearedBy: currentUser.name,
        clearedAt: new Date().toISOString(),
      })
    );

    return {
      success: true,
      message: `Seluruh riwayat struk (${count} transaksi) berhasil dibersihkan!`,
    };
  };

  // Save Stock Opname
  const saveStockOpname = async (
    opnameData: Omit<StockOpname, 'id' | 'createdAt'>,
    applyAdjustment: boolean
  ): Promise<StockOpname> => {
    const newSO: StockOpname = {
      ...opnameData,
      id: `so-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (applyAdjustment) {
      setProducts((prev) =>
        prev.map((p) => {
          const auditedItem = newSO.items.find((item) => item.productId === p.id);
          if (auditedItem) {
            return { ...p, stock: auditedItem.physicalStock, updatedAt: new Date().toISOString() };
          }
          return p;
        })
      );
    }

    setStockOpnames((prev) => [newSO, ...prev]);
    await saveStockOpnameToFirestore(newSO, applyAdjustment);

    // Evidence Log
    logAction(
      'STOCK_OPNAME_SAVE',
      `Audit stok opname ${newSO.opnameNumber} disimpan oleh ${currentUser.name} (Selisih: ${newSO.totalDiscrepancyQty} unit, Nilai: ${newSO.totalDiscrepancyValue})`,
      newSO.id,
      JSON.stringify({ opnameNumber: newSO.opnameNumber, discrepancyQty: newSO.totalDiscrepancyQty, discrepancyValue: newSO.totalDiscrepancyValue })
    );

    return newSO;
  };

  // Upsert Product
  const upsertProduct = async (product: Product): Promise<void> => {
    const isNew = !products.some((p) => p.id === product.id);

    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = product;
        return next;
      }
      return [product, ...prev];
    });

    await saveProductToFirestore(product);

    // Evidence Log
    logAction(
      isNew ? 'PRODUCT_CREATE' : 'PRODUCT_UPDATE',
      `${isNew ? 'Tambah' : 'Ubah'} data barang: "${product.name}" (SKU: ${product.sku}, Stok: ${product.stock}, Harga: ${product.price}) oleh ${currentUser.name}`,
      product.id,
      JSON.stringify({ id: product.id, name: product.name, sku: product.sku, stock: product.stock, price: product.price })
    );
  };

  // Remove Product
  const removeProduct = async (productId: string): Promise<void> => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    await deleteProductFromFirestore(productId);

    // Evidence Log
    logAction(
      'PRODUCT_DELETE',
      `Menghapus barang "${target?.name || productId}" dari database oleh ${currentUser.name}`,
      productId
    );
  };

  // Adjust Product Stock (Add Stock, Remove Stock, or Clear Stock to 0)
  const adjustProductStock = async (
    productId: string,
    newStock: number,
    reason: string = 'Penyesuaian stok mandiri'
  ): Promise<void> => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const clampedStock = Math.max(0, newStock);
    const oldStock = target.stock;
    const diff = clampedStock - oldStock;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, stock: clampedStock, updatedAt: new Date().toISOString() }
          : p
      )
    );

    await updateProductStockInFirestore(productId, clampedStock);

    const desc =
      clampedStock === 0 && diff < 0
        ? `Menghapus seluruh stok barang "${target.name}" (Stok menjadi 0 unit) oleh ${currentUser.name}`
        : `${diff >= 0 ? 'Menambahkan' : 'Mengurangi'} stok "${target.name}" (${oldStock} -> ${clampedStock} unit, ${diff >= 0 ? '+' : ''}${diff}) oleh ${currentUser.name}`;

    logAction(
      'STOCK_ADJUST',
      desc,
      productId,
      JSON.stringify({ oldStock, newStock: clampedStock, diff, reason })
    );
  };

  // Add Cash Flow Record
  const addCashFlowRecord = async (
    type: 'income' | 'expense',
    category: string,
    amount: number,
    description: string
  ): Promise<void> => {
    const flow: CashFlow = {
      id: `cf-${Date.now()}`,
      type,
      category,
      amount,
      description,
      cashierName: currentUser.name,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setCashFlows((prev) => [flow, ...prev]);
    await addCashFlowToFirestore(flow);

    logAction(
      'CASH_FLOW_CREATE',
      `Arus kas ${type.toUpperCase()} sebesar ${amount} (${category}: ${description}) oleh ${currentUser.name}`,
      flow.id
    );
  };

  // Delete individual cash flow record (Khusus Administrator)
  const deleteCashFlowRecord = async (
    flowId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (currentUser?.role !== 'administrator') {
      throw new Error('Akses ditolak: Hanya Administrator yang berhak menghapus catatan kas.');
    }

    const target = cashFlows.find((cf) => cf.id === flowId);
    if (!target) {
      return { success: false, message: 'Data arus kas tidak ditemukan.' };
    }

    setCashFlows((prev) => prev.filter((cf) => cf.id !== flowId));
    await deleteCashFlowFromFirestore(flowId).catch(console.warn);

    await logAction(
      'CASH_FLOW_DELETE',
      `Administrator ${currentUser.name} menghapus catatan kas ${target.type === 'expense' ? 'keluar' : 'masuk'} (${target.category}) senilai Rp ${target.amount.toLocaleString('id-ID')}: "${target.description}"`,
      flowId,
      JSON.stringify({
        flowId,
        type: target.type,
        category: target.category,
        amount: target.amount,
        description: target.description,
        deletedBy: currentUser.name,
        deletedAt: new Date().toISOString(),
      })
    );

    return {
      success: true,
      message: `Catatan kas ${target.type === 'expense' ? 'keluar' : 'masuk'} berhasil dihapus!`,
    };
  };

  // Delete Total Kas Keluar (Hanya berlaku untuk fitur Administrator)
  const clearExpenseCashFlows = async (): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
    totalDeletedAmount: number;
  }> => {
    if (currentUser?.role !== 'administrator') {
      throw new Error('Akses ditolak: Fitur hapus total kas keluar hanya berlaku untuk akun Administrator.');
    }

    const expensesToDelete = cashFlows.filter((cf) => cf.type === 'expense');
    const count = expensesToDelete.length;
    const totalAmount = expensesToDelete.reduce((sum, cf) => sum + cf.amount, 0);

    if (count === 0) {
      return {
        success: false,
        message: 'Tidak ada data pengeluaran (kas keluar) yang tercatat.',
        deletedCount: 0,
        totalDeletedAmount: 0,
      };
    }

    // Filter out all expense records from local state
    setCashFlows((prev) => prev.filter((cf) => cf.type !== 'expense'));

    // Remove from Firestore
    await clearExpenseCashFlowsFromFirestore().catch(console.warn);

    // Audit Evidence Log
    await logAction(
      'CASH_FLOW_EXPENSES_CLEAR',
      `Administrator ${currentUser.name} (${currentUser.roleName}) membersihkan total kas keluar (${count} transaksi pengeluaran, total: Rp ${totalAmount.toLocaleString('id-ID')}). Saldo kas bersih toko kini disesuaikan kembali.`,
      'all_expenses',
      JSON.stringify({
        deletedCount: count,
        totalDeletedAmount: totalAmount,
        clearedBy: currentUser.name,
        clearedByRole: currentUser.role,
        clearedAt: new Date().toISOString(),
      })
    );

    return {
      success: true,
      message: `Berhasil menghapus seluruh total kas keluar (${count} transaksi senilai Rp ${totalAmount.toLocaleString('id-ID')})!`,
      deletedCount: count,
      totalDeletedAmount: totalAmount,
    };
  };

  // Beep sound generator for barcode scanning
  const playScannerBeep = (type: 'success' | 'error' = 'success') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'success') {
        // High crisp retail POS scanner chirp (1950Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1950, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        // Low error buzz (320Hz)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {}
  };

  // Barcode scan trigger
  const triggerBarcodeScan = (barcodeOrQuery: string): boolean => {
    const trimmed = barcodeOrQuery.trim();
    if (!trimmed) return false;

    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase()) ||
        p.sku.toLowerCase() === trimmed.toLowerCase() ||
        p.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (found) {
      if (found.stock <= 0) {
        if (barcodeScannerAudio) {
          playScannerBeep('error');
        }
        setScanFeedback({
          text: `Stok "${found.name}" habis (0 unit)!`,
          type: 'error',
        });
        setTimeout(() => setScanFeedback(null), 3000);
        return false;
      }

      if (barcodeScannerAudio) {
        playScannerBeep('success');
      }

      addToCart(found);
      setSearchQuery('');
      setScanFeedback({
        text: `Berhasil scan: ${found.name} (+1 ke keranjang)`,
        type: 'success',
      });
      setTimeout(() => setScanFeedback(null), 2500);
      return true;
    } else {
      if (barcodeScannerAudio) {
        playScannerBeep('error');
      }
      setScanFeedback({
        text: `Barcode / SKU "${trimmed}" tidak ditemukan di katalog!`,
        type: 'error',
      });
      setTimeout(() => setScanFeedback(null), 3000);
      return false;
    }
  };

  // ---------------- CATEGORIES CRUD ----------------
  const addCategory = async (
    categoryData: Omit<ProductCategory, 'id' | 'createdAt'>
  ): Promise<ProductCategory> => {
    const newCategory: ProductCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: categoryData.name.trim(),
      itemType: categoryData.itemType?.trim() || 'Barang Umum Toko',
      description: categoryData.description?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    setCategories((prev) => [...prev, newCategory]);
    try {
      localStorage.setItem('almas_categories', JSON.stringify([...categories, newCategory]));
    } catch {}
    await saveCategoryToFirestore(newCategory).catch(console.warn);

    logAction(
      'CATEGORY_CREATE',
      `Menambahkan kategori baru: "${newCategory.name}" (Jenis: ${newCategory.itemType}) oleh ${currentUser.name}`,
      newCategory.id,
      JSON.stringify(newCategory)
    );

    return newCategory;
  };

  const updateCategory = async (category: ProductCategory): Promise<void> => {
    setCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));
    try {
      localStorage.setItem(
        'almas_categories',
        JSON.stringify(categories.map((c) => (c.id === category.id ? category : c)))
      );
    } catch {}
    await saveCategoryToFirestore(category).catch(console.warn);

    logAction(
      'CATEGORY_UPDATE',
      `Memperbarui kategori: "${category.name}" (Jenis: ${category.itemType}) oleh ${currentUser.name}`,
      category.id,
      JSON.stringify(category)
    );
  };

  const deleteCategory = async (categoryId: string): Promise<void> => {
    const target = categories.find((c) => c.id === categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    try {
      localStorage.setItem(
        'almas_categories',
        JSON.stringify(categories.filter((c) => c.id !== categoryId))
      );
    } catch {}
    await deleteCategoryFromFirestore(categoryId).catch(console.warn);

    if (target) {
      logAction(
        'CATEGORY_DELETE',
        `Menghapus kategori "${target.name}" dari sistem oleh ${currentUser.name}`,
        categoryId
      );
    }
  };

  // ---------------- SYSTEM LOGIN ACCOUNTS (USERS) CRUD ----------------
  const addSystemUser = async (
    userData: Omit<StoreUser, 'id' | 'createdAt'>
  ): Promise<StoreUser> => {
    if (currentUser?.role !== 'administrator') {
      throw new Error(
        'Akses Ditolak: Hanya privilege Administrator yang memiliki wewenang membuat akun akses login baru.'
      );
    }

    const getRoleName = (r: UserRole): string => {
      switch (r) {
        case 'administrator':
          return 'Administrator (Full Akses & Log Evidence)';
        case 'cashier':
          return 'Kasir (Transaksi Penjualan)';
        case 'warehouse_admin':
          return 'Admin Gudang (Stok Opname & Inventaris)';
        case 'owner':
          return 'Owner (Pemilik Toko - Akses Terpadu)';
      }
    };

    const newUser: StoreUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: userData.username.trim().toLowerCase(),
      password: userData.password || '123',
      name: userData.name.trim(),
      role: userData.role,
      roleName: userData.roleName || getRoleName(userData.role),
      email: userData.email?.trim() || `${userData.username.trim().toLowerCase()}@tokoalmas.id`,
      avatar:
        userData.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      status: userData.status || 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    setSystemUsers((prev) => [...prev, newUser]);
    try {
      localStorage.setItem('almas_system_users', JSON.stringify([...systemUsers, newUser]));
    } catch {}
    await saveSystemUserToFirestore(newUser).catch(console.warn);

    logAction(
      'USER_CREATE',
      `Menambahkan akses login baru: ${newUser.name} (@${newUser.username}, Role: ${newUser.role}) oleh ${currentUser.name}`,
      newUser.id,
      JSON.stringify({ username: newUser.username, name: newUser.name, role: newUser.role, status: newUser.status })
    );

    return newUser;
  };

  const updateSystemUser = async (user: StoreUser): Promise<void> => {
    if (currentUser?.role !== 'administrator' && currentUser?.id !== user.id) {
      throw new Error(
        'Akses Ditolak: Hanya privilege Administrator atau pemilik akun sendiri yang berhak mengubah data akun dan kata sandi.'
      );
    }

    const updatedUser = {
      ...user,
      username: user.username.trim().toLowerCase(),
    };
    setSystemUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    try {
      localStorage.setItem(
        'almas_system_users',
        JSON.stringify(systemUsers.map((u) => (u.id === user.id ? updatedUser : u)))
      );
    } catch {}
    await saveSystemUserToFirestore(updatedUser).catch(console.warn);

    if (currentUser.id === user.id) {
      setCurrentUser(updatedUser);
    }

    logAction(
      'USER_UPDATE',
      `Memperbarui profil login ${updatedUser.name} (@${updatedUser.username}) oleh ${currentUser.name}`,
      updatedUser.id,
      JSON.stringify({ username: updatedUser.username, name: updatedUser.name, role: updatedUser.role, status: updatedUser.status })
    );
  };

  const toggleSystemUserStatus = async (userId: string): Promise<void> => {
    if (currentUser?.role !== 'administrator') {
      alert(
        'Akses Ditolak: Hanya privilege Administrator yang memiliki wewenang mengaktifkan atau menonaktifkan akun login.'
      );
      return;
    }

    const target = systemUsers.find((u) => u.id === userId);
    if (!target) return;

    if (currentUser.id === userId && target.status === 'active') {
      alert('Anda tidak dapat menonaktifkan akun yang sedang digunakan saat ini.');
      return;
    }

    const nextStatus: 'active' | 'disabled' = target.status === 'active' ? 'disabled' : 'active';
    const updatedUser: StoreUser = { ...target, status: nextStatus };

    setSystemUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    try {
      localStorage.setItem(
        'almas_system_users',
        JSON.stringify(systemUsers.map((u) => (u.id === userId ? updatedUser : u)))
      );
    } catch {}
    await updateSystemUserStatusInFirestore(userId, nextStatus).catch(console.warn);

    logAction(
      'USER_STATUS_CHANGE',
      `Mengubah status akses ${target.name} (@${target.username}) menjadi ${
        nextStatus === 'active' ? 'AKTIF (Enabled)' : 'NONAKTIF (Disabled)'
      } oleh ${currentUser.name}`,
      userId
    );
  };

  const deleteSystemUser = async (
    userId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (currentUser?.role !== 'administrator') {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya privilege Administrator yang berhak menghapus akun pengguna.',
      };
    }

    const target = systemUsers.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'Pengguna tidak ditemukan.' };

    if (currentUser.id === userId) {
      return { success: false, message: 'Tidak dapat menghapus akun yang sedang Anda gunakan.' };
    }

    const remainingAdmins = systemUsers.filter(
      (u) => u.role === 'administrator' && u.id !== userId && u.status === 'active'
    );
    if (target.role === 'administrator' && remainingAdmins.length === 0) {
      return {
        success: false,
        message: 'Tidak dapat menghapus satu-satunya Administrator aktif di sistem.',
      };
    }

    setSystemUsers((prev) => prev.filter((u) => u.id !== userId));
    try {
      localStorage.setItem(
        'almas_system_users',
        JSON.stringify(systemUsers.filter((u) => u.id !== userId))
      );
    } catch {}
    await deleteSystemUserFromFirestore(userId).catch(console.warn);

    logAction(
      'USER_DELETE',
      `Menghapus akun login ${target.name} (@${target.username}) oleh ${currentUser.name}`,
      userId
    );

    return { success: true, message: `Akun ${target.name} berhasil dihapus.` };
  };

  // Real System Login with Username and Password
  const loginWithCredentials = async (
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; message: string; user?: StoreUser }> => {
    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanUsername) {
      return { success: false, message: 'Silakan masukkan username akses login Anda.' };
    }

    // Find account by username or email
    const match = systemUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        u.email.toLowerCase() === cleanUsername
    );

    if (!match) {
      return {
        success: false,
        message: `Username "${usernameInput}" tidak ditemukan dalam sistem. Pastikan ejaan benar atau buat akun baru di menu Pengaturan.`,
      };
    }

    // Check if account is disabled (Enable / Disable feature)
    if (match.status === 'disabled') {
      return {
        success: false,
        message: `Akses Ditolak: Akun "${match.name}" telah dinonaktifkan oleh administrator. Silakan hubungi admin toko untuk mengaktifkan kembali.`,
      };
    }

    // Verify password
    if (match.password && match.password !== cleanPassword) {
      return {
        success: false,
        message: 'Kata sandi tidak sesuai. Klik ikon mata untuk memastikan kata sandi yang Anda ketik benar.',
      };
    }

    // Login successful
    const updated: StoreUser = {
      ...match,
      lastLogin: new Date().toISOString(),
    };

    setIsAuthenticated(true);
    setCurrentUser(updated);
    try {
      localStorage.setItem('almas_user_id', updated.id);
    } catch {}

    setSystemUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    saveSystemUserToFirestore(updated).catch(console.warn);

    // Tab access adjustment
    if (updated.role === 'cashier' && activeTab !== 'pos' && activeTab !== 'transactions') {
      setActiveTab('pos');
    } else if (updated.role === 'warehouse_admin' && activeTab !== 'stock_opname' && activeTab !== 'products') {
      setActiveTab('stock_opname');
    } else if (updated.role === 'owner' && activeTab === 'evidence_logs') {
      setActiveTab('analytics');
    }

    logAction('LOGIN', `Akses login sistem berhasil: ${updated.name} (@${updated.username}, Role: ${updated.roleName})`, updated.id);

    return {
      success: true,
      message: `Selamat datang, ${updated.name}! Akses berhasil diberikan.`,
      user: updated,
    };
  };

  // Reset database completely empty
  const clearAllData = async (): Promise<string> => {
    setProducts([]);
    setTransactions([]);
    setStockOpnames([]);
    setCashFlows([]);
    setCart([]);
    const res = await clearAllFirestoreData();
    logAction('DATABASE_RESET', `Seluruh data dummy & transaksi database dikosongkan oleh ${currentUser.name}`);
    return res.message;
  };

  const loadSampleData = async (): Promise<string> => {
    const res = await seedSampleProducts();
    logAction('DATABASE_RESET', `Data sampel produk diisi oleh ${currentUser.name}`);
    return res.message;
  };

  return (
    <StoreContext.Provider value={{
        activeTab,
        setActiveTab,
        products,
        transactions,
        stockOpnames,
        cashFlows,
        activityLogs,
        cart,
        customerName,
        setCustomerName,
        customerType,
        setCustomerType,
        orderNotes,
        setOrderNotes,
        orderDiscount,
        setOrderDiscount,
        addToCart,
        removeFromCart,
        updateQuantity,
        changeQuantity,
        clearCart,
        cartSubtotal,
        cartTotalDiscount,
        cartGrandTotal,
        completeTransaction,
        deleteTransaction,
        clearAllTransactions,
        saveStockOpname,
        upsertProduct,
        removeProduct,
        addCashFlowRecord,
        deleteCashFlowRecord,
        clearExpenseCashFlows,
        logAction,
        currentUser,
        isAuthenticated,
        switchUser,
        logout,
        canAccessTab,
        canEditProductImage,
        canEditProductName,
        canEditCategory,
        canAddStock,
        canDeleteStock,
        canDeleteProduct,
        canDeleteReceipt,
        canDeleteCashOut,
        canEditFinanceFields,
        canManageSystemUsers,
        monthlySalesTarget,
        setMonthlySalesTarget,
        clearMonthlySalesTarget,
        adjustProductStock,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        systemUsers,
        addSystemUser,
        updateSystemUser,
        toggleSystemUserStatus,
        deleteSystemUser,
        loginWithCredentials,
        clearAllData,
        loadSampleData,
        isFirebaseActive,
        syncStatus,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        latestCompletedTransaction,
        setLatestCompletedTransaction,
        isReceiptModalOpen,
        setIsReceiptModalOpen,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        barcodeScannerMode,
        setBarcodeScannerMode,
        scannerFocusRequest,
        triggerFocusScannerInput,
        barcodeScannerAudio,
        setBarcodeScannerAudio,
        scanFeedback,
        triggerBarcodeScan,
        playScannerBeep,
        qrisConfig,
        updateQrisConfig,
        speakPaymentSuccess,
        testVoiceAlerts,
      }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
