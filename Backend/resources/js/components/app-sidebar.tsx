import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { type AppSettings, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Boxes,
    Building2,
    ChevronDown,
    CircleDollarSign,
    Clock,
    ClipboardList,
    FileSignature,
    History,
    Home,
    IdCard,
    Key,
    Layers,
    LifeBuoy,
    LineChart,
    LogIn,
    MessageSquare,
    Newspaper,
    Package,
    Percent,
    Receipt,
    ReceiptText,
    Repeat,
    User,
    UserCog,
    Users,
    Wallet,
    Warehouse,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Props = SharedData & {
    settings: AppSettings;
    auth?: { roles?: unknown; permissions?: unknown };
};

type NavItem = {
    title: string;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
    required?: string;
    children?: NavItem[];
};

// Helpers
const toArray = (v: unknown): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map((x) => String(x));
    return Object.values(v as Record<string, unknown>).map((x) => String(x));
};

const elementsNavigation: NavItem[] = [
    { title: 'Tableau de bord', href: '/dashboard', icon: Home },

    {
        title: 'Gestion des utilisateurs',
        icon: Users,
        children: [
            { title: 'Utilisateurs', href: '/users', icon: User, required: 'user_list' },
            { title: 'Rôles', href: '/roles', icon: UserCog, required: 'role_list' },
            { title: 'Permissions', href: '/permissions', icon: Key, required: 'permission_list' },
        ],
    },

    // Nouvelle section ajoutée "Gestion du personnel"
    {
        title: 'Gestion du personnel',
        icon: IdCard,
        children: [
            { title: 'Départements', href: '/departments', icon: Building2, required: 'department_list' },
            { title: 'Employés', href: '/employees', icon: User, required: 'employee_list' },
            { title: 'Congés', href: '/leaves/requests', icon: ClipboardList, required: 'leave_list' },
        ],
    },

    {
        title: 'Historique des journaux',
        icon: History,
        children: [
            { title: "Journaux d'audit", href: '/audit-logs', icon: ClipboardList, required: 'audit_list' },
            { title: 'Connexions', href: '/login-logs', icon: LogIn, required: 'loginlog_list' },
        ],
    },

    {
        title: 'Catalogue',
        icon: Boxes,
        children: [
            { title: 'Catégories', href: '/categories', icon: Layers, required: 'category_list' },
            { title: 'Produits', href: '/products', icon: Package, required: 'product_list' },
            { title: 'Avis & commentaires', href: '/product-reviews', icon: MessageSquare, required: 'product_review_list' },
        ],
    },

    { title: 'Actualités & Blog', href: '/blog-posts', icon: Newspaper, required: 'blog_post_list' },

    {
        title: 'Helpdesk / Tickets',
        icon: LifeBuoy,
        children: [
            { title: 'Tickets', href: '/tickets', icon: LifeBuoy, required: 'ticket_list' },
            { title: 'SLA', href: '/tickets/sla-policies', icon: Clock, required: 'ticket_manage_sla' },
        ],
    },

    {
        title: 'Gestion commerciale',
        icon: Building2,
        children: [
            { title: 'Clients', href: '/clients', icon: Users, required: 'client_list' },
            { title: 'Promotions', href: '/promotions', icon: Percent },
            { title: 'Devis', href: '/quotes', icon: FileSignature, required: 'quote_list' },
            { title: 'Factures', href: '/invoices', icon: Receipt, required: 'invoice_list' },
            { title: 'Commandes Web', href: '/web-orders', icon: Receipt, required: 'web_order_list' },
        ],
    },

    {
        title: 'Gestion de stock',
        icon: Warehouse,
        children: [
            { title: 'Mouvements de stock', href: '/stock-movements', icon: Repeat, required: 'stock_movement_list' },
            { title: 'Rapport de stock', href: '/stock-movements/report', icon: LineChart, required: 'stock_movement_list' },
        ],
    },
    {
        title: 'Trésorerie & paiements',
        href: '/financial/transactions',
        icon: ReceiptText, // J'ai remplacé LineChart par Wallet pour l'icône principale pour être plus cohérent
        required: 'financial_transaction_list',
    },

    {
        title: 'Paramètres financiers',
        icon: Wallet,
        children: [
            { title: 'TVA', href: '/tax-rates', icon: Percent, required: 'taxrate_list' },
            { title: 'Devises', href: '/currencies', icon: CircleDollarSign, required: 'currency_list' },
        ],
    },
];

