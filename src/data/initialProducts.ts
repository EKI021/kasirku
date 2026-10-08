import { Product, Transaction, StockOpname, CashFlow, ActivityLog, ProductCategory, StoreUser } from '../types';

// System starts completely empty of dummy inventory as requested by user
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_STOCK_OPNAMES: StockOpname[] = [];
export const INITIAL_CASH_FLOWS: CashFlow[] = [];
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];

// Default Product Categories & Item Types (Jenis Barang)
export const INITIAL_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-sembako',
    name: 'Sembako',
    itemType: 'Bahan Pokok Pangan',
    description: 'Beras, Minyak Goreng, Gula Pasir, Tepung Terigu, Telur Ayam',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-minuman',
    name: 'Minuman Ringan',
    itemType: 'Minuman Kemasan & Botol',
    description: 'Air mineral, Teh kemasan, Susu UHT, Kopi instan sachet',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-makanan',
    name: 'Makanan & Snack',
    itemType: 'Makanan Kering & Biskuit',
    description: 'Mie instan, Biskuit kaleng, Keripik camilan, Roti',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-bumbu',
    name: 'Bumbu Dapur',
    itemType: 'Penyedap & Rempah',
    description: 'Garam beryodium, Penyedap rasa, Kecap manis, Saus sambal',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-kebersihan',
    name: 'Sabun & Kebersihan',
    itemType: 'Perlengkapan Rumah Tangga',
    description: 'Deterjen pakaian, Sabun mandi, Sampo rambut, Pembersih lantai',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-lainnya',
    name: 'Lain-lain',
    itemType: 'Barang Umum Toko',
    description: 'Korek api, Baterai, Kantong kresek, Obat-obatan warung',
    createdAt: new Date().toISOString(),
  },
];

// Initial System Login Accounts with Username, Password, and Role
export const INITIAL_SYSTEM_USERS: StoreUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: '123',
    name: 'Saiful Almas (Administrator)',
    role: 'administrator',
    roleName: 'Administrator (Full Akses & Log Evidence)',
    email: 'admin@tokoalmas.id',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-owner',
    username: 'owner',
    password: '123',
    name: 'H. Almas (Owner / Pemilik Toko)',
    role: 'owner',
    roleName: 'Owner (Pemilik Toko - Akses Terpadu)',
    email: 'owner@tokoalmas.id',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-cashier',
    username: 'kasir',
    password: '123',
    name: 'Ahmad Fauzi (Kasir)',
    role: 'cashier',
    roleName: 'Kasir (Transaksi Penjualan)',
    email: 'kasir@tokoalmas.id',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-warehouse',
    username: 'gudang',
    password: '123',
    name: 'Budi Santoso (Admin Gudang)',
    role: 'warehouse_admin',
    roleName: 'Admin Gudang (Stok Opname & Inventaris)',
    email: 'gudang@tokoalmas.id',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
];

// Optional sample products if user explicitly requests to load sample data via settings button
export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Beras Premium Ramos 5kg',
    sku: 'BRS-RMS-05',
    barcode: '899123456001',
    category: 'Sembako',
    price: 74000,
    costPrice: 66000,
    stock: 28,
    minStock: 10,
    unit: 'Karung',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    name: 'Minyak Goreng Bimoli 2L',
    sku: 'MYK-BML-02',
    barcode: '899123456002',
    category: 'Sembako',
    price: 36500,
    costPrice: 32000,
    stock: 45,
    minStock: 15,
    unit: 'Pouch',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-003',
    name: 'Gula Pasir Gulaku Putih 1kg',
    sku: 'GLA-GLK-01',
    barcode: '899123456003',
    category: 'Sembako',
    price: 17500,
    costPrice: 15200,
    stock: 52,
    minStock: 20,
    unit: 'Bungkus',
    imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-004',
    name: 'Indomie Goreng Spesial (Dus 40 Pcs)',
    sku: 'MIE-IND-DUS',
    barcode: '899123456005',
    category: 'Makanan & Minuman',
    price: 122000,
    costPrice: 108000,
    stock: 14,
    minStock: 5,
    unit: 'Dus',
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];
