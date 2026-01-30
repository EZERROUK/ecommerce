import ParticlesBackground from '@/components/ParticlesBackground';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { route } from 'ziggy-js';

import {
    Activity,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart2,
    BarChart3,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Eye,
    Flame,
    GaugeCircle,
    Layers,
    MapPin,
    Package,
    Percent,
    PieChart as PieIcon,
    ShoppingCart,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

interface KPI {
    value?: number;
    formatted?: string;
    change?: number;
    total?: number;

    previous?: number;
    previous_yoy?: number;
    change_period?: number;
    change_yoy?: number;
    formatted_previous?: string;
    formatted_previous_yoy?: string;
}

interface KPIsCompat {
    revenue: KPI & { value?: number };
    orders: KPI & { value?: number };
    newClients: KPI & { value?: number };
    outOfStock: (KPI & { value?: number }) | number;
}

interface SalesChartItem {
    date: string;
    label: string;
    revenue: number;
    orders: number;
    quotes?: number;
}

interface TopProduct {
    id: string | number;
    name: string;
    sku: string;
    quantity: number;
    revenue?: number;
    formatted_revenue?: string;
}

interface StockItem {
    id: string | number;
    name: string;
    sku: string;
    stock_quantity?: number;
    low_stock_threshold?: number;
    category?: { name: string };
}

interface StockAlerts {
    lowStock: StockItem[];
    outOfStock: StockItem[];
}

interface RecentActivityItem {
    type?: 'order' | 'quote' | string;
    title: string;
    description?: string;
    amount: number;
    status?: string;
    created_at?: string;
}

interface CategoryDistributionItem {
    name: string;
    productCount?: number;
    totalStock?: number;
    stockValue?: number;
    formattedValue?: string;
}

interface QuoteConversionRate {
    rate: number;
    total: number;
    converted: number;
    breakdown?: Record<string, number>;
}

interface SalesMetrics {
    averageOrderValue?: { value: number; formatted: string };
    monthlyGrowth?: {
        current: number;
        previous: number;
        growth: number;
        formatted_current?: string;
        formatted_previous?: string;
    };
    salesChannels?: {
        quote_based: number;
        direct: number;
        total: number;
    };
    avgConversionTime?: number;
}

interface ClientMetrics {
    activeClients?: number;
    retentionRate?: number;
    topClients?: Array<{
        id: number;
        company_name: string;
        total_spent: number;
        orders_count: number;
    }>;
    clientsByCity?: Array<{ city: string; count: number }>;
}

interface InventoryMetrics {
    totalStockValue?: { value: number; formatted: string };
    stockTurnover?: number;
    topMovingProducts?: Array<{ id: string | number; name: string; total_sold: number }>;
    slowMovingProducts?: Array<{ id: string | number; name: string; stock_quantity: number }>;
    lowStockCount?: number;
}

interface FinancialMonthlyRevenueItem {
    month: string;
    label: string;
    revenue: number;
}

interface FinancialMetrics {
    grossMargin?: number;
    totalCost?: { value: number; formatted: string };
    overdueInvoices?: { count: number; amount: number; formatted: string };
    monthlyRevenue?: FinancialMonthlyRevenueItem[];
}

interface PerformanceMetrics {
    avgProcessingTime?: number;
    cancellationRate?: number;
    mostViewedProducts?: Array<{ name: string; sku: string; views: number }>;
    orderStatusEvolution?: Array<{ status: string; count: number }>;
}

interface TrendsData {
    dailyMetrics?: Array<{ date: string; label: string; revenue: number; orders: number; quotes?: number }>;
    categoryRevenue?: Array<{ name: string; revenue: number; formatted?: string }>;
}

interface HeatmapData {
    salesHeatmap?: Array<{ day_of_week: number; hour: number; orders_count: number; revenue: number }>;
    brandCategoryMatrix?: Array<{
        brand_name: string;
        category_name: string;
        revenue: number;
        quantity: number;
    }>;
}

interface Flash {
    success?: string;
    error?: string;
}

interface Props {
    kpis: KPIsCompat;
    salesChart: SalesChartItem[];
    topProducts: TopProduct[];
    stockAlerts: StockAlerts;
    recentActivity: RecentActivityItem[];
    categoryDistribution?: CategoryDistributionItem[];
    quoteConversionRate?: QuoteConversionRate;
    period: string;

    salesMetrics?: SalesMetrics;
    clientMetrics?: ClientMetrics;
    inventoryMetrics?: InventoryMetrics;
    financialMetrics?: FinancialMetrics;
    performanceMetrics?: PerformanceMetrics;
    trendsData?: TrendsData;
    heatmapData?: HeatmapData;
    flash?: Flash;
}

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

// Palette principale
const BRAND_DARK = '#1B1749';
const BRAND_RED = '#E92B26';

const COLOR_SCALE = [BRAND_RED, '#f97373', '#f97316', BRAND_DARK, '#6366f1'];

const SIMPLE_COLORS = [BRAND_DARK, BRAND_RED, '#0f766e', '#0369a1', '#475569'];

const fmtMAD = (n: number | undefined) =>
    typeof n === 'number' ? new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(n) : '-';

const pctBadge = (change?: number) => {
    if (typeof change !== 'number') return null;
    const up = change > 0;
    const flat = change === 0;
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${
                up
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : flat
                      ? 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600/50 dark:bg-slate-600/20 dark:text-slate-200'
                      : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200'
            }`}
        >
            {up ? <ArrowUpRight className="h-3 w-3" /> : flat ? null : <ArrowDownRight className="h-3 w-3" />}
            {(up ? '+' : '') + change.toFixed(1) + '%'}
        </span>
    );
};

const fadeInUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
};

/* ----------------------------- UI COMPONENTS ----------------------------- */

type TabId = 'overview' | 'sales' | 'inventory' | 'clients' | 'performance';

interface TabButtonProps {
    id: TabId;
    current: TabId;
    label: string;
    icon: React.ElementType;
    onClick: (id: TabId) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ id, current, label, icon: Icon, onClick }) => {
    const active = id === current;
    return (
        <button
            type="button"
            onClick={() => onClick(id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                active
                    ? 'border border-[#1B1749] bg-[#1B1749] text-white shadow-lg shadow-[#1B1749]/30'
                    : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
            }`}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
};

