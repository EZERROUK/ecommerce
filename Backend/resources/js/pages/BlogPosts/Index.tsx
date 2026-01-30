import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
	ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Filter, Pencil, Plus, RefreshCcw, RotateCcw, Search, SlidersHorizontal, Trash2, X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

type BlogPostStatus = 'draft' | 'published';
type SortCol = 'title' | 'status' | 'published_at';
type SortDir = 'asc' | 'desc';

interface BlogPostRow {
	id: string;
	title: string;
	slug: string;
	status: BlogPostStatus;
	category: string;
	author_name?: string | null;
	published_at?: string | null;
	created_at?: string | null;
	deleted_at?: string | null;
}

interface BlogPostsFilters {
	search?: string;
	status?: BlogPostStatus | '';
	category?: string;
	author_name?: string;
	start_date?: string;
	end_date?: string;
	sort?: SortCol;
	direction?: SortDir;
	per_page?: number;
	page?: number;
}

interface Pagination<T> {
	data: T[];
	current_page: number;
	last_page: number;
	from: number;
	to: number;
	total: number;
	per_page: number;
}

interface Flash {
	success?: string;
	error?: string;
}

interface Props {
	posts: Pagination<BlogPostRow>;
	filters: BlogPostsFilters;
	categories: string[];
	flash?: Flash;
}

function toQueryString(payload: Record<string, unknown>): string {
	const params = new URLSearchParams();
	Object.entries(payload).forEach(([k, v]) => {
		if (v === undefined || v === null || v === '') return;
		params.append(k, String(v));
	});
	return params.toString();
}

const badgeClass = (status: BlogPostStatus) => (status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700');

const useCan = () => {
	const { props } = usePage<any>();
	const auth = (props as any)?.auth;
	const rolesRaw = auth?.roles ?? [];
	const roles: string[] = rolesRaw.map((r: any) => (typeof r === 'string' ? r : r?.name)).filter(Boolean);
	const permsRaw = auth?.permissions ?? [];
	const perms: string[] = permsRaw.map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean);
	const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
	const can = (p?: string) => !p || isSuperAdmin || perms.includes(p);
	return { can, isSuperAdmin };
};

