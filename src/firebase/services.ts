import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';
import { Product, Transaction, StockOpname, CashFlow, ActivityLog, ProductCategory, StoreUser } from '../types';
import { SAMPLE_PRODUCTS } from '../data/initialProducts';

const PRODUCTS_COL = 'products';
const TRANSACTIONS_COL = 'transactions';
const STOCK_OPNAMES_COL = 'stock_opnames';
const CASH_FLOWS_COL = 'cash_flows';
const ACTIVITY_LOGS_COL = 'activity_logs';
const CATEGORIES_COL = 'categories';
const SYSTEM_USERS_COL = 'system_users';

/**
 * Recursively strips all undefined values from an object or array
 * to prevent Firestore "Unsupported field value: undefined" errors.
 */
function cleanFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// ---------------- PRODUCTS ----------------

export function subscribeToProducts(
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, PRODUCTS_COL));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: Product[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...(d.data() as Omit<Product, 'id'>) });
        });
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, PRODUCTS_COL);
        onError?.(error as Error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PRODUCTS_COL);
    throw error;
  }
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  const path = `${PRODUCTS_COL}/${product.id}`;
  try {
    await setDoc(doc(db, PRODUCTS_COL, product.id), {
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category: product.category,
      price: Number(product.price),
      costPrice: Number(product.costPrice),
      stock: Number(product.stock),
      minStock: Number(product.minStock),
      unit: product.unit,
      imageUrl: product.imageUrl || '',
      updatedAt: new Date().toISOString(),
      createdAt: product.createdAt || new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `${PRODUCTS_COL}/${productId}`;
  try {
    await deleteDoc(doc(db, PRODUCTS_COL, productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateProductStockInFirestore(
  productId: string,
  newStock: number
): Promise<void> {
  const path = `${PRODUCTS_COL}/${productId}`;
  try {
    await updateDoc(doc(db, PRODUCTS_COL, productId), {
      stock: Number(newStock),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------- TRANSACTIONS ----------------

export function subscribeToTransactions(
  onData: (transactions: Transaction[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, TRANSACTIONS_COL), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: Transaction[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...(d.data() as Omit<Transaction, 'id'>) });
        });
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, TRANSACTIONS_COL);
        onError?.(error as Error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, TRANSACTIONS_COL);
    throw error;
  }
}

export async function createTransactionInFirestore(
  transaction: Transaction
): Promise<void> {
  const path = `${TRANSACTIONS_COL}/${transaction.id}`;
  try {
    const cleanTx = cleanFirestoreData(transaction);
    await setDoc(doc(db, TRANSACTIONS_COL, transaction.id), cleanTx);

    // Also deduct product stocks in Firestore
    for (const item of transaction.items) {
      try {
        const prodRef = doc(db, PRODUCTS_COL, item.productId);
        await updateDoc(prodRef, {
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Error adjusting item stock:', e);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteTransactionFromFirestore(transactionId: string): Promise<void> {
  const path = `${TRANSACTIONS_COL}/${transactionId}`;
  try {
    await deleteDoc(doc(db, TRANSACTIONS_COL, transactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllTransactionsFromFirestore(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, TRANSACTIONS_COL));
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (error) {
    console.error('Error clearing transactions from Firestore:', error);
  }
}

// ---------------- STOCK OPNAME ----------------

export function subscribeToStockOpnames(
  onData: (opnames: StockOpname[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, STOCK_OPNAMES_COL), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: StockOpname[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...(d.data() as Omit<StockOpname, 'id'>) });
        });
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, STOCK_OPNAMES_COL);
        onError?.(error as Error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, STOCK_OPNAMES_COL);
    throw error;
  }
}

export async function saveStockOpnameToFirestore(
  opname: StockOpname,
  applyStockAdjustment: boolean = true
): Promise<void> {
  const path = `${STOCK_OPNAMES_COL}/${opname.id}`;
  try {
    const cleanOpname = cleanFirestoreData(opname);
    await setDoc(doc(db, STOCK_OPNAMES_COL, opname.id), cleanOpname);

    if (applyStockAdjustment) {
      // Synchronize physical stock to system products
      for (const item of opname.items) {
        try {
          await updateProductStockInFirestore(item.productId, item.physicalStock);
        } catch (e) {
          console.warn('Error updating stock after opname:', e);
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- CASH FLOW ----------------

export function subscribeToCashFlows(
  onData: (flows: CashFlow[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, CASH_FLOWS_COL), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: CashFlow[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...(d.data() as Omit<CashFlow, 'id'>) });
        });
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, CASH_FLOWS_COL);
        onError?.(error as Error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, CASH_FLOWS_COL);
    throw error;
  }
}

export async function addCashFlowToFirestore(flow: CashFlow): Promise<void> {
  const path = `${CASH_FLOWS_COL}/${flow.id}`;
  try {
    const cleanFlow = cleanFirestoreData(flow);
    await setDoc(doc(db, CASH_FLOWS_COL, flow.id), cleanFlow);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCashFlowFromFirestore(flowId: string): Promise<void> {
  const path = `${CASH_FLOWS_COL}/${flowId}`;
  try {
    await deleteDoc(doc(db, CASH_FLOWS_COL, flowId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearExpenseCashFlowsFromFirestore(): Promise<number> {
  let count = 0;
  try {
    const snap = await getDocs(collection(db, CASH_FLOWS_COL));
    for (const d of snap.docs) {
      const data = d.data();
      if (data.type === 'expense') {
        await deleteDoc(d.ref);
        count++;
      }
    }
    return count;
  } catch (error) {
    console.error('Error clearing expenses from Firestore:', error);
    return count;
  }
}

// ---------------- ACTIVITY LOGS (LOG EVIDENCE - ADMINISTRATOR ONLY) ----------------

export function subscribeToActivityLogs(
  onData: (logs: ActivityLog[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, ACTIVITY_LOGS_COL), orderBy('timestamp', 'desc'), limit(150));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: ActivityLog[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...(d.data() as Omit<ActivityLog, 'id'>) });
        });
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, ACTIVITY_LOGS_COL);
        onError?.(error as Error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, ACTIVITY_LOGS_COL);
    throw error;
  }
}

export async function logActivityToFirestore(log: ActivityLog): Promise<void> {
  const path = `${ACTIVITY_LOGS_COL}/${log.id}`;
  try {
    const docData: Record<string, unknown> = {
      id: log.id,
      timestamp: log.timestamp || new Date().toISOString(),
      userId: log.userId || 'unauthenticated',
      userName: log.userName || 'Sistem Keamanan',
      userRole: log.userRole || 'cashier',
      actionType: log.actionType,
      description: log.description || '',
    };
    if (log.targetId !== undefined && log.targetId !== null && log.targetId !== '') {
      docData.targetId = log.targetId;
    }
    if (log.evidenceData !== undefined && log.evidenceData !== null && log.evidenceData !== '') {
      docData.evidenceData = log.evidenceData;
    }
    await setDoc(doc(db, ACTIVITY_LOGS_COL, log.id), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ---------------- CATEGORIES & JENIS BARANG ----------------

export function subscribeToCategories(
  onData: (categories: ProductCategory[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, CATEGORIES_COL));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: ProductCategory[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...(d.data() as Omit<ProductCategory, 'id'>) });
        });
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, CATEGORIES_COL);
        onError?.(error as Error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, CATEGORIES_COL);
    throw error;
  }
}

export async function saveCategoryToFirestore(category: ProductCategory): Promise<void> {
  const path = `${CATEGORIES_COL}/${category.id}`;
  try {
    await setDoc(doc(db, CATEGORIES_COL, category.id), {
      name: category.name,
      itemType: category.itemType,
      description: category.description || '',
      createdAt: category.createdAt || new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  const path = `${CATEGORIES_COL}/${categoryId}`;
  try {
    await deleteDoc(doc(db, CATEGORIES_COL, categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- SYSTEM LOGIN ACCOUNTS (USERS) ----------------

export function subscribeToSystemUsers(
  onData: (users: StoreUser[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, SYSTEM_USERS_COL));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: StoreUser[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...(d.data() as Omit<StoreUser, 'id'>) });
        });
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, SYSTEM_USERS_COL);
        onError?.(error as Error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, SYSTEM_USERS_COL);
    throw error;
  }
}

export async function saveSystemUserToFirestore(user: StoreUser): Promise<void> {
  const path = `${SYSTEM_USERS_COL}/${user.id}`;
  try {
    await setDoc(doc(db, SYSTEM_USERS_COL, user.id), {
      username: user.username,
      password: user.password || '',
      name: user.name,
      role: user.role,
      roleName: user.roleName,
      email: user.email || '',
      avatar: user.avatar || '',
      status: user.status || 'active',
      createdAt: user.createdAt || new Date().toISOString(),
      lastLogin: user.lastLogin || new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateSystemUserStatusInFirestore(
  userId: string,
  status: 'active' | 'disabled'
): Promise<void> {
  const path = `${SYSTEM_USERS_COL}/${userId}`;
  try {
    await updateDoc(doc(db, SYSTEM_USERS_COL, userId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSystemUserFromFirestore(userId: string): Promise<void> {
  const path = `${SYSTEM_USERS_COL}/${userId}`;
  try {
    await deleteDoc(doc(db, SYSTEM_USERS_COL, userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- DATABASE MANAGEMENT & CLEARING ----------------

export async function clearAllFirestoreData(): Promise<{ success: boolean; message: string }> {
  try {
    const collectionsToClear = [
      PRODUCTS_COL,
      TRANSACTIONS_COL,
      STOCK_OPNAMES_COL,
      CASH_FLOWS_COL,
      ACTIVITY_LOGS_COL,
    ];

    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    }

    return {
      success: true,
      message: 'Seluruh data dummy berhasil dihapus! Database sekarang bersih (0 item).',
    };
  } catch (error) {
    console.error('Error clearing Firestore data:', error);
    return {
      success: false,
      message: 'Gagal membersihkan data: ' + (error instanceof Error ? error.message : String(error)),
    };
  }
}

export async function seedSampleProducts(): Promise<{ success: boolean; message: string }> {
  try {
    for (const prod of SAMPLE_PRODUCTS) {
      await setDoc(doc(db, PRODUCTS_COL, prod.id), prod);
    }
    return { success: true, message: 'Data sampel produk berhasil dimuat!' };
  } catch (error) {
    return {
      success: false,
      message: 'Gagal memuat sampel: ' + (error instanceof Error ? error.message : String(error)),
    };
  }
}

// ---------------- STORE SETTINGS ----------------
const SETTINGS_COL = 'settings';

export async function saveStoreSettingsToFirestore(
  settings: Record<string, unknown>
): Promise<void> {
  const path = `${SETTINGS_COL}/general`;
  try {
    await setDoc(doc(db, SETTINGS_COL, 'general'), {
      ...settings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