export function AppSidebar() {
    const {
        url,
        props: { settings, auth },
    } = usePage<Props>();
    const { isDark } = useAppearance();
    const { state: sidebarState } = useSidebar();
    const estRéduit = sidebarState === 'collapsed';
    const [menuOuvert, setMenuOuvert] = useState<string | null>(null);

    const roles = useMemo(() => toArray(auth?.roles), [auth?.roles]);
    const permsSet = useMemo(() => new Set(toArray(auth?.permissions)), [auth?.permissions]);
    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
    const can = useCallback((permission?: string) => !permission || isSuperAdmin || permsSet.has(permission), [isSuperAdmin, permsSet]);

    // 🔧 Filtrage: si parent n’a pas `required`, il doit avoir au moins 1 enfant visible
    const filteredNavigation = useMemo<NavItem[]>(
        () =>
            elementsNavigation
                .map((item) => {
                    if (item.children?.length) {
                        const visibleChildren = item.children.filter((c) => can(c.required));
                        const showParent = item.required ? can(item.required) || visibleChildren.length > 0 : visibleChildren.length > 0;
                        return showParent ? { ...item, children: visibleChildren } : null;
                    }
                    return can(item.required) ? item : null;
                })
                .filter(Boolean) as NavItem[],
        [can],
    );

    useEffect(() => {
        filteredNavigation.forEach((item) => {
            if (item.children && item.children.some((c) => estActif(c.href))) {
                if (menuOuvert !== item.title) setMenuOuvert(item.title);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, filteredNavigation]);

    const basculerMenu = (titre: string) => setMenuOuvert((prev) => (prev === titre ? null : titre));

    const getAllHrefs = (items: NavItem[]): string[] => {
        const hrefs: string[] = [];
        items.forEach((item) => {
            if (item.href) hrefs.push(item.href);
            if (item.children) hrefs.push(...getAllHrefs(item.children));
        });
        return hrefs;
    };

    const estActif = (href?: string) => {
        if (!href) return false;
        if (href === '/') return url === '/';
        if (url === href) return true;

        const allHrefs = getAllHrefs(filteredNavigation);
        const urlStartsWithHref = url.startsWith(href + '/');
        const longerMatchingHrefs = allHrefs.filter((h) => h !== href && h.startsWith(href + '/') && url.startsWith(h));

        return urlStartsWithHref && longerMatchingHrefs.length === 0;
    };

    const logoUrl = isDark ? settings.logo_dark_url || settings.logo_url : settings.logo_url;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" className="flex justify-center py-4">
                                <img
                                    key={logoUrl}
                                    src={logoUrl || '/logo.svg'}
                                    alt={settings.app_name}
                                    className="h-10 w-auto rounded object-contain"
                                />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="text-sidebar-foreground overflow-hidden">
                <nav className="space-y-1">
                    {filteredNavigation.map((item) =>
                        item.children ? (
                            <div key={item.title}>
                                <button
                                    onClick={() => basculerMenu(item.title)}
                                    className={cn(
                                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                        menuOuvert === item.title
                                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                            : 'hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
                                    )}
                                >
                                    <div className="flex items-center">
                                        {item.icon && <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />}
                                        {!estRéduit && <span className="truncate">{item.title}</span>}
                                    </div>
                                    {!estRéduit && (
                                        <ChevronDown className={cn('h-4 w-4 transition-transform', menuOuvert === item.title && 'rotate-180')} />
                                    )}
                                </button>
                                {!estRéduit && menuOuvert === item.title && item.children.length > 0 && (
                                    <div className="mt-1 ml-6 space-y-1">
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.title}
                                                href={child.href!}
                                                className={cn(
                                                    'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                                    estActif(child.href)
                                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                                        : 'hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
                                                )}
                                            >
                                                {child.icon && <child.icon className="mr-3 h-5 w-5 flex-shrink-0" />}
                                                <span className="truncate">{child.title}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                key={item.title}
                                href={item.href!}
                                className={cn(
                                    'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    estActif(item.href)
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
                                )}
                            >
                                {item.icon && <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />}
                                {!estRéduit && <span className="truncate">{item.title}</span>}
                            </Link>
                        ),
                    )}
                </nav>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

export default AppSidebar;