export default function BlogPostsIndex() {
	const { props } = usePage() as any;
	const { can } = useCan();
	const posts: Pagination<BlogPostRow> = props.posts;
	const filters: BlogPostsFilters = props.filters ?? {};
	const categories: string[] = props.categories ?? [];
	const flash: Flash = props.flash ?? {};

	const sort: SortCol = (filters?.sort as SortCol) || 'published_at';
	const dir: SortDir = (filters?.direction as SortDir) || 'desc';
	const per: number = typeof filters?.per_page !== 'undefined' && filters?.per_page !== null ? Number(filters.per_page) : Number((posts as any)?.per_page ?? 10);

	// UI state
	const [showFilters, setShowFilters] = useState(false);
	type ChipField = 'search' | 'status' | 'category' | 'author' | 'date';
	const [field, setField] = useState<ChipField>('search');
	const [value, setValue] = useState('');
	const [start, setStart] = useState<string>(filters?.start_date ?? '');
	const [end, setEnd] = useState<string>(filters?.end_date ?? '');

	type Chip =
		| { field: 'search'; value: string }
		| { field: 'status'; value: BlogPostStatus | '' }
		| { field: 'category'; value: string }
		| { field: 'author'; value: string }
		| { field: 'date'; value: string; value2: string };

	const makeChipsFromFilters = (): Chip[] => {
		const arr: Chip[] = [];
		if (filters?.search) {
			const tokens = String(filters.search)
				.split(/\s+/)
				.map((t) => t.trim())
				.filter(Boolean);
			tokens.forEach((t) => arr.push({ field: 'search', value: t }));
		}
		if (filters?.status !== undefined && filters?.status !== '') {
			arr.push({ field: 'status', value: filters.status as BlogPostStatus });
		}
		if (filters?.category) {
			arr.push({ field: 'category', value: String(filters.category) });
		}
		if (filters?.author_name) {
			arr.push({ field: 'author', value: String(filters.author_name) });
		}
		if (filters?.start_date && filters?.end_date) {
			arr.push({ field: 'date', value: filters.start_date!, value2: filters.end_date! });
		}
		return arr;
	};

	const [chips, setChips] = useState<Chip[]>(() => makeChipsFromFilters());
	useEffect(() => {
		setChips(makeChipsFromFilters());
		setStart(filters?.start_date ?? '');
		setEnd(filters?.end_date ?? '');
		setSelectedIds([]);
	}, [filters]);

	// Sélection en masse
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const toggleSelect = (id: string) => setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));
	const anySelected = selectedIds.length > 0;

	// Actions groupées (exemple : suppression)
	const deleteSelected = () => {
		if (!can('blog_post_delete') || !selectedIds.length) return;
		if (!confirm(`Supprimer ${selectedIds.length} article(s) ?`)) return;
		selectedIds.forEach((id) => {
			router.delete(route('blog-posts.destroy', { blogPost: id }), { preserveScroll: true });
		});
		setSelectedIds([]);
	};

	// Flash
	const [showSuccess, setShowSuccess] = useState(!!flash?.success);
	const [showError, setShowError] = useState(!!flash?.error);
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

	// Navigation helpers
	const buildQueryPayload = (list: Chip[], extra: Record<string, any> = {}) => {
		const p: Record<string, any> = { ...extra };
		const searchTokens = list.filter((s): s is Extract<Chip, { field: 'search' }> => s.field === 'search').map((s) => s.value);
		if (searchTokens.length) p.search = searchTokens.join(' ');
		const st = list.find((f): f is Extract<Chip, { field: 'status' }> => f.field === 'status');
		if (st && st.value) p.status = st.value;
		const cat = list.find((f): f is Extract<Chip, { field: 'category' }> => f.field === 'category');
		if (cat && cat.value) p.category = cat.value;
		const auth = list.find((f): f is Extract<Chip, { field: 'author' }> => f.field === 'author');
		if (auth && auth.value) p.author_name = auth.value;
		const rng = list.find((f): f is Extract<Chip, { field: 'date' }> => f.field === 'date');
		if (rng) {
			p.start_date = rng.value;
			p.end_date = rng.value2;
		}
		return p;
	};
	const go = (list: Chip[], extra: Record<string, any> = {}) => {
		const q = buildQueryPayload(list, { sort, direction: dir, per_page: per, ...extra });
		const base = route('blog-posts.index');
		const qs = toQueryString(q);
		const url = qs ? `${base}?${qs}` : base;
		router.get(url, {}, { preserveScroll: true, preserveState: true });
	};

	// Filtres UI
	const upsertChip = (n: Chip) => {
		let next: Chip[] = [];
		if (n.field === 'search') {
			const keep = chips.filter((c) => !(c.field === 'search' && c.value === n.value));
			next = [...keep, n];
		} else {
			next = chips.filter((c) => c.field !== n.field).concat(n);
		}
		setChips(next);
		go(next, { page: 1 });
	};
	const addChip = () => {
		if (field === 'date') {
			if (start && end) upsertChip({ field: 'date', value: start, value2: end });
			return;
		}
		const v = value.trim();
		if (!v) return;
		if (field === 'status') upsertChip({ field: 'status', value: v as BlogPostStatus });
		else if (field === 'category') upsertChip({ field: 'category', value: v });
		else if (field === 'author') upsertChip({ field: 'author', value: v });
		else upsertChip({ field: 'search', value: v });
		setValue('');
	};
	const removeChip = (idx: number) => {
		const toRemove = chips[idx];
		if (toRemove?.field === 'date') {
			setStart('');
			setEnd('');
		}
		const next = chips.filter((_, i) => i !== idx);
		setChips(next);
		go(next, { page: 1 });
	};

	// Pagination/tri
	const changePage = (p: number) => go(chips, { page: p });
	const changePer = (n: number) => {
		const q = buildQueryPayload(chips, { sort, direction: dir, per_page: n, page: 1 });
		const base = route('blog-posts.index');
		const qs = toQueryString(q);
		router.get(`${base}?${qs}`, {}, { preserveScroll: true, preserveState: true });
	};
	const changeSort = (col: SortCol) => {
		const newDir: SortDir = sort === col ? (dir === 'asc' ? 'desc' : 'asc') : 'asc';
		const q = buildQueryPayload(chips, { sort: col, direction: newDir, page: 1, per_page: per });
		const base = route('blog-posts.index');
		const qs = toQueryString(q);
		router.get(`${base}?${qs}`, {}, { preserveScroll: true, preserveState: true });
	};

	// Pagination window
	const windowPages = useMemo<(number | '…')[]>(() => {
		const res: (number | '…')[] = [];
		const MAX = 5;
		const c = posts.current_page;
		const l = posts.last_page;
		if (l <= MAX + 2) {
			for (let i = 1; i <= l; i++) res.push(i);
			return res;
		}
		res.push(1);
		let s = Math.max(2, c - Math.floor(MAX / 2));
		let e = s + MAX - 1;
		if (e >= l) {
			e = l - 1;
			s = e - MAX + 1;
		}
		if (s > 2) res.push('…');
		for (let i = s; i <= e; i++) res.push(i);
		if (e < l - 1) res.push('…');
		res.push(l);
		return res;
	}, [posts.current_page, posts.last_page]);

	// UI helpers
	const FIELD_LABELS: Record<ChipField, string> = {
		search: 'Recherche',
		status: 'Statut',
		category: 'Catégorie',
		author: 'Auteur',
		date: 'Date de publication',
	};

	// RENDER
	return (
		<AppLayout breadcrumbs={[{ title: 'Actualités & Blog', href: '/blog-posts' }]}>
			<Head title="Actualités & Blog" />
			<ParticlesBackground />

			<div className="relative z-10 w-full px-4 py-6">
				{/* Flash */}
				{flash?.success && showSuccess && (
					<div className="mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-100">
						<span className="flex-1 font-medium">{flash.success}</span>
						<button onClick={() => setShowSuccess(false)}>
							<X className="h-4 w-4" />
						</button>
					</div>
				)}
				{flash?.error && showError && (
					<div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100">
						<span className="flex-1 font-medium">{flash.error}</span>
						<button onClick={() => setShowError(false)}>
							<X className="h-4 w-4" />
						</button>
					</div>
				)}

				{/* Header */}
				<h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">Actualités & Blog</h1>
				<p className="mb-6 text-sm text-slate-600 dark:text-slate-400">Gestion des articles et actualités</p>

				{/* Outils + filtres */}
				<div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
					<div className="flex flex-wrap justify-between gap-4">
						{/* Bloc filtres + bulk actions */}
						<div className="flex w-full flex-col gap-4 lg:w-auto">
							<div className="flex items-center gap-3">
								<Button onClick={() => setShowFilters(!showFilters)}>
									<Filter className="h-4 w-4" />
									{showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
								</Button>
								{chips.length > 0 && (
									<Button variant="outline" onClick={() => { setChips([]); setStart(''); setEnd(''); setValue(''); setSelectedIds([]); go([], { page: 1 }); }} className="gap-1.5">
										<X className="h-4 w-4" /> Effacer
									</Button>
								)}
								{anySelected && can('blog_post_delete') && (
									<Button variant="destructive" onClick={deleteSelected}>
										<Trash2 className="mr-1 h-4 w-4" /> Supprimer ({selectedIds.length})
									</Button>
								)}
							</div>
							{showFilters && (
								<div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-2xl dark:border-slate-700 dark:bg-slate-800">
									<h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
										<SlidersHorizontal className="h-4 w-4" /> Filtrer les articles
									</h3>
									<div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
										<select
											value={field}
											onChange={(e) => { setField(e.target.value as any); setValue(''); }}
											className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
										>
											<option value="search">Recherche</option>
											<option value="status">Statut</option>
											<option value="category">Catégorie</option>
											<option value="author">Auteur</option>
											<option value="date">Date de publication</option>
										</select>
									</div>
									<div className="mb-3">
										{field === 'date' ? (
											<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
												<input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
												<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
											</div>
										) : field === 'status' ? (
											<select value={(chips.find((c) => c.field === 'status') as any)?.value ?? ''} onChange={(e) => upsertChip({ field: 'status', value: e.target.value as BlogPostStatus })} className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
												<option value="">Tous</option>
												<option value="draft">Brouillon</option>
												<option value="published">Publié</option>
											</select>
										) : field === 'category' ? (
											<select value={(chips.find((c) => c.field === 'category') as any)?.value ?? ''} onChange={(e) => upsertChip({ field: 'category', value: e.target.value })} className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
												<option value="">Toutes les catégories</option>
												{categories.map((cat) => (
													<option key={cat} value={cat}>{cat}</option>
												))}
											</select>
										) : field === 'author' ? (
											<input type="text" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addChip()} placeholder="Auteur… (Entrée pour appliquer)" className="w-full rounded-lg border bg-white py-2 pr-3 pl-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
										) : (
											<div className="relative">
												<Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
												<input type="text" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addChip()} placeholder="Titre, slug, contenu… (Entrée pour appliquer)" className="w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
											</div>
										)}
									</div>
									{field === 'search' && (
										<Button onClick={addChip} disabled={!value.trim()} className="w-full">Ajouter le filtre</Button>
									)}
								</div>
							)}
							{/* Chips actifs */}
							{chips.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{chips.map((c, i) => (
										<span key={`${c.field}-${i}-${(c as any).value ?? ''}`} className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200">
											<span className="font-medium">{FIELD_LABELS[c.field]}</span>: <span>{c.value}</span>
											<button onClick={() => removeChip(i)}><X className="h-3.5 w-3.5" /></button>
										</span>
									))}
								</div>
							)}
						</div>
						{/* Droite : per-page + créer */}
						<div className="ml-auto flex items-center gap-3">
							<div className="relative min-w-[220px]">
								<select value={per} onChange={(e) => changePer(Number(e.target.value))} className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
									{[5, 10, 20, 50].map((n) => (
										<option key={n} value={n}>{n} lignes par page</option>
									))}
									<option value={-1}>Tous</option>
								</select>
								<ChevronDown className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-slate-400" />
							</div>
							{can('blog_post_create') && (
								<Link href={route('blog-posts.create')}>
									<Button className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600">
										<Plus className="mr-1 h-4 w-4" /> Nouvel article
									</Button>
								</Link>
							)}
						</div>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
					<div className="w-full overflow-x-auto">
						<table className="w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
							<thead className="bg-slate-100 text-xs text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200">
								<tr>
									<th className="w-[50px] px-4 py-3 text-center">
										<input type="checkbox" checked={posts.data.length > 0 && posts.data.every((p) => selectedIds.includes(p.id))} onChange={() => setSelectedIds(posts.data.length > 0 && posts.data.every((p) => selectedIds.includes(p.id)) ? [] : posts.data.map((p) => p.id))} className="rounded border-slate-300 text-red-600" />
									</th>
									<th className="cursor-pointer px-6 py-4" onClick={() => changeSort('title')}>
										<div className="flex items-center gap-2">Titre {sort === 'title' && (dir === 'asc' ? '▲' : '▼')}</div>
									</th>
									<th className="px-6 py-4">Slug</th>
									<th className="px-6 py-4">Catégorie</th>
									<th className="px-6 py-4">Auteur</th>
									<th className="cursor-pointer px-6 py-4" onClick={() => changeSort('status')}>
										<div className="flex items-center gap-2">Statut {sort === 'status' && (dir === 'asc' ? '▲' : '▼')}</div>
									</th>
									<th className="cursor-pointer px-6 py-4" onClick={() => changeSort('published_at')}>
										<div className="flex items-center gap-2">Publication {sort === 'published_at' && (dir === 'asc' ? '▲' : '▼')}</div>
									</th>
									<th className="px-6 py-4 text-center">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-200 dark:divide-slate-700">
								{posts.data.length === 0 ? (
									<tr>
										<td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">Aucun article trouvé.</td>
									</tr>
								) : (
									posts.data.map((p) => (
										<tr key={p.id} className={`${p.deleted_at ? 'bg-red-50 dark:bg-red-900/10' : ''} transition-colors hover:bg-slate-50 dark:hover:bg-slate-800`}>
											<td className="px-4 py-3 text-center">
												<input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-slate-300 text-red-600" />
											</td>
											<td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{p.title}</td>
											<td className="px-6 py-3 text-slate-600 dark:text-slate-400">{p.slug}</td>
											<td className="px-6 py-3 text-slate-600 dark:text-slate-400">{p.category}</td>
											<td className="px-6 py-3 text-slate-600 dark:text-slate-400">{p.author_name || '—'}</td>
											<td className="px-6 py-3">
												<span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(p.status)}`}>{p.status === 'published' ? 'Publié' : 'Brouillon'}</span>
											</td>
											<td className="px-6 py-3 text-slate-600 dark:text-slate-400">{p.published_at || '—'}</td>
											<td className="px-6 py-3 text-center">
												<div className="flex justify-center gap-2">
													<Link href={route('blog-posts.show', { blogPost: p.id })} className="rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300" aria-label="Voir" title="Voir"><Eye className="h-5 w-5" /></Link>
													{can('blog_post_edit') && (
														<Link href={route('blog-posts.edit', { blogPost: p.id })} className="rounded-full p-1 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-800/30 dark:hover:text-yellow-300" aria-label="Éditer" title="Éditer"><Pencil className="h-5 w-5" /></Link>
													)}
													{can('blog_post_delete') && (
														<button onClick={() => { if (!can('blog_post_delete')) return; if (!confirm('Supprimer cet article ?')) return; router.delete(route('blog-posts.destroy', { blogPost: p.id }), { preserveScroll: true }); }} className="rounded-full p-1 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-800/30 dark:hover:text-red-300" aria-label="Supprimer" title="Supprimer"><Trash2 className="h-5 w-5" /></button>
													)}
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Pagination */}
				<div className="mt-4 flex flex-col items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 shadow-xl backdrop-blur-md sm:flex-row dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
					<span>Affichage de {posts.from} à {posts.to} sur {posts.total} résultats</span>
					{posts.last_page > 1 && (
						<div className="flex items-center gap-1">
							<Button size="sm" variant="outline" disabled={posts.current_page === 1} onClick={() => changePage(1)} aria-label="Première page"><ChevronsLeft className="h-4 w-4" /></Button>
							<Button size="sm" variant="outline" disabled={posts.current_page === 1} onClick={() => changePage(posts.current_page - 1)} aria-label="Page précédente"><ChevronLeft className="h-4 w-4" /></Button>
							{windowPages.map((p, idx) => p === '…' ? (<span key={`ellipsis-${idx}`} className="px-2 select-none">…</span>) : (<Button key={`page-${p}`} size="sm" variant={p === posts.current_page ? 'default' : 'outline'} onClick={() => changePage(p as number)}>{p}</Button>))}
							<Button size="sm" variant="outline" disabled={posts.current_page === posts.last_page} onClick={() => changePage(posts.current_page + 1)} aria-label="Page suivante"><ChevronRight className="h-4 w-4" /></Button>
							<Button size="sm" variant="outline" disabled={posts.current_page === posts.last_page} onClick={() => changePage(posts.last_page)} aria-label="Dernière page"><ChevronsRight className="h-4 w-4" /></Button>
						</div>
					)}
				</div>
			</div>
		</AppLayout>
	);
}
