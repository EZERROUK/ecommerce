import { Head, Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

import { ArrowLeft, Pencil } from 'lucide-react';

type Post = {
    id: string;
    author_name?: string | null;
    title: string;
    slug: string;
    category: string;
    excerpt?: string | null;
    content?: string | null;
    topics?: string[];
    sources?: { label?: string | null; url?: string | null }[];
    status: 'draft' | 'published';
    published_at?: string | null;
    banner_url?: string | null;
};

export default function BlogPostsShow() {
    const { props } = usePage() as any;
    const post = props.post as Post;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Actualités & Blog', href: '/blog-posts' },
                { title: 'Détail', href: '' },
            ]}
        >
            <Head title={post.title} />
            <ParticlesBackground />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('blog-posts.index') as any}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold">{post.title}</h1>
                    </div>

                    <Link href={route('blog-posts.edit', { blogPost: post.id }) as any}>
                        <Button>
                            <Pencil className="mr-2 h-4 w-4" /> Éditer
                        </Button>
                    </Link>
                </div>

                <div className="space-y-4 rounded-xl border bg-white/70 p-6 backdrop-blur dark:bg-neutral-900/60">
                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                        <div>
                            <span className="text-gray-500">Slug:</span> /{post.slug}
                        </div>
                        <div>
                            <span className="text-gray-500">Catégorie:</span> {post.category}
                        </div>
                        <div>
                            <span className="text-gray-500">Statut:</span> {post.status}
                        </div>
                        <div>
                            <span className="text-gray-500">Auteur:</span> {post.author_name || '—'}
                        </div>
                        <div className="md:col-span-2">
                            <span className="text-gray-500">Publié le:</span> {post.published_at || '—'}
                        </div>
                    </div>

                    {post.banner_url && (
                        <div>
                            <div className="mb-2 text-sm text-gray-500">Bannière</div>
                            <img src={post.banner_url} alt={post.title} className="h-64 w-full max-w-3xl rounded border object-cover" />
                        </div>
                    )}

                    {post.excerpt && (
                        <div>
                            <div className="mb-2 text-sm text-gray-500">Résumé</div>
                            <div className="rounded-lg border bg-slate-50 p-4 dark:bg-neutral-950">{post.excerpt}</div>
                        </div>
                    )}

                    <div>
                        <div className="mb-2 text-sm text-gray-500">Contenu</div>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content || '' }} />
                    </div>

                    {Array.isArray(post.topics) && post.topics.length > 0 && (
                        <div>
                            <div className="mb-2 text-sm text-gray-500">Sujets associés</div>
                            <div className="flex flex-wrap gap-2">
                                {post.topics.map((t) => (
                                    <span key={t} className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {Array.isArray(post.sources) && post.sources.length > 0 && (
                        <div>
                            <div className="mb-2 text-sm text-gray-500">Sources</div>
                            <ul className="list-inside list-disc text-sm">
                                {post.sources.map((s, idx) => (
                                    <li key={idx}>
                                        {s?.url ? (
                                            <a className="text-blue-600 hover:underline" href={s.url} target="_blank" rel="noreferrer">
                                                {s?.label || s.url}
                                            </a>
                                        ) : (
                                            s?.label || '—'
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
