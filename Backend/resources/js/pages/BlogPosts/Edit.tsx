import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React from 'react';
import toast from 'react-hot-toast';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import RichTextEditor from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import { parseSources, parseTopics, slugify, sourcesToText } from './_formUtils';

type Post = {
    id: string;
    author_name?: string | null;
    title: string;
    slug: string;
    category: string;
    excerpt?: string | null;
    content?: string | null;
    topics?: string[];
    sources?: any[];
    status: 'draft' | 'published';
    published_at?: string | null;
    banner_url?: string | null;
};

type FormState = {
    title: string;
    slug: string;
    category: string;
    author_name: string;
    status: 'draft' | 'published';
    published_at: string;
    excerpt: string;
    content: string;
    topics_text: string;
    sources_text: string;
    banner: File | null;
    remove_banner: boolean;
};

export default function BlogPostsEdit() {
    const { props } = usePage() as any;
    const post = props.post as Post;

    const form = useForm<FormState & Record<string, any>>({
        title: post.title ?? '',
        slug: post.slug ?? '',
        category: post.category ?? 'Actualités',
        author_name: post.author_name ?? '',
        status: post.status ?? 'draft',
        published_at: post.published_at ?? '',
        excerpt: post.excerpt ?? '',
        content: post.content ?? '',
        topics_text: Array.isArray(post.topics) ? post.topics.join(', ') : '',
        sources_text: sourcesToText(post.sources ?? []),
        banner: null,
        remove_banner: false,
    });

    const { data, setData, processing, errors, post: inertiaPost, transform } = form;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        transform((f) => {
            const topics = parseTopics(String(f.topics_text ?? ''));
            const sources = parseSources(String(f.sources_text ?? ''));

            return {
                _method: 'patch',
                title: String(f.title ?? '').trim(),
                slug: slugify(String(f.slug ?? '')),
                category: String(f.category ?? 'Actualités').trim(),
                author_name: String(f.author_name ?? '').trim() || null,
                status: f.status,
                published_at: f.published_at || null,
                excerpt: String(f.excerpt ?? '').trim() || null,
                content: String(f.content ?? '') || null,
                topics: topics.length ? topics : null,
                sources: sources.length ? sources : null,
                banner: f.banner ?? null,
                remove_banner: !!f.remove_banner,
            };
        });

        inertiaPost(route('blog-posts.update', { blogPost: post.id }), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Article mis à jour.'),
            onError: () => toast.error('Erreur lors de la mise à jour.'),
        });
    };

    const confirmDelete = () => {
        if (!confirm(`Supprimer l'article "${post.title}" ?`)) return;
        form.delete(route('blog-posts.destroy', { blogPost: post.id }), {
            preserveScroll: true,
            onSuccess: () => toast.success('Article supprimé.'),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Actualités & Blog', href: '/blog-posts' },
                { title: 'Éditer', href: '' },
            ]}
        >
            <Head title="Éditer un article" />
            <ParticlesBackground />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('blog-posts.index') as any}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold">Éditer un article</h1>
                    </div>

                    <Button variant="destructive" onClick={confirmDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                    </Button>
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                        <strong>Veuillez corriger :</strong>
                        <ul className="mt-2 list-inside list-disc text-sm">
                            {Object.entries(errors).map(([k, m]) => (
                                <li key={k}>{m as string}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6 rounded-xl border bg-white/70 p-6 backdrop-blur dark:bg-neutral-900/60">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm text-gray-600">Titre *</label>
                            <Input value={data.title} onChange={(e) => setData('title', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Slug *</label>
                            <Input value={data.slug} onChange={(e) => setData('slug', e.target.value)} />
                            <div className="mt-1 text-xs text-gray-500">Format: lettres/chiffres/tirets.</div>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Catégorie *</label>
                            <Input value={data.category} onChange={(e) => setData('category', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Auteur</label>
                            <Input value={data.author_name} onChange={(e) => setData('author_name', e.target.value)} />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Statut *</label>
                            <select
                                className="w-full rounded-md border bg-white px-3 py-2 dark:bg-neutral-950"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as any)}
                            >
                                <option value="draft">Brouillon</option>
                                <option value="published">Publié</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Date de publication</label>
                            <Input type="datetime-local" value={data.published_at} onChange={(e) => setData('published_at', e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Bannière (image)</label>
                        {post.banner_url && (
                            <div className="mt-2 flex items-center gap-4">
                                <img src={post.banner_url} alt={post.title} className="h-20 w-32 rounded border object-cover" />
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={data.remove_banner}
                                        onChange={(e) => setData('remove_banner', e.target.checked)}
                                    />
                                    Supprimer la bannière actuelle
                                </label>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="mt-2 block w-full text-sm"
                            onChange={(e) => setData('banner', e.target.files?.[0] ?? null)}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Résumé / Extrait</label>
                        <Textarea value={data.excerpt} onChange={(e) => setData('excerpt', e.target.value)} rows={3} />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Contenu</label>
                        <RichTextEditor value={data.content} onChange={(html) => setData('content', html)} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm text-gray-600">Sujets associés (séparés par des virgules)</label>
                            <Input value={data.topics_text} onChange={(e) => setData('topics_text', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Sources (1 par ligne: url ou label|url)</label>
                            <Textarea value={data.sources_text} onChange={(e) => setData('sources_text', e.target.value)} rows={4} />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button type="submit" disabled={processing}>
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
