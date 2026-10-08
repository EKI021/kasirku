import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Wallet,
  Coins,
  Package,
  Calendar,
  Building,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  Target,
  Sparkles,
  Sliders,
  CheckCircle2,
  X,
  AlertCircle,
  Clock,
  Flame,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../utils/currency';
import { exportToCSV } from '../../utils/exportUtils';
import { exportFinancialReportPDF } from '../../utils/pdfExportUtils';

export const FinancialAnalyticsView: React.FC = () => {
  const {
    transactions,
    products,
    cashFlows,
    currentUser,
    monthlySalesTarget,
    setMonthlySalesTarget,
  } = useStore();
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Daily revenue trend (Recharts) state
  const [trendDaysRange, setTrendDaysRange] = useState<30 | 14 | 7>(30);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [showProfitLine, setShowProfitLine] = useState<boolean>(true);

  // Monthly target edit modal state
  const [isTargetModalOpen, setIsTargetModalOpen] = useState<boolean>(false);
  const [targetInput, setTargetInput] = useState<number>(monthlySalesTarget || 30000000);
  const [isSavingTarget, setIsSavingTarget] = useState<boolean>(false);
  const [targetSaveSuccess, setTargetSaveSuccess] = useState<boolean>(false);

  // Filter transactions based on date
  const filteredTransactions = useMemo(() => {
    if (timeFilter === 'all') return transactions;
    const now = Date.now();
    const oneDay = 86400000;
    return transactions.filter((tx) => {
      const txTime = new Date(tx.createdAt).getTime();
      if (timeFilter === 'today') return now - txTime <= oneDay;
      if (timeFilter === 'week') return now - txTime <= oneDay * 7;
      if (timeFilter === 'month') return now - txTime <= oneDay * 30;
      return true;
    });
  }, [transactions, timeFilter]);

  // Monthly Sales Target Data Calculation
  const currentMonthData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    const remainingDays = Math.max(1, daysInMonth - currentDay);

    // Filter transactions in this current calendar month
    const monthTransactions = transactions.filter((tx) => {
      const d = new Date(tx.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const monthRevenue = monthTransactions.reduce((sum, tx) => sum + tx.total, 0);
    const target = monthlySalesTarget > 0 ? monthlySalesTarget : 30000000;
    const percent = target > 0 ? (monthRevenue / target) * 100 : 0;
    const progressPercent = Math.min(100, Math.round(percent));
    const exactPercent = percent.toFixed(1);
    const remainingAmount = Math.max(0, target - monthRevenue);
    const dailyNeeded = remainingAmount > 0 ? Math.round(remainingAmount / remainingDays) : 0;
    const currentDailyAverage = currentDay > 0 ? Math.round(monthRevenue / currentDay) : 0;
    const projectedRevenue = Math.round(currentDailyAverage * daysInMonth);
    const expectedPacingPercent = Math.round((currentDay / daysInMonth) * 100);
    const isOnTrack = percent >= expectedPacingPercent;

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const currentMonthName = `${monthNames[currentMonth]} ${currentYear}`;

    return {
      monthRevenue,
      target,
      progressPercent,
      exactPercent,
      remainingAmount,
      remainingDays,
      currentDay,
      daysInMonth,
      dailyNeeded,
      currentDailyAverage,
      projectedRevenue,
      expectedPacingPercent,
      isOnTrack,
      currentMonthName,
      txCount: monthTransactions.length,
    };
  }, [transactions, monthlySalesTarget]);

  // Recharts: Tren Omzet Harian 30 Hari Terakhir (atau 14/7 hari)
  const dailyTrendData = useMemo(() => {
    const now = new Date();
    const days: {
      dateKey: string;
      label: string;
      fullDate: string;
      omzet: number;
      profit: number;
      txCount: number;
    }[] = [];

    for (let i = trendDaysRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const fullDate = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      days.push({
        dateKey,
        label: dayLabel,
        fullDate,
        omzet: 0,
        profit: 0,
        txCount: 0,
      });
    }

    transactions.forEach((tx) => {
      if (!tx.createdAt) return;
      const txDate = tx.createdAt.slice(0, 10);
      const matched = days.find((d) => d.dateKey === txDate);
      if (matched) {
        matched.omzet += tx.total;
        matched.txCount += 1;
        const txCost =
          tx.items?.reduce((sum, item) => sum + (item.costPrice || 0) * item.quantity, 0) || 0;
        matched.profit += Math.max(0, tx.total - txCost);
      }
    });

    return days;
  }, [transactions, trendDaysRange]);

  const trendStats = useMemo(() => {
    const totalOmzet = dailyTrendData.reduce((sum, d) => sum + d.omzet, 0);
    const totalProfit = dailyTrendData.reduce((sum, d) => sum + d.profit, 0);
    const totalTx = dailyTrendData.reduce((sum, d) => sum + d.txCount, 0);
    const avgOmzet = Math.round(totalOmzet / trendDaysRange);
    const peakDay = [...dailyTrendData].sort((a, b) => b.omzet - a.omzet)[0];

    return {
      totalOmzet,
      totalProfit,
      totalTx,
      avgOmzet,
      peakDay,
    };
  }, [dailyTrendData, trendDaysRange]);

  const formatYAxis = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}jt`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
    return String(val);
  };

  const canEditTarget =
    currentUser?.role === 'owner' || currentUser?.role === 'administrator';

  const handleSaveTarget = async () => {
    if (targetInput <= 0) {
      alert('Target penjualan bulanan harus lebih besar dari Rp 0.');
      return;
    }
    setIsSavingTarget(true);
    try {
      await setMonthlySalesTarget(Number(targetInput));
      setTargetSaveSuccess(true);
      setTimeout(() => {
        setTargetSaveSuccess(false);
        setIsTargetModalOpen(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan target penjualan.');
    } finally {
      setIsSavingTarget(false);
    }
  };

  // Financial Calculations
  const totalRevenue = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
  }, [filteredTransactions]);

  const totalCOGS = useMemo(() => {
    // Total HPP (Harga Pokok Penjualan)
    return filteredTransactions.reduce((sum, tx) => {
      const txHPP = tx.items.reduce((iSum, item) => iSum + (item.costPrice || 0) * item.quantity, 0);
      return sum + txHPP;
    }, 0);
  }, [filteredTransactions]);

  const grossProfit = totalRevenue - totalCOGS;
  const profitMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

  // Inventory Asset Valuation (Nilai modal barang di toko saat ini)
  const totalInventoryAssetValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  }, [products]);

  const totalInventoryPotentialRevenue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock * p.price, 0);
  }, [products]);

  // Cash Flow Calculations
  const totalOperationalExpense = useMemo(() => {
    return cashFlows
      .filter((cf) => cf.type === 'expense')
      .reduce((sum, cf) => sum + cf.amount, 0);
  }, [cashFlows]);

  const netStoreCashBalance = totalRevenue - totalOperationalExpense;

  // Breakdown by Payment Method
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let qris = 0;
    let transfer = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.paymentMethod === 'cash') cash += tx.total;
      else if (tx.paymentMethod === 'qris') qris += tx.total;
      else transfer += tx.total;
    });

    const total = cash + qris + transfer || 1;
    return {
      cash: { amount: cash, percent: Math.round((cash / total) * 100) },
      qris: { amount: qris, percent: Math.round((qris / total) * 100) },
      transfer: { amount: transfer, percent: Math.round((transfer / total) * 100) },
    };
  }, [filteredTransactions]);

  // Top Selling Items and Top Margin Items
  const productPerformance = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {};

    filteredTransactions.forEach((tx) => {
      tx.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.name, quantity: 0, revenue: 0, profit: 0 };
        }
        const profitPerItem = item.price - (item.costPrice || 0);
        map[item.productId].quantity += item.quantity;
        map[item.productId].revenue += item.subtotal;
        map[item.productId].profit += profitPerItem * item.quantity;
      });
    });

    const list = Object.values(map);
    const topByQuantity = [...list].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    const topByProfit = [...list].sort((a, b) => b.profit - a.profit).slice(0, 5);

    return { topByQuantity, topByProfit };
  }, [filteredTransactions]);

  // Export Financial Summary to CSV
  const handleExportFinanceCSV = () => {
    const rows: (string | number)[][] = [
      ['LAPORAN KEUANGAN DAN LABA RUGI KASIRKU'],
      ['Periode', timeFilter.toUpperCase()],
      ['Tanggal Cetak', new Date().toLocaleString('id-ID')],
      [],
      ['RINGKASAN UTAMA', 'NOMINAL (RP)'],
      ['Total Omzet Penjualan (Gross Revenue)', totalRevenue],
      ['Total HPP / Modal Barang Terjual (COGS)', totalCOGS],
      ['Laba Kotor Penjualan (Gross Profit)', grossProfit],
      ['Margin Keuntungan Kotor', `${profitMarginPercent}%`],
      ['Total Biaya Operasional Toko', totalOperationalExpense],
      ['Laba Bersih Toko (Net Profit)', netStoreCashBalance],
      [],
      ['NILAI INVENTARIS TOKO'],
      ['Total Nilai Aset Stok (Modal HPP)', totalInventoryAssetValue],
      ['Potensi Omzet Stok (Harga Jual)', totalInventoryPotentialRevenue],
      [],
      ['METODE PEMBAYARAN', 'TOTAL OMZET', 'PERSENTASE'],
      ['Tunai (Cash)', paymentBreakdown.cash.amount, `${paymentBreakdown.cash.percent}%`],
      ['QRIS', paymentBreakdown.qris.amount, `${paymentBreakdown.qris.percent}%`],
      ['Transfer Bank', paymentBreakdown.transfer.amount, `${paymentBreakdown.transfer.percent}%`],
    ];

    exportToCSV(`Laporan_Keuangan_Toko_Almas_${new Date().toISOString().slice(0, 10)}`, rows);
  };

  const handleExportFinancePDF = () => {
    const filterLabel =
      timeFilter === 'all'
        ? 'Semua Waktu'
        : timeFilter === 'today'
        ? 'Hari Ini'
        : timeFilter === 'week'
        ? '7 Hari Terakhir'
        : '30 Hari Terakhir';

    exportFinancialReportPDF({
      timeFilterLabel: filterLabel,
      totalRevenue,
      totalCOGS,
      grossProfit,
      profitMarginPercent,
      totalOperationalExpense,
      netStoreCashBalance,
      totalInventoryAssetValue,
      totalInventoryPotentialRevenue,
      paymentBreakdown,
      cashFlows,
      topProducts: productPerformance.topByQuantity.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        revenue: p.revenue,
        profit: p.profit,
      })),
      printedBy: currentUser?.name || 'Pemilik Toko',
      printedByRole: currentUser?.role === 'owner' ? 'Owner (Pemilik Toko)' : currentUser?.role === 'administrator' ? 'Administrator' : currentUser?.role || 'Staff Toko',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Analisis Keuangan &amp; Laba Rugi
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau arus kas masuk harian, laba kotor dari POS, perputaran modal HPP, dan estimasi
            aset barang KasirKu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Pills */}
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            {(['all', 'today', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeFilter(period)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  timeFilter === period
                    ? 'bg-white text-orange-600 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {period === 'all'
                  ? 'Semua'
                  : period === 'today'
                  ? 'Hari Ini'
                  : period === 'week'
                  ? '7 Hari'
                  : '30 Hari'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportFinancePDF}
            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shadow-orange-500/25"
            title="Unduh Laporan Keuangan format PDF resmi untuk arsip pemilik toko"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Unduh Laporan PDF</span>
          </button>

          <button
            onClick={handleExportFinanceCSV}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* MONTHLY SALES TARGET TRACKER (TARGET OMZET BULANAN) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Top section: Title, Badge, and Configure Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Target Penjualan Bulanan
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-slate-300 border border-white/10">
                    {currentMonthData.currentMonthName}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monitoring pencapaian omzet kasir &amp; pacing harian KasirKu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEditTarget && (
                <button
                  onClick={() => {
                    setTargetInput(monthlySalesTarget || 30000000);
                    setIsTargetModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-2xs backdrop-blur-xs"
                  title="Atur nominal target penjualan bulanan"
                >
                  <Sliders className="w-3.5 h-3.5 text-orange-400" />
                  <span>Atur Target</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Visual Progress and Numbers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-1">
            {/* Left: Progress Summary Numbers */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-400 block">
                    Omzet Tercapai Bulan Ini
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {formatRupiah(currentMonthData.monthRevenue)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-400 block">
                    Target Omzet
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-300 font-mono">
                    {formatRupiah(currentMonthData.target)}
                  </span>
                </div>
              </div>

              {/* Status pill & description */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    currentMonthData.progressPercent >= 100
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : currentMonthData.isOnTrack
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {currentMonthData.progressPercent >= 100 ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Target Tercapai ({currentMonthData.exactPercent}%) 🎉</span>
                    </>
                  ) : currentMonthData.isOnTrack ? (
                    <>
                      <Flame className="w-3.5 h-3.5" />
                      <span>On Track ({currentMonthData.exactPercent}%) 🚀</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Perlu Digenjot ({currentMonthData.exactPercent}%) ⚠️</span>
                    </>
                  )}
                </span>

                <span className="text-xs text-slate-400">
                  {currentMonthData.txCount} transaksi kasir tercatat
                </span>
              </div>
            </div>

            {/* Right: Large Visual Progress Bar & Milestones */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <span>Progres Pencapaian:</span>
                  <strong className="text-white font-mono text-sm">
                    {currentMonthData.exactPercent}%
                  </strong>
                </span>
                <span className="text-slate-400 text-[11px]">
                  Hari ke-{currentMonthData.currentDay} dari {currentMonthData.daysInMonth} hari ({currentMonthData.expectedPacingPercent}% waktu berjalan)
                </span>
              </div>

              {/* Progress bar container */}
              <div className="h-4 w-full bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/80 shadow-inner relative">
                <div
                  className={`h-full rounded-full transition-all duration-700 shadow-sm ${
                    currentMonthData.progressPercent >= 100
                      ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300'
                      : currentMonthData.progressPercent >= 75
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                      : currentMonthData.progressPercent >= 40
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      : 'bg-gradient-to-r from-amber-500 to-orange-400'
                  }`}
                  style={{ width: `${Math.max(3, currentMonthData.progressPercent)}%` }}
                />
              </div>

              {/* Progress Bar Milestones Guide */}
              <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                <span>Rp 0 (0%)</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span className="text-slate-300 font-bold">100% Target</span>
              </div>
            </div>
          </div>

          {/* 4 Informative Sub-Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
            {/* Sisa Target */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block font-medium">Sisa Target</span>
              <p className="text-sm font-bold text-white font-mono mt-0.5">
                {currentMonthData.remainingAmount > 0
                  ? formatRupiah(currentMonthData.remainingAmount)
                  : 'Rp 0 (Terpenuhi!)'}
              </p>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {currentMonthData.remainingAmount > 0
                  ? `Sisa ${currentMonthData.remainingDays} hari ke depan`
                  : 'Target telah terlampaui'}
              </span>
            </div>

            {/* Target Harian Dibutuhkan */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block font-medium">
                Kebutuhan Harian
              </span>
              <p className="text-sm font-bold text-orange-400 font-mono mt-0.5">
                {currentMonthData.remainingAmount > 0
                  ? `${formatRupiah(currentMonthData.dailyNeeded)}/hari`
                  : 'Rp 0 / hari'}
              </p>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Untuk capai target bulan ini
              </span>
            </div>

            {/* Rata-rata Realisasi Harian */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block font-medium">
                Realisasi Rata-rata
              </span>
              <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                {formatRupiah(currentMonthData.currentDailyAverage)}/hari
              </p>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Omzet rata-rata hari berjalan
              </span>
            </div>

            {/* Proyeksi Akhir Bulan */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block font-medium">
                Proyeksi Akhir Bulan
              </span>
              <p className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
                {formatRupiah(currentMonthData.projectedRevenue)}
              </p>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Berdasarkan tren penjualan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Omzet */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Omzet
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-orange-50 text-orange-600">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 mt-1.5 sm:mt-2 truncate">
            {formatRupiah(totalRevenue)}
          </p>
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{filteredTransactions.length} transaksi kasir</span>
          </div>
        </div>

        {/* Laba Kotor */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Laba Kotor
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-2xl font-black text-emerald-600 mt-1.5 sm:mt-2 truncate">
            {formatRupiah(grossProfit)}
          </p>
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1">
            <span className="truncate">Margin: </span>
            <strong className="text-emerald-700">{profitMarginPercent}%</strong>
          </div>
        </div>

        {/* Modal HPP Terjual */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              HPP Modal (COGS)
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-800 mt-1.5 sm:mt-2 truncate">
            {formatRupiah(totalCOGS)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            Biaya modal kulakan
          </p>
        </div>

        {/* Total Nilai Aset Stok */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nilai Aset Stok
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-amber-600">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 mt-1.5 sm:mt-2 truncate">
            {formatRupiah(totalInventoryAssetValue)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
            Potensi rak: <strong className="text-slate-700">{formatRupiah(totalInventoryPotentialRevenue)}</strong>
          </p>
        </div>
      </div>

      {/* Payment Method Distribution & Cash Flow Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Channels */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-500" />
              <span>Metode Pembayaran Kasir</span>
            </h3>
            <span className="text-[11px] text-slate-400">Total Transaksi</span>
          </div>

          <div className="space-y-3">
            {/* Cash */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tunai (Cash)</span>
                </span>
                <span className="text-slate-900 font-bold">
                  {formatRupiah(paymentBreakdown.cash.amount)} ({paymentBreakdown.cash.percent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${paymentBreakdown.cash.percent}%` }}
                ></div>
              </div>
            </div>

            {/* QRIS */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <QrCode className="w-3.5 h-3.5 text-orange-600" />
                  <span>QRIS Instan</span>
                </span>
                <span className="text-slate-900 font-bold">
                  {formatRupiah(paymentBreakdown.qris.amount)} ({paymentBreakdown.qris.percent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${paymentBreakdown.qris.percent}%` }}
                ></div>
              </div>
            </div>

            {/* Bank Transfer */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Transfer Bank</span>
                </span>
                <span className="text-slate-900 font-bold">
                  {formatRupiah(paymentBreakdown.transfer.amount)} (
                  {paymentBreakdown.transfer.percent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${paymentBreakdown.transfer.percent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Produk Terlaris (Volume)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Qty Terjual</span>
          </div>

          <div className="space-y-2">
            {productPerformance.topByQuantity.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Belum ada transaksi pada periode ini
              </p>
            ) : (
              productPerformance.topByQuantity.map((prod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-150 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-white text-slate-700 font-bold flex items-center justify-center text-[10px] shadow-2xs">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">{prod.name}</span>
                  </div>
                  <span className="font-bold text-orange-600 shrink-0">
                    {prod.quantity} unit
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Profitable Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Paling Menguntungkan</span>
            </h3>
            <span className="text-[11px] text-slate-400">Margin Laba</span>
          </div>

          <div className="space-y-2">
            {productPerformance.topByProfit.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Belum ada data laba produk
              </p>
            ) : (
              productPerformance.topByProfit.map((prod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-150 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-white text-emerald-700 font-bold flex items-center justify-center text-[10px] shadow-2xs">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">{prod.name}</span>
                  </div>
                  <span className="font-bold text-emerald-600 shrink-0">
                    +{formatRupiah(prod.profit)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Visual Revenue Trend Chart (Recharts) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Tren Omzet Harian (Grafik Garis Recharts)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisasi pergerakan omzet harian selama satu bulan terakhir ({trendDaysRange} hari)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Type Selector: Garis (Line) / Area */}
            <div className="flex p-0.5 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartType === 'line'
                    ? 'bg-white text-orange-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📈 Garis (Line)</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartType === 'area'
                    ? 'bg-white text-orange-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📊 Area</span>
              </button>
            </div>

            {/* Range Selector */}
            <div className="flex p-0.5 bg-slate-100 rounded-xl text-xs font-semibold">
              {([30, 14, 7] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTrendDaysRange(days)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    trendDaysRange === days
                      ? 'bg-white text-orange-600 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {days} Hari
                </button>
              ))}
            </div>

            {/* Toggle Laba Kotor */}
            <button
              type="button"
              onClick={() => setShowProfitLine(!showProfitLine)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                showProfitLine
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  showProfitLine ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>Laba Kotor</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-500 font-medium block">Total Omzet ({trendDaysRange} Hari)</span>
            <p className="text-sm sm:text-base font-black text-slate-900 font-mono mt-0.5">
              {formatRupiah(trendStats.totalOmzet)}
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5">{trendStats.totalTx} total nota</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-500 font-medium block">Rata-rata Omzet / Hari</span>
            <p className="text-sm sm:text-base font-black text-orange-600 font-mono mt-0.5">
              {formatRupiah(trendStats.avgOmzet)}
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5">Performa harian</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-500 font-medium block">Puncak Tertinggi (Peak)</span>
            <p className="text-sm sm:text-base font-black text-emerald-600 font-mono mt-0.5">
              {formatRupiah(trendStats.peakDay?.omzet || 0)}
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {trendStats.peakDay?.label || '-'}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-500 font-medium block">Total Laba Kotor</span>
            <p className="text-sm sm:text-base font-black text-teal-600 font-mono mt-0.5">
              {formatRupiah(trendStats.totalProfit)}
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Margin {trendStats.totalOmzet > 0 ? Math.round((trendStats.totalProfit / trendStats.totalOmzet) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Recharts Chart Container (Grafik Garis & Area) */}
        <div className="w-full h-72 sm:h-80 md:h-88 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={dailyTrendData} margin={{ top: 10, right: 12, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                  minTickGap={12}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-md">
                          <p className="font-bold text-slate-300 mb-1.5">{data.fullDate}</p>
                          <div className="space-y-1">
                            <p className="text-orange-400 font-bold flex items-center justify-between gap-4">
                              <span>Omzet Penjualan:</span>
                              <span className="font-mono text-white text-sm">{formatRupiah(data.omzet)}</span>
                            </p>
                            {showProfitLine && (
                              <p className="text-emerald-400 font-medium flex items-center justify-between gap-4">
                                <span>Laba Kotor:</span>
                                <span className="font-mono text-emerald-300">{formatRupiah(data.profit)}</span>
                              </p>
                            )}
                            <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800 flex items-center justify-between">
                              <span>Jumlah Transaksi:</span>
                              <span className="font-semibold text-slate-200">{data.txCount} nota</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={trendStats.avgOmzet}
                  stroke="#f97316"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{
                    value: `Rata-rata: ${formatYAxis(trendStats.avgOmzet)}`,
                    fill: '#ea580c',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="omzet"
                  stroke="#f97316"
                  strokeWidth={3}
                  name="Omzet"
                  dot={{ r: 3.5, fill: '#f97316', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6.5, fill: '#ea580c', stroke: '#ffffff', strokeWidth: 2 }}
                />
                {showProfitLine && (
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    strokeDasharray="4 3"
                    name="Laba Kotor"
                    dot={{ r: 3, fill: '#10b981', stroke: '#ffffff', strokeWidth: 1.5 }}
                    activeDot={{ r: 5.5, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            ) : (
              <AreaChart data={dailyTrendData} margin={{ top: 10, right: 12, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="omzetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                  minTickGap={12}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-md">
                          <p className="font-bold text-slate-300 mb-1.5">{data.fullDate}</p>
                          <div className="space-y-1">
                            <p className="text-orange-400 font-bold flex items-center justify-between gap-4">
                              <span>Omzet Penjualan:</span>
                              <span className="font-mono text-white text-sm">{formatRupiah(data.omzet)}</span>
                            </p>
                            {showProfitLine && (
                              <p className="text-emerald-400 font-medium flex items-center justify-between gap-4">
                                <span>Laba Kotor:</span>
                                <span className="font-mono text-emerald-300">{formatRupiah(data.profit)}</span>
                              </p>
                            )}
                            <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800 flex items-center justify-between">
                              <span>Jumlah Transaksi:</span>
                              <span className="font-semibold text-slate-200">{data.txCount} nota</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={trendStats.avgOmzet}
                  stroke="#f97316"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{
                    value: `Rata-rata: ${formatYAxis(trendStats.avgOmzet)}`,
                    fill: '#ea580c',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="omzet"
                  stroke="#f97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#omzetGradient)"
                  name="Omzet"
                  activeDot={{ r: 6, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
                />
                {showProfitLine && (
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#profitGradient)"
                    name="Laba Kotor"
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
              <span className="font-medium text-slate-700">Omzet Harian</span>
            </div>
            {showProfitLine && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="font-medium text-slate-700">Laba Kotor</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-orange-400"></span>
              <span className="text-slate-400 text-[11px]">Garis Rata-rata</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            Sumber: {transactions.length} total transaksi penjualan tercatat
          </span>
        </div>
      </div>

      {/* MODAL SETTING TARGET PENJUALAN BULANAN */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-5 flex items-start gap-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
                <Target className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold">
                  Pengaturan Target Penjualan Bulanan
                </h3>
                <p className="text-xs text-orange-100 mt-0.5">
                  Tentukan target omzet KasirKu untuk periode {currentMonthData.currentMonthName}.
                </p>
              </div>
              <button
                onClick={() => setIsTargetModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {targetSaveSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Target Berhasil Disimpan!</h4>
                  <p className="text-xs text-slate-500">
                    Target omzet bulanan KasirKu telah diperbarui ke {formatRupiah(targetInput)}.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nominal Target Omzet Penjualan (Rupiah)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="1000000"
                        step="1000000"
                        value={targetInput}
                        onChange={(e) => setTargetInput(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                        placeholder="30000000"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">
                      Terbaca: <strong>{formatRupiah(targetInput)}</strong>
                    </p>
                  </div>

                  {/* Preset quick buttons */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                      Pilihan Cepat (Preset):
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[15000000, 25000000, 35000000, 50000000, 75000000, 100000000].map(
                        (presetVal) => (
                          <button
                            key={presetVal}
                            type="button"
                            onClick={() => setTargetInput(presetVal)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                              targetInput === presetVal
                                ? 'bg-orange-50 border-orange-500 text-orange-600 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {formatRupiah(presetVal).replace('Rp ', 'Rp')}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Information banner */}
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Target ini akan langsung digunakan pada indikator progres bar dan perhitungan kebutuhan omzet rata-rata harian toko.
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!targetSaveSuccess && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTargetModalOpen(false)}
                  disabled={isSavingTarget}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveTarget}
                  disabled={isSavingTarget}
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 rounded-xl transition-all shadow-sm shadow-orange-500/30 flex items-center gap-1.5"
                >
                  {isSavingTarget ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Simpan Target</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
