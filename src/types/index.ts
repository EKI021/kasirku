export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  costPrice: number; // HPP (Harga Pokok Penjualan)
  stock: number;
  minStock: number;
  unit: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'qris' | 'transfer';

export interface TransactionItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
  discount: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  cashierName: string;
  customerName: string;
  customerType: 'regular' | 'member' | 'wholesale';
  notes?: string;
  createdAt: string;
}

export interface StockOpnameItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  systemStock: number;
  physicalStock: number;
  difference: number; // physicalStock - systemStock
  costPrice: number;
  differenceValue: number; // difference * costPrice
  reason: 'rusak' | 'kadaluwarsa' | 'hilang' | 'salah_hitung' | 'bonus_supplier' | 'sesuai';
}

export interface StockOpname {
  id: string;
  opnameNumber: string;
  date: string;
  operator: string;
  totalItemsChecked: number;
  totalDiscrepancyQty: number;
  totalDiscrepancyValue: number;
  items: StockOpnameItem[];
  status: 'completed' | 'draft';
  notes?: string;
  createdAt: string;
}

export interface CashFlow {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  cashierName: string;
  date: string;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  itemType: string; // Jenis barang (misal: Bahan Pokok, Minuman Kemasan, Makanan Ringan, Sabun & Kebersihan, dll)
  description?: string;
  createdAt: string;
}

export type UserRole = 'administrator' | 'cashier' | 'warehouse_admin' | 'owner';

export interface StoreUser {
  id: string;
  username: string; // Akses login sistem
  password?: string; // Kata sandi real login
  name: string;
  role: UserRole;
  roleName: string;
  email: string;
  avatar: string;
  status: 'active' | 'disabled'; // Fitur disable / enable akses login
  createdAt?: string;
  lastLogin?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  actionType:
    | 'LOGIN'
    | 'LOGOUT'
    | 'TRANSACTION_CREATE'
    | 'STOCK_OPNAME_SAVE'
    | 'PRODUCT_CREATE'
    | 'PRODUCT_UPDATE'
    | 'PRODUCT_DELETE'
    | 'STOCK_ADJUST'
    | 'CASH_FLOW_CREATE'
    | 'CASH_FLOW_DELETE'
    | 'CASH_FLOW_EXPENSES_CLEAR'
    | 'TRANSACTION_DELETE'
    | 'TRANSACTIONS_CLEAR'
    | 'DATABASE_RESET'
    | 'USER_CREATE'
    | 'USER_UPDATE'
    | 'USER_STATUS_CHANGE'
    | 'USER_DELETE'
    | 'CATEGORY_CREATE'
    | 'CATEGORY_UPDATE'
    | 'CATEGORY_DELETE';
  description: string;
  targetId?: string;
  evidenceData?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  receiptFooter: string;
  taxRate: number;
  monthlySalesTarget?: number;
}

export interface StoreBankQrisConfig {
  qrisImageUrl: string; // URL / base64 barcode QRIS asli dari bank
  bankName: string; // Nama Bank (BCA, Mandiri, BRI, BNI, Dana, dll)
  accountNumber: string; // Nomor Rekening Bank
  accountHolder: string; // Nama Pemilik Rekening (Atas Nama)
  secondaryBankName?: string;
  secondaryAccountNumber?: string;
  secondaryAccountHolder?: string;
  qrisMerchantNmid?: string; // NMID QRIS Resmi
  useOfficialBankQris: boolean; // True jika menggunakan foto barcode resmi bank
}

export type ActiveNavTab = 
  | 'pos' 
  | 'stock_opname' 
  | 'products' 
  | 'analytics' 
  | 'transactions' 
  | 'cash_flow' 
  | 'evidence_logs'
  | 'settings';
