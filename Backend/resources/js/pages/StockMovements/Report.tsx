import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    CheckCircle,
    Clock,
    Download,
    Equal,
    Eye,
    Grid3X3,
    List,
    Package2,
    PieChart as PieIcon,
    Search,
    TrendingDown,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { PageProps, Product } from '@/types';

// ⬇️ Imports requis pour le dashboard inline
import { motion } from 'framer-motion';
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/* ------------------------------------------------------------------ */
/* Types & props                                                      */
/* ------------------------------------------------------------------ */
interface ReportProduct extends Product {
    total_in: number;
    total_out: number;
    total_adjustments: number;
    category?: { id: number; name: string };
}

interface GlobalStats {
    total_products: number;
    total_stock: number;
    low_stock_count: number;
    out_of_stock_count: number;
    total_in: number;
    total_out: number;
    total_adjustments: number;
}

/* Types pour le dashboard */
interface KPIsStock {
    total_in: { value: number };
    total_out: { value: number };
    net_change: { value: number };
    total_stock: { value: number };
    total_products: { value: number };
    low_stock_count: { value: number };
    out_of_stock_count: { value: number };
}
interface MovementsPoint {
    date: string;
    label: string;
    in: number;
    out: number;
    adjustments?: number;
    net?: number;
}
interface TopMoving {
    id: string | number | null;
    name: string;
    sku?: string | null;
    in: number;
    out: number;
    net: number;
    category?: { name: string } | null;
}
interface RecentMovement {
    id: string | number;
    type: 'in' | 'out' | 'adjustment';
    product_name: string;
    sku?: string | null;
    quantity: number;
    reason?: string | null;
    created_at?: string | null;
}
interface CategoryBalance {
    name: string;
    stock: number;
}

interface Props
    extends PageProps<{
        products: ReportProduct[];
        globalStats: GlobalStats;
        // props pour Dashboard
        period: string;
        kpis: KPIsStock;
        movementsChart: MovementsPoint[];
        topMoving: TopMoving[];
        recentMovements: RecentMovement[];
        categoryBalances: CategoryBalance[];
    }> {}

/* ------------------------------------------------------------------ */
/* Dashboard inline                                                   */
/* ------------------------------------------------------------------ */
const COLOR_SCALE = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

function fmtInt(n?: number) {
    return typeof n === 'number' ? new Intl.NumberFormat('fr-FR').format(n) : '-';
}

