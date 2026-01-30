<?php

namespace App\Http\Controllers;

use App\Models\{Product, Client, Quote, Order, Invoice, StockMovement, Category};
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $period = $request->input('period', '30');
        $startDate = Carbon::now()->subDays((int) $period);

        return Inertia::render('dashboard', [
            'kpis' => $this->getMainKPIs($startDate),
            'salesChart' => $this->getSalesChartData($startDate),
            'topProducts' => $this->getTopProducts($startDate),
            'stockAlerts' => $this->getStockAlerts(),
            'recentActivity' => $this->getRecentActivity(),
            'categoryDistribution' => $this->getCategoryDistribution(),
            'quoteConversionRate' => $this->getQuoteConversionRate($startDate),
            'salesMetrics' => $this->getSalesMetrics($startDate),
            'clientMetrics' => $this->getClientMetrics($startDate),
            'inventoryMetrics' => $this->getInventoryMetrics(),
            'financialMetrics' => $this->getFinancialMetrics($startDate),
            'performanceMetrics' => $this->getPerformanceMetrics($startDate),
            'trendsData' => $this->getTrendsData($startDate),
            'heatmapData' => $this->getHeatmapData($startDate),
            'period' => $period,
        ]);
    }

    /* MAIN KPIS -------------------------------------------------------------- */

    private function getMainKPIs(Carbon $startDate): array
    {
        $now = Carbon::now();
        $periodDays = $startDate->diffInDays($now);

        $revenue = Invoice::where('status', 'paid')
            ->whereBetween('date', [$startDate, $now])
            ->sum('total_ttc');

        $previousStart = $startDate->copy()->subDays($periodDays);
        $previousEnd   = $startDate->copy();

        $previousRevenue = Invoice::where('status', 'paid')
            ->whereBetween('date', [$previousStart, $previousEnd])
            ->sum('total_ttc');

        $prevStartYoY = $startDate->copy()->subYear();
        $prevEndYoY   = $now->copy()->subYear();

        $previousRevenueYoY = Invoice::where('status', 'paid')
            ->whereBetween('date', [$prevStartYoY, $prevEndYoY])
            ->sum('total_ttc');

        $ordersCount = Order::whereBetween('created_at', [$startDate, $now])->count();
        $previousOrdersCount = Order::whereBetween('created_at', [$previousStart, $previousEnd])->count();

        $newClients = Client::whereBetween('created_at', [$startDate, $now])->count();
        $previousNewClients = Client::whereBetween('created_at', [$previousStart, $previousEnd])->count();

        $outOfStock = Product::where('track_inventory', true)
            ->where('stock_quantity', 0)
            ->count();

        return [
            'revenue' => [
                'value' => $revenue,
                'previous' => $previousRevenue,
                'previous_yoy' => $previousRevenueYoY,
                'change_period' => $previousRevenue > 0 ? (($revenue - $previousRevenue) / $previousRevenue) * 100 : 0,
                'change_yoy' => $previousRevenueYoY > 0 ? (($revenue - $previousRevenueYoY) / $previousRevenueYoY) * 100 : 0,
                'formatted' => number_format($revenue, 2, ',', ' ') . ' MAD',
                'formatted_previous' => number_format($previousRevenue, 2, ',', ' ') . ' MAD',
                'formatted_previous_yoy' => number_format($previousRevenueYoY, 2, ',', ' ') . ' MAD',
            ],
            'orders' => [
                'value' => $ordersCount,
                'previous' => $previousOrdersCount,
                'change' => $previousOrdersCount > 0 ? (($ordersCount - $previousOrdersCount) / $previousOrdersCount) * 100 : 0,
            ],
            'newClients' => [
                'value' => $newClients,
                'previous' => $previousNewClients,
                'change' => $previousNewClients > 0 ? (($newClients - $previousNewClients) / $previousNewClients) * 100 : 0,
            ],
            'outOfStock' => [
                'value' => $outOfStock,
                'total' => Product::where('track_inventory', true)->count(),
            ],
        ];
    }

    /* SALES METRICS ---------------------------------------------------------- */

    private function getSalesMetrics(Carbon $startDate): array
    {
        $totalRevenue = Invoice::where('status', 'paid')
            ->where('date', '>=', $startDate)
            ->sum('total_ttc');

        $totalOrders = Order::where('created_at', '>=', $startDate)->count();
        $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        $monthlyGrowth = $this->getMonthlyGrowth();

        $quoteBasedSales = Order::whereNotNull('quote_id')
            ->where('created_at', '>=', $startDate)->count();

        $directSales = Order::whereNull('quote_id')
            ->where('created_at', '>=', $startDate)->count();

        $avgConversionTime = DB::table('quotes')
            ->join('orders', 'quotes.id', '=', 'orders.quote_id')
            ->where('quotes.created_at', '>=', $startDate)
            ->selectRaw('AVG(' . (
                DB::connection()->getDriverName() === 'sqlite'
                    ? '(julianday(orders.created_at) - julianday(quotes.created_at))'
                    : 'DATEDIFF(orders.created_at, quotes.created_at)'
            ) . ') as avg_days')
            ->value('avg_days') ?? 0;

        return [
            'averageOrderValue' => [
                'value' => $averageOrderValue,
                'formatted' => number_format($averageOrderValue, 2, ',', ' ') . ' MAD',
            ],
            'monthlyGrowth' => $monthlyGrowth,
            'salesChannels' => [
                'quote_based' => $quoteBasedSales,
                'direct' => $directSales,
                'total' => $quoteBasedSales + $directSales,
            ],
            'avgConversionTime' => round($avgConversionTime, 1),
        ];
    }

    /* CLIENT METRICS --------------------------------------------------------- */

    private function getClientMetrics(Carbon $startDate): array
    {
        $activeClients = Client::whereHas('orders', fn($q) => $q->where('created_at', '>=', $startDate))->count();

        $returningClients = Client::whereHas('orders', fn($q) => $q->where('created_at', '>=', $startDate))
            ->whereHas('orders', fn($q) => $q->where('created_at', '<', $startDate))
            ->count();

        $retentionRate = $activeClients > 0 ? ($returningClients / $activeClients) * 100 : 0;

        /* STRICT MODE SAFE */
        $topClients = DB::table('orders')
            ->join('clients', 'clients.id', '=', 'orders.client_id')
            ->where('orders.created_at', '>=', $startDate)
            ->select(
                'clients.id',
                'clients.company_name',
                'clients.contact_name',
                'clients.email',
                'clients.phone',
                'clients.city',
                DB::raw('SUM(orders.total_ttc) as total_spent'),
                DB::raw('COUNT(orders.id) as orders_count')
            )
            ->groupBy(
                'clients.id',
                'clients.company_name',
                'clients.contact_name',
                'clients.email',
                'clients.phone',
                'clients.city'
            )
            ->orderByDesc('total_spent')
            ->limit(5)
            ->get();

        $clientsByCity = Client::select('city', DB::raw('COUNT(*) as count'))
            ->whereHas('orders', fn($q) => $q->where('created_at', '>=', $startDate))
            ->groupBy('city')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return [
            'activeClients' => $activeClients,
            'retentionRate' => round($retentionRate, 1),
            'topClients' => $topClients,
            'clientsByCity' => $clientsByCity,
        ];
    }

    /* INVENTORY METRICS ------------------------------------------------------ */

    private function getInventoryMetrics(): array
    {
        $totalStockValue = Product::where('track_inventory', true)
            ->selectRaw('SUM(stock_quantity * price) as total_value')
            ->value('total_value') ?? 0;

        $soldQuantity = DB::table('quote_items')
            ->join('quotes', 'quotes.id', '=', 'quote_items.quote_id')
            ->where('quotes.status', 'converted')
            ->where('quotes.created_at', '>=', Carbon::now()->subDays(365))
            ->sum('quote_items.quantity');

        $avgStock = Product::where('track_inventory', true)->avg('stock_quantity') ?? 1;
        $stockTurnover = $avgStock > 0 ? $soldQuantity / $avgStock : 0;

        /* STRICT MODE SAFE */
        $topMovingProducts = Product::select(
                'products.id',
                'products.name',
                'products.sku',
                'products.price',
                DB::raw('SUM(quote_items.quantity) as total_sold')
            )
            ->join('quote_items', 'products.id', '=', 'quote_items.product_id')
            ->join('quotes', 'quotes.id', '=', 'quote_items.quote_id')
            ->where('quotes.status', 'converted')
            ->where('quotes.created_at', '>=', Carbon::now()->subDays(90))
            ->whereNull('products.deleted_at')
            ->groupBy('products.id', 'products.name', 'products.sku', 'products.price')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        $slowMovingProducts = Product::where('track_inventory', true)
            ->where('stock_quantity', '>', 0)
            ->whereDoesntHave('stockMovements', fn($q) =>
                $q->where('type', 'out')
                  ->where('created_at', '>=', Carbon::now()->subDays(90))
            )
            ->limit(5)
            ->get();

        return [
            'totalStockValue' => [
                'value' => $totalStockValue,
                'formatted' => number_format($totalStockValue, 2, ',', ' ') . ' MAD',
            ],
            'stockTurnover' => round($stockTurnover, 2),
            'topMovingProducts' => $topMovingProducts,
            'slowMovingProducts' => $slowMovingProducts,
            'lowStockCount' => Product::where('track_inventory', true)
                ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
                ->count(),
        ];
    }

    /* FINANCIAL METRICS ------------------------------------------------------ */

    private function getFinancialMetrics(Carbon $startDate): array
    {
        $driver = DB::connection()->getDriverName();

        $totalRevenue = Invoice::where('status', 'paid')
            ->where('date', '>=', $startDate)
            ->sum('total_ttc');

        $totalCost = DB::table('invoice_lines')
            ->join('invoices', 'invoices.id', '=', 'invoice_lines.invoice_id')
            ->join('products', 'products.id', '=', 'invoice_lines.product_id')
            ->where('invoices.status', 'paid')
            ->where('invoices.date', '>=', $startDate)
            ->selectRaw('SUM(invoice_lines.quantity * products.cost_price) as total_cost')
            ->value('total_cost') ?? 0;

        $grossMargin = $totalRevenue > 0 ? (($totalRevenue - $totalCost) / $totalRevenue) * 100 : 0;

        $overdueInvoices = Invoice::where('due_date', '<', Carbon::now())
            ->whereIn('status', ['sent', 'issued', 'partially_paid'])
            ->count();

        $overdueAmount = Invoice::where('due_date', '<', Carbon::now())
            ->whereIn('status', ['sent', 'issued', 'partially_paid'])
            ->sum('total_ttc');

        $monthExpr = match ($driver) {
            'sqlite' => "strftime('%Y-%m', date)",
            'pgsql' => "to_char(date, 'YYYY-MM')",
            'sqlsrv' => "FORMAT(date, 'yyyy-MM')",
            default => 'DATE_FORMAT(date, "%Y-%m")',
        };

        $monthlyRevenue = Invoice::select(
                DB::raw("$monthExpr as month"),
                DB::raw('SUM(total_ttc) as revenue')
            )
            ->where('status', 'paid')
            ->where('date', '>=', Carbon::now()->subYear())
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return [
            'grossMargin' => round($grossMargin, 1),
            'totalCost' => [
                'value' => $totalCost,
                'formatted' => number_format($totalCost, 2, ',', ' ') . ' MAD',
            ],
            'overdueInvoices' => [
                'count' => $overdueInvoices,
                'amount' => $overdueAmount,
                'formatted' => number_format($overdueAmount, 2, ',', ' ') . ' MAD',
            ],
            'monthlyRevenue' => $monthlyRevenue->map(function($item) {
                $date = Carbon::createFromFormat('Y-m', $item->month);
                return [
                    'month' => $item->month,
                    'label' => $date->format('M Y'),
                    'revenue' => (float) $item->revenue,
                ];
            }),
        ];
    }

    /* PERFORMANCE METRICS ---------------------------------------------------- */

    private function getPerformanceMetrics(Carbon $startDate): array
    {
        $driver = DB::connection()->getDriverName();

        $hoursDiffExpr = match ($driver) {
            'sqlite' => '(julianday(confirmed_at) - julianday(created_at)) * 24',
            'pgsql' => 'EXTRACT(EPOCH FROM (confirmed_at - created_at)) / 3600',
            'sqlsrv' => 'DATEDIFF(HOUR, created_at, confirmed_at)',
            default => 'TIMESTAMPDIFF(HOUR, created_at, confirmed_at)',
        };

        $avgProcessingTime = Order::where('created_at', '>=', $startDate)
            ->whereNotNull('confirmed_at')
            ->selectRaw("AVG($hoursDiffExpr) as avg_hours")
            ->value('avg_hours') ?? 0;

        $totalOrders = Order::where('created_at', '>=', $startDate)->count();
        $cancelledOrders = Order::where('created_at', '>=', $startDate)
            ->where('status', 'cancelled')
            ->count();

        $cancellationRate = $totalOrders > 0 ? ($cancelledOrders / $totalOrders) * 100 : 0;

        $mostViewedProducts = DB::table('quote_items')
            ->join('quotes', 'quotes.id', '=', 'quote_items.quote_id')
            ->join('products', 'products.id', '=', 'quote_items.product_id')
            ->select(
                'products.id',
                'products.name',
                'products.sku',
                DB::raw('COUNT(*) as views')
            )
            ->where('quotes.created_at', '>=', $startDate)
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderByDesc('views')
            ->limit(5)
            ->get();

        $orderStatusEvolution = Order::select('status', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', $startDate)
            ->groupBy('status')
            ->get();

        return [
            'avgProcessingTime' => round($avgProcessingTime, 1),
            'cancellationRate' => round($cancellationRate, 1),
            'mostViewedProducts' => $mostViewedProducts,
            'orderStatusEvolution' => $orderStatusEvolution,
        ];
    }

    /* TRENDS DATA ------------------------------------------------------------ */

    private function getTrendsData(Carbon $startDate): array
    {
        $dailyMetrics = [];
        $current = $startDate->copy();

        while ($current <= Carbon::now()) {

            $dayRevenue = Invoice::where('status', 'paid')
                ->where('date', $current->toDateString())
                ->sum('total_ttc');

            $dayStart = $current->copy()->startOfDay();
            $dayEnd = $current->copy()->endOfDay();

            $dayOrders = Order::whereBetween('created_at', [$dayStart, $dayEnd])->count();
            $dayQuotes = Quote::whereBetween('created_at', [$dayStart, $dayEnd])->count();

            $dailyMetrics[] = [
                'date' => $current->format('Y-m-d'),
                'label' => $current->format('d/m'),
                'revenue' => (float) $dayRevenue,
                'orders' => $dayOrders,
                'quotes' => $dayQuotes,
            ];

            $current->addDay();
        }

        $categoryRevenue = DB::table('quote_items')
            ->join('quotes', 'quotes.id', '=', 'quote_items.quote_id')
            ->join('products', 'products.id', '=', 'quote_items.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->select(
                'categories.id',
                'categories.name',
                DB::raw('SUM(quote_items.quantity * products.price) as revenue')
            )
            ->where('quotes.status', 'converted')
            ->where('quotes.created_at', '>=', $startDate)
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('revenue')
            ->get();

        return [
            'dailyMetrics' => $dailyMetrics,
            'categoryRevenue' => $categoryRevenue->map(fn($item) => [
                'name' => $item->name,
                'revenue' => (float) $item->revenue,
                'formatted' => number_format($item->revenue, 0, ',', ' ') . ' MAD',
            ]),
        ];
    }

    /* HEATMAP DATA ----------------------------------------------------------- */

    private function getHeatmapData(Carbon $startDate): array
    {
        $driver = DB::connection()->getDriverName();

        $dayOfWeekExpr = match ($driver) {
            'sqlite' => "(CAST(strftime('%w', created_at) AS INTEGER) + 1)",
            'pgsql' => '(EXTRACT(DOW FROM created_at) + 1)',
            'sqlsrv' => 'DATEPART(WEEKDAY, created_at)',
            default => 'DAYOFWEEK(created_at)',
        };

        $hourExpr = match ($driver) {
            'sqlite' => "CAST(strftime('%H', created_at) AS INTEGER)",
            'pgsql' => 'EXTRACT(HOUR FROM created_at)',
            'sqlsrv' => 'DATEPART(HOUR, created_at)',
            default => 'HOUR(created_at)',
        };

        $salesHeatmap = Order::select(
                DB::raw("$dayOfWeekExpr as day_of_week"),
                DB::raw("$hourExpr as hour"),
                DB::raw('COUNT(*) as orders_count'),
                DB::raw('SUM(total_ttc) as revenue')
            )
            ->where('created_at', '>=', $startDate)
            ->groupBy('day_of_week', 'hour')
            ->get();

        $brandCategoryMatrix = DB::table('products')
            ->join('brands', 'brands.id', '=', 'products.brand_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->join('quote_items', 'products.id', '=', 'quote_items.product_id')
            ->join('quotes', 'quotes.id', '=', 'quote_items.quote_id')
            ->select(
                'brands.id',
                'brands.name as brand_name',
                'categories.id as category_id',
                'categories.name as category_name',
                DB::raw('SUM(quote_items.quantity * products.price) as revenue'),
                DB::raw('SUM(quote_items.quantity) as quantity')
            )
            ->where('quotes.status', 'converted')
            ->where('quotes.created_at', '>=', $startDate)
            ->groupBy('brands.id', 'categories.id', 'brands.name', 'categories.name')
            ->get();

        return [
            'salesHeatmap' => $salesHeatmap,
            'brandCategoryMatrix' => $brandCategoryMatrix,
        ];
    }

    /* SALES CHART ------------------------------------------------------------ */

    private function getSalesChartData(Carbon $startDate): array
    {
        $days = $startDate->diffInDays(Carbon::now());

        $driver = DB::connection()->getDriverName();

        if ($days <= 7) {
            $groupBy = 'DATE(date)';
            $format  = 'Y-m-d';
        } elseif ($days <= 30) {
            $groupBy = 'DATE(date)';
            $format  = 'Y-m-d';
        } else {
            $groupBy = $driver === 'sqlite'
                ? "strftime('%Y-%m', date)"
                : 'DATE_FORMAT(date, "%Y-%m")';
            $format  = 'Y-m';
        }

        $salesData = Invoice::select(
                DB::raw("$groupBy as period"),
                DB::raw('SUM(total_ttc) as revenue'),
                DB::raw('COUNT(*) as count')
            )
            ->where('status', 'paid')
            ->where('date', '>=', $startDate)
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return $salesData->map(function ($item) use ($format, $days) {
            $dateObj = Carbon::createFromFormat($format, $item->period);

            return [
                'date' => $item->period,
                'label' => $days <= 30 ? $dateObj->format('d/m') : $dateObj->format('M Y'),
                'revenue' => (float) $item->revenue,
                'orders' => (int) $item->count,
            ];
        })->toArray();
    }

    /* TOP PRODUCTS (STRICT-MODE SAFE) --------------------------------------- */

    private function getTopProducts(Carbon $startDate): array
    {
        return DB::table('invoice_lines')
            ->join('invoices', 'invoices.id', '=', 'invoice_lines.invoice_id')
            ->join('products', 'products.id', '=', 'invoice_lines.product_id')
            ->select(
                'products.id',
                'products.name',
                'products.sku',
                DB::raw('SUM(invoice_lines.quantity) as total_quantity'),
                DB::raw('SUM(invoice_lines.quantity * products.price) as total_revenue')
            )
            ->where('invoices.status', 'paid')
            ->whereBetween('invoices.date', [$startDate, Carbon::now()])
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'quantity' => (int) $item->total_quantity,
                'revenue' => (float) $item->total_revenue,
                'formatted_revenue' => number_format($item->total_revenue, 2, ',', ' ') . ' MAD',
            ])
            ->toArray();
    }

    /* STOCK ALERTS ----------------------------------------------------------- */

    private function getStockAlerts(): array
    {
        $lowStock = Product::where('track_inventory', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->where('stock_quantity', '>', 0)
            ->with('category:id,name')
            ->orderBy('stock_quantity')
            ->limit(10)
            ->get(['id', 'name', 'sku', 'stock_quantity', 'low_stock_threshold', 'category_id']);

        $outOfStock = Product::where('track_inventory', true)
            ->where('stock_quantity', 0)
            ->with('category:id,name')
            ->limit(10)
            ->get(['id', 'name', 'sku', 'stock_quantity', 'category_id']);

        return [
            'lowStock' => $lowStock,
            'outOfStock' => $outOfStock,
        ];
    }

    /* RECENT ACTIVITY -------------------------------------------------------- */

    private function getRecentActivity(): array
    {
        $activities = [];

        $recentOrders = Order::with('client:id,company_name')
            ->latest()
            ->limit(5)
            ->get(['id', 'order_number', 'client_id', 'status', 'total_ttc', 'created_at']);

        foreach ($recentOrders as $order) {
            $activities[] = [
                'type' => 'order',
                'title' => "Commande {$order->order_number}",
                'description' => "Client: {$order->client->company_name}",
                'amount' => $order->total_ttc,
                'status' => $order->status,
                'created_at' => $order->created_at,
            ];
        }

        $recentQuotes = Quote::with('client:id,company_name')
            ->latest()
            ->limit(5)
            ->get(['id', 'quote_number', 'client_id', 'status', 'total_ttc', 'created_at']);

        foreach ($recentQuotes as $quote) {
            $activities[] = [
                'type' => 'quote',
                'title' => "Devis {$quote->quote_number}",
                'description' => "Client: {$quote->client->company_name}",
                'amount' => $quote->total_ttc,
                'status' => $quote->status,
                'created_at' => $quote->created_at,
            ];
        }

        return collect($activities)
            ->sortByDesc('created_at')
            ->take(8)
            ->values()
            ->toArray();
    }

    /* CATEGORY DISTRIBUTION -------------------------------------------------- */

    private function getCategoryDistribution(): array
    {
        return Category::select(
                'categories.id',
                'categories.name',
                DB::raw('COUNT(products.id) as product_count'),
                DB::raw('SUM(products.stock_quantity) as total_stock'),
                DB::raw('SUM(products.price * products.stock_quantity) as stock_value')
            )
            ->leftJoin('products', 'categories.id', '=', 'products.category_id')
            ->where('categories.is_active', true)
            ->whereNull('products.deleted_at')
            ->groupBy('categories.id', 'categories.name')
            ->having('product_count', '>', 0)
            ->orderByDesc('product_count')
            ->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'productCount' => (int) $item->product_count,
                'totalStock' => (int) $item->total_stock,
                'stockValue' => (float) $item->stock_value,
                'formattedValue' => number_format($item->stock_value, 0, ',', ' ') . ' MAD',
            ])
            ->toArray();
    }

    /* QUOTES CONVERSION ------------------------------------------------------ */

    private function getQuoteConversionRate(Carbon $startDate): array
    {
        $totalQuotes = Quote::where('created_at', '>=', $startDate)->count();

        $convertedQuotes = Quote::where('created_at', '>=', $startDate)
            ->whereIn('status', ['accepted', 'converted'])
            ->count();

        $conversionRate = $totalQuotes > 0 ? ($convertedQuotes / $totalQuotes) * 100 : 0;

        $statusBreakdown = Quote::select('status', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', $startDate)
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn($item) => [$item->status => (int) $item->count])
            ->toArray();

        return [
            'rate' => round($conversionRate, 1),
            'total' => $totalQuotes,
            'converted' => $convertedQuotes,
            'breakdown' => $statusBreakdown,
        ];
    }

    /* MONTHLY GROWTH --------------------------------------------------------- */

    private function getMonthlyGrowth(): array
    {
        $currentMonth = Invoice::where('status', 'paid')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->sum('total_ttc');

        $previousMonth = Invoice::where('status', 'paid')
            ->whereMonth('date', now()->subMonth()->month)
            ->whereYear('date', now()->subMonth()->year)
            ->sum('total_ttc');

        $growth = $previousMonth > 0 ? (($currentMonth - $previousMonth) / $previousMonth) * 100 : 0;

        return [
            'current' => $currentMonth,
            'previous' => $previousMonth,
            'growth' => round($growth, 1),
            'formatted_current' => number_format($currentMonth, 2, ',', ' ') . ' MAD',
            'formatted_previous' => number_format($previousMonth, 2, ',', ' ') . ' MAD',
        ];
    }
}