interface KpiCardProps {
    title: string;
    value: React.ReactNode;
    icon: React.ElementType;
    color?: string;
    subtitle?: React.ReactNode;
    footer?: React.ReactNode;
    trend?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, color = BRAND_RED, subtitle, footer, trend }) => (
    <motion.div
        {...fadeInUp}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/80"
    >
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="mb-1 text-[11px] tracking-wide text-slate-500 uppercase dark:text-slate-400">{title}</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{value}</p>
                {subtitle && <div className="mt-2 text-xs text-slate-500 dark:text-slate-300">{subtitle}</div>}
                {typeof trend === 'number' && <div className="mt-2">{pctBadge(trend)}</div>}
                {footer && <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{footer}</div>}
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}12` }}>
                <Icon className="h-4 w-4" style={{ color }} />
            </div>
        </div>
        <div className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-10" style={{ background: color }} />
    </motion.div>
);

/* -------------------------------------------------------------------------- */
/*                                MAIN COMPONENT                              */
/* -------------------------------------------------------------------------- */

export default function Dashboard(props: Props) {
    const {
        kpis,
        salesChart,
        topProducts,
        stockAlerts,
        recentActivity,
        categoryDistribution = [],
        quoteConversionRate,
        period,
        salesMetrics,
        clientMetrics,
        inventoryMetrics,
        financialMetrics,
        performanceMetrics,
        trendsData,
        flash,
    } = props;

    const {
        props: { auth },
    } = usePage<any>();

    const roles: string[] = auth?.roles ?? [];
    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');

    const [selectedPeriod, setSelectedPeriod] = useState<string>(period || '30');
    const [tab, setTab] = useState<TabId>('overview');
    const [showSuccess, setShowSuccess] = useState(!!flash?.success);
    const [showError, setShowError] = useState(!!flash?.error);

    const revenueFormatted = kpis.revenue.formatted ?? (typeof kpis.revenue.value === 'number' ? fmtMAD(kpis.revenue.value) : '-');

    const ordersValue = kpis.orders.value ?? 0;
    const newClientsValue = kpis.newClients.value ?? 0;
    const outOfStockValue = typeof kpis.outOfStock === 'number' ? kpis.outOfStock : (kpis.outOfStock?.value ?? 0);

    const outOfStockObj: any = kpis.outOfStock;
    const outOfStockFooter = typeof outOfStockObj === 'object' && outOfStockObj?.total ? `sur ${outOfStockObj.total} produits suivis` : undefined;

    const revenueChangePeriod = typeof kpis.revenue.change_period === 'number' ? kpis.revenue.change_period : kpis.revenue.change;
    const revenueChangeYoY = kpis.revenue.change_yoy;

    const dailyMetrics = trendsData?.dailyMetrics ?? salesChart;

    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
        const url = route('dashboard.index', { period: newPeriod });
        router.get(url, {}, { preserveScroll: true, preserveState: true });
    };

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const t = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);

    useEffect(() => {
        if (flash?.error) {
            setShowError(true);
            const t = setTimeout(() => setShowError(false), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.error]);

    const renderOrderStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'En attente';
            case 'confirmed':
                return 'Confirmée';
            case 'shipped':
                return 'Expédiée';
            case 'completed':
                return 'Terminée';
            case 'cancelled':
                return 'Annulée';
            default:
                return status;
        }
    };

    return (
        <>
            <Head title="Dashboard Analytics" />
            <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 w-full px-4 py-6">
                        {/* FLASH */}
                        {flash?.success && showSuccess && (
                            <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900 dark:text-emerald-100">
                                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                <span className="flex-1 font-medium">{flash.success}</span>
                                <button onClick={() => setShowSuccess(false)}>
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        {flash?.error && showError && (
                            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                <span className="flex-1 font-medium">{flash.error}</span>
                                <button onClick={() => setShowError(false)}>
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* HEADER */}
                        <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:from-[#050517] dark:via-[#0B0B1E] dark:to-[#111827]">
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div>
                                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E92B26]/30 bg-[#E92B26]/5 px-3 py-1 text-xs text-[#E92B26] dark:text-[#FCA5A1]">
                                        <BarChart3 className="h-3 w-3" />
                                        <span>Vue consolidée business & finances</span>
                                    </div>
                                    <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
                                        Dashboard Analytics
                                        {isSuperAdmin && (
                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                                                Super Admin
                                            </span>
                                        )}
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                        Vue synthétique sur ton chiffre d’affaires, tes clients, ton stock et tes performances opérationnelles.
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                        <select
                                            value={selectedPeriod}
                                            onChange={(e) => handlePeriodChange(e.target.value)}
                                            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:ring-2 focus:ring-[#E92B26]/70 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        >
                                            <option value="7">7 derniers jours</option>
                                            <option value="30">30 derniers jours</option>
                                            <option value="90">90 derniers jours</option>
                                            <option value="365">12 derniers mois</option>
                                        </select>
                                    </div>
                                    {quoteConversionRate && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                            <GaugeCircle className="h-4 w-4 text-[#E92B26]" />
                                            <span>
                                                Conversion devis:&nbsp;
                                                <span className="font-semibold text-[#E92B26] dark:text-[#fb7185]">{quoteConversionRate.rate}%</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* TABS */}
                            <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                                <TabButton id="overview" current={tab} label="Vue d'ensemble" icon={BarChart3} onClick={setTab} />
                                <TabButton id="sales" current={tab} label="Sales Analytics" icon={TrendingUp} onClick={setTab} />
                                <TabButton id="inventory" current={tab} label="Inventaire & Stock" icon={Package} onClick={setTab} />
                                <TabButton id="clients" current={tab} label="Clients & Retention" icon={Users} onClick={setTab} />
                                <TabButton id="performance" current={tab} label="Performance & Ops" icon={Activity} onClick={setTab} />
                            </div>
                        </div>

                        {/* TAB CONTENT */}
                        <AnimatePresence mode="wait">
                            {/* ------------------------- OVERVIEW ------------------------- */}
                            {tab === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    {/* KPIs ROW */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                        <KpiCard
                                            title="Chiffre d'affaires"
                                            value={revenueFormatted}
                                            icon={DollarSign}
                                            color={BRAND_RED}
                                            subtitle={
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">vs période précédente</span>
                                                        {pctBadge(revenueChangePeriod)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">vs même période N-1</span>
                                                        {pctBadge(revenueChangeYoY)}
                                                    </div>
                                                </div>
                                            }
                                        />
                                        <KpiCard
                                            title="Commandes"
                                            value={ordersValue}
                                            icon={ShoppingCart}
                                            color="#2563eb"
                                            trend={kpis.orders.change}
                                        />
                                        <KpiCard
                                            title="Nouveaux clients"
                                            value={newClientsValue}
                                            icon={Users}
                                            color="#16a34a"
                                            trend={kpis.newClients.change}
                                        />
                                        <KpiCard
                                            title="Produits en rupture"
                                            value={outOfStockValue}
                                            icon={AlertTriangle}
                                            color="#f97316"
                                            footer={outOfStockFooter}
                                        />
                                        <KpiCard
                                            title="Taux de conversion devis"
                                            value={quoteConversionRate ? `${quoteConversionRate.rate}%` : '--'}
                                            icon={TrendingUp}
                                            color="#7c3aed"
                                            subtitle={
                                                quoteConversionRate && (
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-300">
                                                        {quoteConversionRate.converted} / {quoteConversionRate.total} convertis
                                                    </span>
                                                )
                                            }
                                        />
                                    </div>

                                    {/* SALES CHART + SNAPSHOTS */}
                                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                                        <motion.div
                                            {...fadeInUp}
                                            transition={{ duration: 0.4 }}
                                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2 dark:border-slate-700 dark:bg-slate-900/80"
                                        >
                                            <div className="mb-4 flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                                                        Évolution ventes & devis
                                                    </h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Chiffre d'affaires, nombre de commandes & devis par jour
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                                    <Clock className="h-3 w-3" />
                                                    Période glissante · {selectedPeriod} j
                                                </div>
                                            </div>

                                            <div className="h-[280px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <ComposedChart data={dailyMetrics}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                                                        <XAxis dataKey="label" stroke="#475569" fontSize={11} />
                                                        <YAxis
                                                            yAxisId="left"
                                                            stroke="#475569"
                                                            fontSize={11}
                                                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                                        />
                                                        <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={11} />

                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: 'white',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: 10,
                                                                color: '#020617',
                                                            }}
                                                            labelStyle={{ color: '#0f172a' }}
                                                            formatter={(value: any, name: any) => {
                                                                if (name === 'Revenus') return [fmtMAD(value), name];
                                                                if (name === 'Commandes') return [value, name];
                                                                if (name === 'Devis') return [value, name];
                                                                return [value, name];
                                                            }}
                                                        />

                                                        <Area
                                                            yAxisId="left"
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            name="Revenus"
                                                            stroke={BRAND_RED}
                                                            fill={BRAND_RED}
                                                            fillOpacity={0.12}
                                                        />
                                                        <Bar
                                                            yAxisId="right"
                                                            dataKey="orders"
                                                            name="Commandes"
                                                            fill={BRAND_DARK}
                                                            radius={[4, 4, 0, 0]}
                                                        />
                                                        <Bar yAxisId="right" dataKey="quotes" name="Devis" fill="#f97316" radius={[4, 4, 0, 0]} />

                                                        <Legend />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            {...fadeInUp}
                                            transition={{ duration: 0.45 }}
                                            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
                                        >
                                            <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50">Résumé rapide Business</h3>

                                            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center justify-between">
                                                    <span>Panier moyen</span>
                                                    <span className="font-medium">{salesMetrics?.averageOrderValue?.formatted ?? '--'}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Growth courant vs mois-1</span>
                                                    <span className="flex items-center gap-2 font-medium">
                                                        {salesMetrics?.monthlyGrowth?.growth != null ? `${salesMetrics.monthlyGrowth.growth}%` : '--'}
                                                        {pctBadge(salesMetrics?.monthlyGrowth?.growth)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Temps moyen conversion devis</span>
                                                    <span className="font-medium">
                                                        {salesMetrics?.avgConversionTime != null ? `${salesMetrics.avgConversionTime} j` : '--'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Clients actifs (période)</span>
                                                    <span className="font-medium">{clientMetrics?.activeClients ?? '--'}</span>
                                                </div>
                                            </div>

                                            <div className="mt-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                                                <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">Mix des canaux de vente</p>
                                                <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-200">
                                                    <span>Via devis</span>
                                                    <span>
                                                        {salesMetrics?.salesChannels?.quote_based ?? 0} / {salesMetrics?.salesChannels?.total ?? 0}
                                                    </span>
                                                </div>
                                                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <div
                                                        className="h-2 bg-gradient-to-r from-[#1B1749] to-[#E92B26]"
                                                        style={{
                                                            width: salesMetrics?.salesChannels?.total
                                                                ? `${
                                                                      ((salesMetrics.salesChannels.quote_based ?? 0) /
                                                                          salesMetrics.salesChannels.total) *
                                                                      100
                                                                  }%`
                                                                : '0%',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* RECENT ACTIVITY + STOCK ALERTS + CATEGORIES */}
                                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                                        {/* Activité récente */}
                                        <motion.div
                                            {...fadeInUp}
                                            transition={{ duration: 0.45 }}
                                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Activité récente</h3>
                                                <div className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                                    {recentActivity?.length ?? 0} éléments
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {recentActivity?.length ? (
                                                    recentActivity.map((a, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B1749]/10">
                                                                    {a.type === 'quote' ? (
                                                                        <FileIcon className="h-4 w-4 text-[#1B1749]" />
                                                                    ) : (
                                                                        <ShoppingCart className="h-4 w-4 text-[#1B1749]" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{a.title}</p>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {a.description ?? a.type}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                                    {fmtMAD(a.amount)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Aucune activité récente sur la période sélectionnée.
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>

                                        {/* Alertes stock */}
                                        <motion.div
                                            {...fadeInUp}
                                            transition={{ duration: 0.5 }}
                                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Alertes stock</h3>
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            </div>

                                            {stockAlerts.lowStock?.length ? (
                                                <div className="mb-4">
                                                    <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">Stock faible</p>
                                                    <div className="space-y-2 text-xs">
                                                        {stockAlerts.lowStock.map((s) => (
                                                            <div
                                                                key={s.id}
                                                                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-500/40 dark:bg-amber-500/10"
                                                            >
                                                                <div>
                                                                    <p className="text-xs font-medium text-slate-900 dark:text-slate-50">{s.name}</p>
                                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                        {s.category?.name && `${s.category.name} • `}
                                                                        {s.sku}
                                                                    </p>
                                                                </div>
                                                                <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] text-amber-800 dark:bg-amber-500/20 dark:text-amber-100">
                                                                    {s.stock_quantity ?? 0}
                                                                    {s.low_stock_threshold ? ` / ${s.low_stock_threshold}` : ' en stock'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {stockAlerts.outOfStock?.length ? (
                                                <div>
                                                    <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">Ruptures</p>
                                                    <div className="space-y-2 text-xs">
                                                        {stockAlerts.outOfStock.map((s) => (
                                                            <div
                                                                key={s.id}
                                                                className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3 py-2 dark:border-red-500/40 dark:bg-red-500/10"
                                                            >
                                                                <div>
                                                                    <p className="text-xs font-medium text-slate-900 dark:text-slate-50">{s.name}</p>
                                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                        {s.category?.name && `${s.category.name} • `}
                                                                        {s.sku}
                                                                    </p>
                                                                </div>
                                                                <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] text-red-800 dark:bg-red-500/30 dark:text-red-50">
                                                                    Épuisé
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {!stockAlerts.lowStock?.length && !stockAlerts.outOfStock?.length && (
                                                <div className="mt-4 flex flex-col items-center text-center text-xs text-slate-500 dark:text-slate-400">
                                                    <CheckCircle className="mb-2 h-8 w-8 text-emerald-500" />
                                                    Aucun produit en alerte.
                                                </div>
                                            )}
                                        </motion.div>

                                        {/* Catégories */}
                                        <motion.div
                                            {...fadeInUp}
                                            transition={{ duration: 0.55 }}
                                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Répartition par catégorie</h3>
                                                <PieIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                            </div>

                                            {categoryDistribution?.length ? (
                                                <div className="space-y-2 text-xs">
                                                    {categoryDistribution.map((c, idx) => (
                                                        <div key={idx} className="flex items-center justify-between py-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="h-2.5 w-2.5 rounded-full"
                                                                    style={{
                                                                        backgroundColor: SIMPLE_COLORS[idx % SIMPLE_COLORS.length],
                                                                    }}
                                                                />
                                                                <span className="text-slate-800 dark:text-slate-100">{c.name}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                {typeof c.stockValue === 'number' ? (
                                                                    <>
                                                                        <p className="font-medium text-slate-900 dark:text-slate-50">
                                                                            {c.formattedValue ?? fmtMAD(c.stockValue)}
                                                                        </p>
                                                                        {typeof c.totalStock === 'number' && (
                                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                                {c.totalStock} en stock
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <p className="font-medium text-slate-900 dark:text-slate-50">
                                                                        {c.productCount ?? 0} articles
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Aucune catégorie avec produits actifs.</p>
                                            )}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ------------------------- SALES TAB ------------------------- */}
                            {tab === 'sales' && (
                                <motion.div
                                    key="sales"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    <h2 className="mb-1 text-xl font-bold text-slate-900 dark:text-slate-50">Sales Analytics</h2>
                                    <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                                        Focus sur les ventes, les canaux, les devis et le panier moyen.
                                    </p>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <KpiCard
                                            title="Panier moyen (AOV)"
                                            value={salesMetrics?.averageOrderValue?.formatted ?? '--'}
                                            icon={DollarSign}
                                            color="#16a34a"
                                        />
                                        <KpiCard
                                            title="Growth mensuel"
                                            value={salesMetrics?.monthlyGrowth?.growth != null ? `${salesMetrics.monthlyGrowth.growth}%` : '--'}
                                            icon={TrendingUp}
                                            color="#2563eb"
                                            trend={salesMetrics?.monthlyGrowth?.growth}
                                            footer={
                                                salesMetrics?.monthlyGrowth && (
                                                    <span>
                                                        {salesMetrics.monthlyGrowth.formatted_current} vs{' '}
                                                        {salesMetrics.monthlyGrowth.formatted_previous}
                                                    </span>
                                                )
                                            }
                                        />
                                        <KpiCard
                                            title="Ventes via devis"
                                            value={salesMetrics?.salesChannels?.quote_based ?? 0}
                                            icon={FileIcon}
                                            color="#f97316"
                                            footer={salesMetrics?.salesChannels && <span>sur {salesMetrics.salesChannels.total ?? 0} commandes</span>}
                                        />
                                        <KpiCard
                                            title="Temps conv. devis → commande"
                                            value={salesMetrics?.avgConversionTime != null ? `${salesMetrics.avgConversionTime} jours` : '--'}
                                            icon={Clock}
                                            color="#7c3aed"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                                        {/* Sales chart (re-use monthlyRevenue) */}
                                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                            <div className="mb-4 flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                        Revenus mensuels (12 mois)
                                                    </h3>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                                        Vue macro de la dynamique commerciale.
                                                    </p>
                                                </div>
                                                <Percent className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                            </div>
                                            <div className="h-[260px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={financialMetrics?.monthlyRevenue ?? []}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                                                        <XAxis dataKey="label" stroke="#475569" fontSize={11} />
                                                        <YAxis stroke="#475569" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: 'white',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: 10,
                                                                color: '#020617',
                                                            }}
                                                            formatter={(v: any) => [fmtMAD(v), 'Revenus']}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            stroke={BRAND_DARK}
                                                            fill={BRAND_DARK}
                                                            fillOpacity={0.15}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Top products + conversion */}
                                        <div className="space-y-6">
                                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Top produits facturés</h3>
                                                    <Package className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                                </div>
                                                {topProducts?.length ? (
                                                    <div className="space-y-2 text-xs">
                                                        {topProducts.slice(0, 5).map((p, i) => (
                                                            <div
                                                                key={p.id}
                                                                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1B1749]/10 text-[11px] font-semibold text-[#1B1749] dark:bg-[#1B1749]/30 dark:text-slate-50">
                                                                        #{i + 1}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-slate-900 dark:text-slate-50">{p.name}</p>
                                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                            {p.sku} • {p.quantity} vendus
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                                                                        {p.formatted_revenue ?? (p.revenue ? fmtMAD(p.revenue) : '-')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Aucun produit facturé sur cette période.
                                                    </p>
                                                )}
                                            </div>

                                            {quoteConversionRate && (
                                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                            Conversion des devis
                                                        </h3>
                                                        <GaugeCircle className="h-4 w-4 text-[#E92B26]" />
                                                    </div>
                                                    <div className="mt-2 flex items-end gap-4">
                                                        <div className="flex-1">
                                                            <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Taux global</p>
                                                            <p className="text-3xl font-bold text-[#E92B26] dark:text-[#fb7185]">
                                                                {quoteConversionRate.rate}%
                                                            </p>
                                                            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                                {quoteConversionRate.converted} convertis sur {quoteConversionRate.total} devis
                                                            </p>
                                                        </div>
                                                        <div className="h-32 w-32">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={[
                                                                            {
                                                                                name: 'Convertis',
                                                                                value: quoteConversionRate.converted,
                                                                            },
                                                                            {
                                                                                name: 'Non convertis',
                                                                                value: quoteConversionRate.total - quoteConversionRate.converted,
                                                                            },
                                                                        ]}
                                                                        dataKey="value"
                                                                        innerRadius={40}
                                                                        outerRadius={55}
                                                                        paddingAngle={4}
                                                                    >
                                                                        <Cell fill={BRAND_RED} />
                                                                        <Cell fill="#e5e7eb" />
                                                                    </Pie>
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <div
                                                            className="h-1.5 bg-gradient-to-r from-[#E92B26] to-[#1B1749]"
                                                            style={{ width: `${quoteConversionRate.rate}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ----------------------- INVENTORY TAB ----------------------- */}
                            {tab === 'inventory' && (
                                <motion.div
                                    key="inventory"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    <h2 className="mb-1 text-xl font-bold text-slate-900 dark:text-slate-50">Inventaire & stock</h2>
                                    <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                                        Vision sur la valeur stock, la rotation et les produits sensibles.
                                    </p>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <KpiCard
                                            title="Valeur totale stock"
                                            value={inventoryMetrics?.totalStockValue?.formatted ?? '--'}
                                            icon={Layers}
                                            color="#2563eb"
                                        />
                                        <KpiCard
                                            title="Stock turnover"
                                            value={inventoryMetrics?.stockTurnover != null ? inventoryMetrics.stockTurnover : '--'}
                                            icon={Flame}
                                            color="#f97316"
                                            footer="Nb fois où le stock est renouvelé"
                                        />
                                        <KpiCard
                                            title="Produits stock faible"
                                            value={inventoryMetrics?.lowStockCount ?? 0}
                                            icon={AlertTriangle}
                                            color="#facc15"
                                        />
                                        <KpiCard title="Produits en rupture" value={outOfStockValue} icon={AlertTriangle} color={BRAND_RED} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                                        {/* Pie valeur stock par catégorie si dispo */}
                                        {categoryDistribution.some((c) => typeof c.stockValue === 'number') && (
                                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                        Valeur du stock par catégorie
                                                    </h3>
                                                    <PieIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                                </div>
                                                <div className="h-[260px]">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={categoryDistribution.filter((c) => typeof c.stockValue === 'number')}
                                                                dataKey="stockValue"
                                                                nameKey="name"
                                                                cx="50%"
                                                                cy="50%"
                                                                outerRadius={90}
                                                                label={({ name, percent }) =>
                                                                    `${name} ${(((percent ?? 0) as number) * 100).toFixed(0)}%`
                                                                }
                                                            >
                                                                {categoryDistribution.map((_, i) => (
                                                                    <Cell key={i} fill={COLOR_SCALE[i % COLOR_SCALE.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: 'white',
                                                                    border: '1px solid #e2e8f0',
                                                                    borderRadius: 10,
                                                                    color: '#020617',
                                                                }}
                                                                formatter={(v: any) => [fmtMAD(v), 'Valeur stock']}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        )}

                                        {/* Top / slow moving */}
                                        <div className="space-y-6">
                                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                        Top produits qui sortent le plus
                                                    </h3>
                                                    <Flame className="h-4 w-4 text-amber-500" />
                                                </div>
                                                {inventoryMetrics?.topMovingProducts?.length ? (
                                                    <div className="space-y-2 text-xs">
                                                        {inventoryMetrics.topMovingProducts.map((p) => (
                                                            <div
                                                                key={p.id}
                                                                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                                                            >
                                                                <span className="text-slate-900 dark:text-slate-50">{p.name}</span>
                                                                <span className="text-slate-600 dark:text-slate-300">{p.total_sold} vendus</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Pas encore de data de vente sur les 90 derniers jours.
                                                    </p>
                                                )}
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                        Produits lents à sortir
                                                    </h3>
                                                    <Clock className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                                </div>
                                                {inventoryMetrics?.slowMovingProducts?.length ? (
                                                    <div className="space-y-2 text-xs">
                                                        {inventoryMetrics.slowMovingProducts.map((p) => (
                                                            <div
                                                                key={p.id}
                                                                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                                                            >
                                                                <span className="text-slate-900 dark:text-slate-50">{p.name}</span>
                                                                <span className="text-slate-600 dark:text-slate-300">
                                                                    {p.stock_quantity} en stock
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Aucun produit identifié comme « dormant » sur la période.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ------------------------ CLIENTS TAB ------------------------ */}
                            {tab === 'clients' && (
                                <motion.div
                                    key="clients"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    <h2 className="mb-1 text-xl font-bold text-slate-900 dark:text-slate-50">Clients & retention</h2>
                                    <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                                        Qui achète, d’où viennent tes clients et quel est le niveau de fidélisation.
                                    </p>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                        <KpiCard title="Clients actifs" value={clientMetrics?.activeClients ?? 0} icon={Users} color="#2563eb" />
                                        <KpiCard
                                            title="Taux de rétention"
                                            value={clientMetrics?.retentionRate != null ? `${clientMetrics.retentionRate}%` : '--'}
                                            icon={GaugeCircle}
                                            color="#16a34a"
                                        />
                                        <KpiCard
                                            title="Revenus (12 mois)"
                                            value={
                                                financialMetrics?.monthlyRevenue
                                                    ? fmtMAD(financialMetrics.monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0))
                                                    : '--'
                                            }
                                            icon={DollarSign}
                                            color={BRAND_RED}
                                        />
                                        <KpiCard
                                            title="Devis sur la période"
                                            value={quoteConversionRate?.total ?? 0}
                                            icon={FileIcon}
                                            color="#f97316"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                                        {/* Top clients */}
                                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Top clients par CA</h3>
                                                <BarChart2 className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                            </div>
                                            {clientMetrics?.topClients?.length ? (
                                                <div className="space-y-2 text-xs">
                                                    {clientMetrics.topClients.map((c) => (
                                                        <div
                                                            key={c.id}
                                                            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                                                        >
                                                            <div>
                                                                <p className="text-slate-900 dark:text-slate-50">{c.company_name}</p>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                    {c.orders_count} commande(s)
                                                                </p>
                                                            </div>
                                                            <p className="font-semibold text-slate-900 dark:text-slate-50">{fmtMAD(c.total_spent)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Pas encore de clients avec commandes sur cette période.
                                                </p>
                                            )}
                                        </div>

                                        {/* Clients par ville */}
                                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Répartition par ville</h3>
                                                <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                            </div>
                                            <div className="h-[260px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={clientMetrics?.clientsByCity ?? []}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                                                        <XAxis dataKey="city" stroke="#475569" fontSize={11} />
                                                        <YAxis stroke="#475569" fontSize={11} />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: 'white',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: 10,
                                                                color: '#020617',
                                                            }}
                                                            formatter={(v: any) => [v, 'Clients']}
                                                        />
                                                        <Bar dataKey="count" fill={BRAND_DARK} radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* --------------------- PERFORMANCE TAB ---------------------- */}
                            {tab === 'performance' && (
                                <motion.div
                                    key="performance"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    <h2 className="mb-1 text-xl font-bold text-slate-900 dark:text-slate-50">Performance & opérations</h2>
                                    <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                                        Qualité d’exécution, délais et répartition des statuts.
                                    </p>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                        <KpiCard
                                            title="Temps moyen de traitement"
                                            value={performanceMetrics?.avgProcessingTime != null ? `${performanceMetrics.avgProcessingTime} h` : '--'}
                                            icon={Clock}
                                            color="#2563eb"
                                        />
                                        <KpiCard
                                            title="Taux d'annulation"
                                            value={performanceMetrics?.cancellationRate != null ? `${performanceMetrics.cancellationRate}%` : '--'}
                                            icon={AlertTriangle}
                                            color={BRAND_RED}
                                        />
                                        <KpiCard
                                            title="Marge brute (période)"
                                            value={financialMetrics?.grossMargin != null ? `${financialMetrics.grossMargin}%` : '--'}
                                            icon={Percent}
                                            color="#16a34a"
                                        />
                                        <KpiCard
                                            title="Factures échues non payées"
                                            value={financialMetrics?.overdueInvoices?.count ?? 0}
                                            icon={AlertTriangle}
                                            color="#f97373"
                                            footer={
                                                financialMetrics?.overdueInvoices?.formatted
                                                    ? `Montant: ${financialMetrics.overdueInvoices.formatted}`
                                                    : undefined
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                                        {/* Order Status Evolution */}
                                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                    Statuts des commandes (période)
                                                </h3>
                                                <BarChart3 className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                            </div>
                                            <div className="h-[260px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={performanceMetrics?.orderStatusEvolution ?? []}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                                                        <XAxis
                                                            dataKey="status"
                                                            stroke="#475569"
                                                            fontSize={11}
                                                            tickFormatter={renderOrderStatusLabel}
                                                        />
                                                        <YAxis stroke="#475569" fontSize={11} />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: 'white',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: 10,
                                                                color: '#020617',
                                                            }}
                                                            formatter={(v: any) => [v, 'Commandes']}
                                                            labelFormatter={renderOrderStatusLabel}
                                                        />
                                                        <Bar dataKey="count" fill={BRAND_RED} radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Produits les plus consultés */}
                                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                    Produits les plus consultés en devis
                                                </h3>
                                                <Eye className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                            </div>
                                            {performanceMetrics?.mostViewedProducts?.length ? (
                                                <div className="space-y-2 text-xs">
                                                    {performanceMetrics.mostViewedProducts.map((p, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                                                        >
                                                            <div>
                                                                <p className="text-slate-900 dark:text-slate-50">{p.name}</p>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{p.sku}</p>
                                                            </div>
                                                            <span className="text-slate-600 dark:text-slate-300">{p.views} vues</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Pas encore de statistiques de consultation disponibles.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}

/* Petit alias icône pour éviter un import manquant */
function FileIcon(props: React.SVGProps<SVGSVGElement>) {
    return <DocumentIcon {...props} />;
}

/* Document icon simple (fallback) */
function DocumentIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="2" width="9" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13 6H15.5C16.3284 6 17 6.67157 17 7.5V15C17 16.1046 16.1046 17 15 17H13" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}