function StockMovementsDashboardInline({
    period,
    movementsChart,
    topMoving,
    recentMovements,
    categoryBalances,
}: {
    period: string;
    movementsChart: MovementsPoint[];
    topMoving: TopMoving[];
    recentMovements: RecentMovement[];
    categoryBalances: CategoryBalance[];
}) {
    const [selectedPeriod, setSelectedPeriod] = useState<string>(period || '30');

    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
        router.get(route('stock-movements.report', { period: newPeriod }), {}, { preserveScroll: true, preserveState: true });
    };

    return (
        <div className="space-y-6">
            {/* Header avec sélecteur de période */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
                            <div className="rounded-md bg-gradient-to-br from-blue-600 to-blue-500 p-2">
                                <BarChart3 className="h-7 w-7 text-white" />
                            </div>
                            Analyse des mouvements
                        </h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">Tendances et activité détaillée</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            <option value="7">7 derniers jours</option>
                            <option value="30">30 derniers jours</option>
                            <option value="90">90 derniers jours</option>
                            <option value="365">1 an</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Graphique + Top produits */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Mouvements par jour</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Entrées, sorties, ajustements & net</p>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {Array.isArray(movementsChart) && movementsChart.length ? (
                                <ComposedChart data={movementsChart}>
                                    <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
                                    <XAxis dataKey="label" stroke="#64748b" className="dark:stroke-slate-400" fontSize={12} />
                                    <YAxis yAxisId="left" stroke="#64748b" className="dark:stroke-slate-400" fontSize={12} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" className="dark:stroke-slate-400" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: 8 }} />
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="in"
                                        stroke="#10B981"
                                        fill="#10B981"
                                        fillOpacity={0.15}
                                        name="Entrées"
                                    />
                                    <Bar yAxisId="left" dataKey="out" fill="#EF4444" name="Sorties" />
                                    <Bar yAxisId="left" dataKey="adjustments" fill="#F59E0B" name="Ajustements" />
                                    <Line yAxisId="right" type="monotone" dataKey="net" stroke="#3B82F6" name="Net" />
                                    <Legend />
                                </ComposedChart>
                            ) : (
                                <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
                                    Aucune série temporelle disponible
                                </div>
                            )}
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Produits les plus mouvants</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Top {Math.min(5, Math.max(1, topMoving?.length || 0))}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {topMoving?.length ? (
                            topMoving.slice(0, 5).map((p, index) => (
                                <div key={p.id ?? index} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {p.sku ?? '—'} • Net {p.net >= 0 ? '+' : ''}
                                                {fmtInt(p.net)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs">
                                        <div className="text-green-600">+{fmtInt(p.in)} in</div>
                                        <div className="text-red-600">-{fmtInt(p.out)} out</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-slate-500 dark:text-slate-400">Aucun mouvement sur cette période</div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Ligne du bas : Répartition catégories + Activité récente */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Répartition par catégorie</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Stock courant</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                            <PieIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        </div>
                    </div>
                    {categoryBalances?.length ? (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryBalances}
                                        dataKey="stock"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={110}
                                        label={({ name, percent }) => {
                                            const pct = typeof percent === 'number' ? (percent * 100).toFixed(0) : '0';
                                            return `${name} ${pct}%`;
                                        }}
                                    >
                                        {categoryBalances.map((_, i) => (
                                            <Cell key={i} fill={COLOR_SCALE[i % COLOR_SCALE.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => [fmtInt(v), 'Stock']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-500 dark:text-slate-400">Aucune donnée catégorie</div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md lg:col-span-2 dark:border-slate-700 dark:bg-white/5"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Activité récente</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Derniers mouvements saisis</p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        {recentMovements?.length ? (
                            recentMovements.slice(0, 10).map((m) => {
                                const color = m.type === 'in' ? 'text-green-600' : m.type === 'out' ? 'text-red-600' : 'text-amber-600';
                                const sign = m.type === 'in' ? '+' : m.type === 'out' ? '-' : '';
                                return (
                                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                                                {m.type === 'in' ? (
                                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                                ) : m.type === 'out' ? (
                                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                                ) : (
                                                    <Equal className="h-4 w-4 text-amber-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {m.product_name}
                                                    {m.sku ? ` • ${m.sku}` : ''}
                                                </p>
                                                <p className="text-xs text-slate-500 capitalize dark:text-slate-400">
                                                    {m.type}
                                                    {m.reason ? ` • ${m.reason}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-semibold ${color}`}>
                                            {sign}
                                            {fmtInt(m.quantity)}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-slate-500 dark:text-slate-400">Aucune activité récente</div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Page Report                                                        */
/* ------------------------------------------------------------------ */
export default function StockReport({
    products,
    globalStats,
    period,
    kpis: _kpis,
    movementsChart,
    topMoving,
    recentMovements,
    categoryBalances,
}: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'good'>('all');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [sortBy, setSortBy] = useState<'name' | 'stock' | 'in' | 'out'>('name');
    // ⬇️ NOUVEAU : filtre par type de mouvement (incluant ajustements)
    const [movementFilter, setMovementFilter] = useState<'all' | 'in' | 'out' | 'adjustments'>('all');

    const getStockStatus = (quantity: number) => {
        if (quantity === 0) return { status: 'out', color: 'text-red-500', bgColor: 'bg-red-500', icon: XCircle };
        if (quantity < 10) return { status: 'low', color: 'text-yellow-500', bgColor: 'bg-yellow-500', icon: AlertTriangle };
        return { status: 'good', color: 'text-green-500', bgColor: 'bg-green-500', icon: CheckCircle };
    };

    const formatNumber = (num: number) => new Intl.NumberFormat('fr-FR').format(num);

    const categories = useMemo(() => {
        const cats = products.map((p) => p.category?.name).filter(Boolean) as string[];
        return [...new Set(cats)];
    }, [products]);

    // ⬇️ Bouton "Réinitialiser" : remet tous les filtres à zéro
    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('all');
        setStockFilter('all');
        setViewMode('table');
        setSortBy('name');
        setMovementFilter('all');
    };

    const resetToBaseFilters = () => {
        setStockFilter('all');
        setMovementFilter('all');
        setSortBy('name');
    };

    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter((p) => p.category?.name === selectedCategory);
        }

        if (stockFilter !== 'all') {
            filtered = filtered.filter((p) => getStockStatus(p.stock_quantity).status === stockFilter);
        }

        // ⬇️ Application du filtre de mouvement
        if (movementFilter === 'in') {
            filtered = filtered.filter((p) => (p.total_in ?? 0) > 0);
        } else if (movementFilter === 'out') {
            filtered = filtered.filter((p) => (p.total_out ?? 0) > 0);
        } else if (movementFilter === 'adjustments') {
            filtered = filtered.filter((p) => (p.total_adjustments ?? 0) !== 0);
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'stock':
                    return b.stock_quantity - a.stock_quantity;
                case 'in':
                    return b.total_in - a.total_in;
                case 'out':
                    return b.total_out - a.total_out;
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return filtered;
    }, [products, searchTerm, selectedCategory, stockFilter, sortBy, movementFilter]);

    return (
        <>
            <Head title="Rapport des mouvements de stock" />

            <div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Mouvements', href: '/stock-movements' },
                        { title: 'Rapport', href: route('stock-movements.report') },
                    ]}
                >
                    <div className="space-y-6 p-6">
                        {/* -------- En-tête avec actions -------- */}
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500">
                                        <BarChart3 className="h-6 w-6 text-white" />
                                    </div>
                                    Rapport des mouvements de stock
                                </h1>
                                <p className="mt-2 text-slate-600 dark:text-slate-400">Vue d'ensemble complète des mouvements et niveaux de stock</p>
                            </div>
                            <div className="flex gap-3">
                                <Link href={route('stock-movements.index')}>
                                    <Button variant="outline" size="sm" className="bg-white/50 backdrop-blur-sm dark:bg-white/5">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Retour
                                    </Button>
                                </Link>
                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg hover:from-blue-500 hover:to-blue-600"
                                    onClick={() => (window.location.href = route('stock-movements.export'))}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Exporter
                                </Button>
                            </div>
                        </div>

                        {/* -------- Métriques principales (MÊMES DIMENSIONS QUE DASHBOARD) -------- */}
                        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                            <MetricCard
                                title="Produits totaux"
                                value={globalStats.total_products}
                                icon={Package2}
                                color="from-blue-600 to-blue-500"
                                trend="+5%"
                                onClick={resetToBaseFilters}
                                isActive={stockFilter === 'all' && movementFilter === 'all'}
                            />
                            <MetricCard
                                title="Stock normal"
                                value={globalStats.total_products - globalStats.low_stock_count - globalStats.out_of_stock_count}
                                icon={CheckCircle}
                                color="from-green-600 to-green-500"
                                trend="+12%"
                                onClick={() => {
                                    if (stockFilter === 'good') resetToBaseFilters();
                                    else {
                                        setStockFilter('good');
                                        setMovementFilter('all');
                                    }
                                }}
                                isActive={stockFilter === 'good'}
                            />
                            <MetricCard
                                title="Stock faible"
                                value={globalStats.low_stock_count}
                                icon={AlertTriangle}
                                color="from-yellow-600 to-yellow-500"
                                trend="-3%"
                                onClick={() => {
                                    if (stockFilter === 'low') resetToBaseFilters();
                                    else {
                                        setStockFilter('low');
                                        setMovementFilter('all');
                                    }
                                }}
                                isActive={stockFilter === 'low'}
                            />
                            <MetricCard
                                title="Ruptures"
                                value={globalStats.out_of_stock_count}
                                icon={XCircle}
                                color="from-red-600 to-red-500"
                                trend="-8%"
                                onClick={() => {
                                    if (stockFilter === 'out') resetToBaseFilters();
                                    else {
                                        setStockFilter('out');
                                        setMovementFilter('all');
                                    }
                                }}
                                isActive={stockFilter === 'out'}
                            />
                            <MetricCard
                                title="Total Stock"
                                value={globalStats.total_stock}
                                icon={Activity}
                                color="from-slate-600 to-slate-500"
                                trend="+2%"
                            />
                        </div>

                        {/* -------- Métriques des mouvements (MÊMES DIMENSIONS QUE DASHBOARD) -------- */}
                        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            <InteractiveMovementCard
                                title="Entrées totales"
                                value={globalStats.total_in}
                                icon={TrendingUp}
                                color="text-green-600"
                                bgColor="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
                                description="Unités reçues"
                                prefix="+"
                                onClick={() => {
                                    if (movementFilter === 'in') resetToBaseFilters();
                                    else {
                                        setMovementFilter('in');
                                        setSortBy('in');
                                        setStockFilter('all');
                                    }
                                }}
                                isActive={movementFilter === 'in'}
                            />
                            <InteractiveMovementCard
                                title="Sorties totales"
                                value={globalStats.total_out}
                                icon={TrendingDown}
                                color="text-red-600"
                                bgColor="from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20"
                                description="Unités sorties"
                                prefix="-"
                                onClick={() => {
                                    if (movementFilter === 'out') resetToBaseFilters();
                                    else {
                                        setMovementFilter('out');
                                        setSortBy('out');
                                        setStockFilter('all');
                                    }
                                }}
                                isActive={movementFilter === 'out'}
                            />
                            <InteractiveMovementCard
                                title="Ajustements"
                                value={globalStats.total_adjustments}
                                icon={Equal}
                                color="text-blue-600"
                                bgColor="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
                                description="Corrections appliquées"
                                prefix={globalStats.total_adjustments >= 0 ? '+' : ''}
                                onClick={() => {
                                    if (movementFilter === 'adjustments') resetToBaseFilters();
                                    else {
                                        setMovementFilter('adjustments');
                                        setSortBy('name');
                                        setStockFilter('all');
                                    }
                                }}
                                isActive={movementFilter === 'adjustments'}
                            />
                            <InteractiveMovementCard
                                title="Mouvement Net"
                                value={globalStats.total_in - globalStats.total_out + globalStats.total_adjustments}
                                icon={Activity}
                                color="text-slate-600"
                                bgColor="from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20"
                                description="Variation totale"
                                prefix={globalStats.total_in - globalStats.total_out + globalStats.total_adjustments >= 0 ? '+' : ''}
                            />
                        </div>

                        {/* -------- Dashboard embarqué -------- */}
                        <div className="rounded-xl border-slate-200 bg-white/60 p-4 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <StockMovementsDashboardInline
                                period={period}
                                movementsChart={movementsChart}
                                topMoving={topMoving}
                                recentMovements={recentMovements}
                                categoryBalances={categoryBalances}
                            />
                        </div>

                        {/* -------- Filtres et contrôles -------- */}
                        <Card className="border-slate-200 bg-white/60 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <CardContent className="p-6">
                                <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
                                    <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                                        <div className="relative max-w-sm flex-1">
                                            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-slate-400" />
                                            <Input
                                                placeholder="Rechercher un produit..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="border-slate-200 bg-white/50 pl-10 dark:border-slate-700 dark:bg-white/5"
                                            />
                                        </div>

                                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                            <SelectTrigger className="w-48 border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-white/5">
                                                <SelectValue placeholder="Toutes catégories" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Toutes catégories</SelectItem>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {cat}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                            <SelectTrigger className="w-48 border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-white/5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="name">Nom A-Z</SelectItem>
                                                <SelectItem value="stock">Stock (élevé)</SelectItem>
                                                <SelectItem value="in">Entrées (élevé)</SelectItem>
                                                <SelectItem value="out">Sorties (élevé)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Bouton de réinitialisation */}
                                        <Button variant="outline" size="sm" onClick={handleResetFilters} className="bg-white/50 dark:bg-white/5">
                                            Réinitialiser
                                        </Button>
                                        <Button
                                            variant={viewMode === 'table' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setViewMode('table')}
                                            className={viewMode === 'table' ? 'bg-gradient-to-r from-blue-600 to-blue-500' : ''}
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={viewMode === 'cards' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setViewMode('cards')}
                                            className={viewMode === 'cards' ? 'bg-gradient-to-r from-blue-600 to-blue-500' : ''}
                                        >
                                            <Grid3X3 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* -------- Affichage des données -------- */}
                        {viewMode === 'table' ? (
                            <Card className="border-slate-200 bg-white/60 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50/80 backdrop-blur-sm dark:bg-slate-800/50">
                                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                                <th className="p-4 text-left font-semibold text-slate-700 dark:text-slate-300">Produit</th>
                                                <th className="p-4 text-left font-semibold text-slate-700 dark:text-slate-300">Catégorie</th>
                                                <th className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">Stock</th>
                                                <th className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">Entrées</th>
                                                <th className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">Sorties</th>
                                                <th className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">Ajustements</th>
                                                <th className="p-4 text-center font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredProducts.map((product) => {
                                                const stockStatus = getStockStatus(product.stock_quantity);
                                                const StatusIcon = stockStatus.icon;

                                                return (
                                                    <tr
                                                        key={product.id}
                                                        className="border-b border-slate-200/50 transition-all duration-200 hover:bg-slate-50/50 dark:border-slate-700/50 dark:hover:bg-white/5"
                                                    >
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 shadow-sm dark:from-slate-800 dark:to-slate-700">
                                                                    <Package2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-slate-900 dark:text-white">{product.name}</div>
                                                                    {product.sku && (
                                                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                            {product.sku}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            {product.category?.name ? (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="bg-blue-100 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                                >
                                                                    {product.category.name}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-slate-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <StatusIcon className={`h-4 w-4 ${stockStatus.color}`} />
                                                                <span className="font-bold text-slate-900 dark:text-white">
                                                                    {formatNumber(product.stock_quantity)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="font-semibold text-green-600">+{formatNumber(product.total_in)}</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="font-semibold text-red-600">-{formatNumber(product.total_out)}</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span
                                                                className={`font-semibold ${product.total_adjustments >= 0 ? 'text-blue-600' : 'text-orange-600'}`}
                                                            >
                                                                {product.total_adjustments > 0 ? '+' : ''}
                                                                {formatNumber(product.total_adjustments)}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <Link href={`/products/${product.id}`}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                                >
                                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {filteredProducts.map((product) => {
                                    const stockStatus = getStockStatus(product.stock_quantity);
                                    const StatusIcon = stockStatus.icon;

                                    return (
                                        <Card
                                            key={product.id}
                                            className="border-slate-200 bg-white/60 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:border-slate-700 dark:bg-white/5"
                                        >
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-sm dark:from-slate-800 dark:to-slate-700">
                                                            <Package2 className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-base leading-tight text-slate-900 dark:text-white">
                                                                {product.name}
                                                            </CardTitle>
                                                            {product.sku && (
                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{product.sku}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {product.category?.name && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                        >
                                                            {product.category.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center justify-between rounded-lg bg-slate-50/50 p-3 dark:bg-slate-800/30">
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Stock actuel</span>
                                                    <div className="flex items-center gap-2">
                                                        <StatusIcon className={`h-4 w-4 ${stockStatus.color}`} />
                                                        <span className="font-bold text-slate-900 dark:text-white">
                                                            {formatNumber(product.stock_quantity)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="rounded-lg bg-green-50/50 p-3 text-center dark:bg-green-900/20">
                                                        <div className="text-lg font-bold text-green-600">+{formatNumber(product.total_in)}</div>
                                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Entrées</div>
                                                    </div>
                                                    <div className="rounded-lg bg-red-50/50 p-3 text-center dark:bg-red-900/20">
                                                        <div className="text-lg font-bold text-red-600">-{formatNumber(product.total_out)}</div>
                                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sorties</div>
                                                    </div>
                                                    <div className="rounded-lg bg-blue-50/50 p-3 text-center dark:bg-blue-900/20">
                                                        <div
                                                            className={`text-lg font-bold ${product.total_adjustments >= 0 ? 'text-blue-600' : 'text-orange-600'}`}
                                                        >
                                                            {product.total_adjustments > 0 ? '+' : ''}
                                                            {formatNumber(product.total_adjustments)}
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ajust.</div>
                                                    </div>
                                                </div>

                                                <Link href={`/products/${product.id}`}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-4 w-full hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Voir détails
                                                    </Button>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {filteredProducts.length === 0 && (
                            <Card className="border-slate-200 bg-white/60 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <CardContent className="py-16 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                        <Package2 className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
                                        {stockFilter === 'low'
                                            ? 'Aucun produit en stock faible'
                                            : stockFilter === 'out'
                                              ? 'Aucune rupture de stock'
                                              : stockFilter === 'good'
                                                ? 'Aucun produit avec stock normal'
                                                : movementFilter === 'in'
                                                  ? 'Aucun produit avec des entrées'
                                                  : movementFilter === 'out'
                                                    ? 'Aucun produit avec des sorties'
                                                    : movementFilter === 'adjustments'
                                                      ? 'Aucun produit avec ajustements'
                                                      : 'Aucun produit trouvé'}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400">
                                        {stockFilter !== 'all' || movementFilter !== 'all'
                                            ? 'Cliquez sur "Réinitialiser" pour voir tous les produits.'
                                            : 'Essayez de modifier vos critères de recherche ou de filtrage.'}
                                    </p>
                                    {(stockFilter !== 'all' || movementFilter !== 'all') && (
                                        <Button variant="outline" className="mt-4" onClick={handleResetFilters}>
                                            Réinitialiser
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </AppLayout>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* UI helpers                                                         */
/* ------------------------------------------------------------------ */
interface MetricCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    trend?: string;
    onClick?: () => void;
    isActive?: boolean;
}

const MetricCard = ({ title, value, icon: Icon, color, trend, onClick, isActive }: MetricCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0 }}
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white shadow-xl ${color} transform cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
            isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''
        }`}
        onClick={onClick}
    >
        <p className="mb-1 text-xs font-medium text-white/80">{title}</p>
        <div className="flex items-center justify-between gap-3">
            <p className="text-xl font-bold">{new Intl.NumberFormat('fr-FR').format(value)}</p>
            <div className="shrink-0">
                <div className="rounded-lg bg-white/20 p-2">
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </div>
        </div>

        {trend && (
            <div className="mt-2 flex items-center gap-2">
                <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-xs text-white">
                    <TrendingUp className="h-3 w-3" />
                    {trend} vs mois dernier
                </div>
            </div>
        )}

        {isActive && <p className="mt-1 text-xs font-medium text-white/90">Filtre actif</p>}

        <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full bg-white/10" />
    </motion.div>
);

interface InteractiveMovementCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    description: string;
    prefix?: string;
    onClick?: () => void;
    isActive?: boolean;
}

const InteractiveMovementCard = ({
    title,
    value,
    icon: Icon,
    color: _color,
    bgColor,
    description,
    prefix = '',
    onClick,
    isActive,
}: InteractiveMovementCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white shadow-xl ${bgColor.includes('slate') ? 'from-slate-600 to-slate-500' : bgColor.includes('green') ? 'from-green-600 to-green-500' : bgColor.includes('red') ? 'from-red-600 to-red-500' : 'from-blue-600 to-blue-500'} transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
            onClick ? 'cursor-pointer' : ''
        } ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}`}
        onClick={onClick}
    >
        <p className="mb-1 flex items-center gap-2 text-xs font-medium text-white/80">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20">
                <Icon className="h-3 w-3 text-white" />
            </div>
            {title}
        </p>

        <div className="mb-1 text-xl font-bold text-white">
            {prefix}
            {new Intl.NumberFormat('fr-FR').format(value)}
        </div>

        <p className="text-xs text-white/70">{description}</p>

        {isActive && <p className="mt-2 text-xs font-medium text-white/90">Tri actif</p>}

        <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-white/10" />
    </motion.div>
);
