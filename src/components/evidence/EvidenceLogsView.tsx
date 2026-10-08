import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  FileCode,
  CheckCircle2,
  Lock,
  Eye,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ActivityLog } from '../../types';
import { formatDate } from '../../utils/currency';
import { exportToCSV } from '../../utils/exportUtils';

export const EvidenceLogsView: React.FC = () => {
  const { activityLogs, currentUser } = useStore();

  const [search, setSearch] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Strictly check if current user is administrator
  if (currentUser.role !== 'administrator') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Akses Terbatas: Hanya Administrator</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          Modul <strong>Log Evidence Kegiatan &amp; Audit Trail</strong> hanya dapat dibuka oleh akun login berhak akses <strong>Administrator</strong>. Akun Anda saat ini adalah ({currentUser.roleName}).
        </p>
      </div>
    );
  }

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchSearch =
        search.trim() === '' ||
        log.description.toLowerCase().includes(search.toLowerCase()) ||
        log.userName.toLowerCase().includes(search.toLowerCase()) ||
        (log.targetId && log.targetId.toLowerCase().includes(search.toLowerCase()));

      const matchAction =
        filterAction === 'all' ||
        (filterAction === 'LOGIN' && (log.actionType === 'LOGIN' || log.actionType === 'LOGOUT')) ||
        (filterAction === 'TRANSACTION' && log.actionType === 'TRANSACTION_CREATE') ||
        (filterAction === 'STOCK_OPNAME' && log.actionType === 'STOCK_OPNAME_SAVE') ||
        (filterAction === 'STOCK_ADJUST' && log.actionType === 'STOCK_ADJUST') ||
        (filterAction === 'PRODUCT' &&
          (log.actionType === 'PRODUCT_CREATE' ||
            log.actionType === 'PRODUCT_UPDATE' ||
            log.actionType === 'PRODUCT_DELETE' ||
            log.actionType === 'STOCK_ADJUST')) ||
        (filterAction === 'CASH_FLOW' && log.actionType === 'CASH_FLOW_CREATE') ||
        (filterAction === 'RESET' && log.actionType === 'DATABASE_RESET');

      const matchRole = filterRole === 'all' || log.userRole === filterRole;

      return matchSearch && matchAction && matchRole;
    });
  }, [activityLogs, search, filterAction, filterRole]);

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Petugas / Pengguna',
      'Role Previlage',
      'Kategori Aksi',
      'Deskripsi Lengkap Kegiatan',
      'Target ID / Ref',
      'Evidence Payload',
    ];

    const rows = filteredLogs.map((log) => [
      formatDate(log.timestamp),
      log.userName,
      log.userRole.toUpperCase(),
      log.actionType,
      log.description,
      log.targetId || '-',
      log.evidenceData || '-',
    ]);

    exportToCSV(`Audit_Log_Evidence_Toko_Almas_${new Date().toISOString().slice(0, 10)}`, [
      headers,
      ...rows,
    ]);
  };

  const getActionBadgeColor = (type: ActivityLog['actionType']) => {
    switch (type) {
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'LOGOUT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'TRANSACTION_CREATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'STOCK_OPNAME_SAVE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PRODUCT_CREATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PRODUCT_UPDATE':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'PRODUCT_DELETE':
      case 'DATABASE_RESET':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'CASH_FLOW_CREATE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Log Evidence Kegiatan &amp; Audit Trail
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-orange-100 text-orange-800 border border-orange-200">
                Khusus Administrator
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Merekam seluruh jejak aktivitas pengguna: riwayat login kasir/owner/admin gudang, pembuatan
            transaksi, audit stok opname, pengeditan katalog, dan penghapusan data secara forensik.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Bukti Audit (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari deskripsi, nama pengguna, atau ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800 font-semibold"
          >
            <option value="all">Semua Jenis Aksi</option>
            <option value="LOGIN">Sesi Login / Logout</option>
            <option value="TRANSACTION">Transaksi Kasir POS</option>
            <option value="STOCK_OPNAME">Audit Stok Opname</option>
            <option value="STOCK_ADJUST">Penyesuaian / Hapus Stok</option>
            <option value="PRODUCT">Katalog Produk (Tambah/Ubah/Hapus)</option>
            <option value="CASH_FLOW">Arus Kas Masuk / Keluar</option>
            <option value="RESET">Reset Database</option>
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800 font-semibold"
          >
            <option value="all">Semua Role Pengguna</option>
            <option value="administrator">1. Administrator</option>
            <option value="cashier">2. Kasir</option>
            <option value="warehouse_admin">3. Admin Gudang</option>
            <option value="owner">4. Owner</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Total <strong>{filteredLogs.length}</strong> log evidence tercatat
        </span>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-3">Petugas / Operator</th>
                <th className="py-3 px-3">Role Hak Akses</th>
                <th className="py-3 px-3">Kategori Aksi</th>
                <th className="py-3 px-4">Deskripsi Kegiatan</th>
                <th className="py-3 px-3 text-center">Evidence Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Activity className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Belum Ada Catatan Log</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Setiap aktivitas kasir, stok opname, atau login akan otomatis terekam di sini.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                          {log.userName.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{log.userName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono uppercase font-bold">
                        {log.userRole}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeColor(
                          log.actionType
                        )}`}
                      >
                        {log.actionType}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {log.description}
                      {log.targetId && (
                        <span className="block text-[10px] font-mono text-slate-400">
                          Ref: {log.targetId}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {log.evidenceData ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-orange-600 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Payload</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Payload Evidence */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Evidence Payload Data: {selectedLog.actionType}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p>
                  <strong>Petugas:</strong> {selectedLog.userName} ({selectedLog.userRole})
                </p>
                <p>
                  <strong>Waktu:</strong> {formatDate(selectedLog.timestamp)}
                </p>
                <p>
                  <strong>Deskripsi:</strong> {selectedLog.description}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  Raw JSON Evidence Snapshot:
                </span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60">
                  {selectedLog.evidenceData
                    ? JSON.stringify(JSON.parse(selectedLog.evidenceData), null, 2)
                    : 'Tidak ada payload tambahan'}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
