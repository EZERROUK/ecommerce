
import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Calendar, User, Clock, ArrowLeft, Tag } from 'lucide-react';
import { SEO } from '../components/SEO';
import { Button } from '../components/Button';
import { knowledgeBase } from '../data/knowledge';
import { useLanguage } from '../contexts/LanguageContext';
import { ShareButtons } from '../components/ShareButtons';
import { fetchBlogPostBySlug } from '../utils/apiBlog';
import type { ApiBlogPost } from '../utils/apiTypes';

export const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { t } = useLanguage();
  
    const [article, setArticle] = useState<any | null>(null);
  const [type, setType] = useState<'blog' | 'knowledge'>('blog');
    const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Determine type based on URL
    const isKnowledge = location.pathname.includes('/knowledge');
    setType(isKnowledge ? 'knowledge' : 'blog');

        let mounted = true;

        ;(async () => {
            try {
                setLoading(true);

                if (!slug) {
                    setArticle(null);
                    return;
                }

                if (isKnowledge) {
                    const foundItem = knowledgeBase.find(item => item.slug === slug);
                    if (!mounted) return;
                    setArticle(foundItem || null);
                    return;
                }

                const res = await fetchBlogPostBySlug(slug);
                if (!mounted) return;
                setArticle((res?.data as ApiBlogPost) || null);
            } catch {
                if (!mounted) return;
                setArticle(null);
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
  }, [slug, location.pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Chargement…</h2>
            </div>
        );
    }

    if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Article non trouvé</h2>
        <Link to="/">
            <Button>Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  const isBlog = type === 'blog';

    const canonicalPath = isBlog ? `/blog/${encodeURIComponent(slug || '')}` : `/knowledge/${encodeURIComponent(slug || '')}`;

    const toIsoDate = (value: unknown): string | undefined => {
        if (!value) return undefined;
        const d = new Date(String(value));
        return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    };

    const imageUrl = article.image || '/images/technology.avif';
    const datePublished = toIsoDate(article.published_at || article.date);
    const dateModified = toIsoDate(article.updated_at || article.updatedAt || article.date);

    const articleSchema: any = {
        '@type': isBlog ? 'BlogPosting' : 'TechArticle',
        headline: article.title,
        description: article.summary || article.excerpt || '',
        image: [imageUrl],
        url: `https://x-zone.ma${canonicalPath}`,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://x-zone.ma${canonicalPath}`,
        },
        author: isBlog
            ? {
                    '@type': 'Person',
                    name: article.author || 'X-Zone',
                }
            : undefined,
        publisher: {
            '@type': 'Organization',
            name: 'X-Zone Technologie',
            logo: {
                '@type': 'ImageObject',
                url: 'https://x-zone.ma/images/logo.png',
            },
        },
        datePublished,
        dateModified,
    };
    Object.keys(articleSchema).forEach((k) => articleSchema[k] == null && delete articleSchema[k]);

    const breadcrumbSchema = {
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Accueil',
                item: 'https://x-zone.ma/',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: isBlog ? 'Actualités' : 'Guides',
                item: isBlog ? 'https://x-zone.ma/blog' : 'https://x-zone.ma/knowledge',
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: article.title,
                item: `https://x-zone.ma${canonicalPath}`,
            },
        ],
    };

  return (
    <div className="bg-white min-h-screen">
      <SEO 
        title={article.title} 
        description={article.summary || article.excerpt || ""} 
                                image={imageUrl}
        type="article"
                canonicalPath={canonicalPath}
                schema={[articleSchema, breadcrumbSchema]}
      />

      {/* Hero Header */}
      <div className="relative h-[400px] w-full overflow-hidden">
                <img 
                        src={article.image || '/images/technology.avif'} 
                        alt={article.title} 
                        className="w-full h-full object-cover"
                />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 text-white/90 text-sm mb-4">
                    {isBlog ? (
                        <>
                            <span className="bg-corporate-red px-3 py-1 rounded-full font-bold uppercase text-xs">{article.category}</span>
                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {article.date}</span>
                        </>
                    ) : (
                        <>
                            <span className="bg-green-600 px-3 py-1 rounded-full font-bold uppercase text-xs">Guide Technique</span>
                            <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {article.readingTime} de lecture</span>
                        </>
                    )}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white font-heading leading-tight mb-4">
                    {article.title}
                </h1>
                {isBlog && (
                    <div className="flex items-center text-white/80">
                        <User className="w-5 h-5 mr-2" />
                        <span className="font-medium">Par {article.author}</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
            
            {/* Breadcrumb & Share */}
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                <Link to={isBlog ? "/blog" : "/knowledge"} className="text-gray-500 hover:text-corporate-blue flex items-center font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour aux {isBlog ? "Actualités" : "Guides"}
                </Link>
                
                {/* Integrated ShareButtons Component */}
                <ShareButtons title={article.title} url={window.location.href} />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-corporate-blue mb-10 italic text-gray-700 text-lg leading-relaxed">
                {article.summary || article.excerpt}
            </div>

            {/* Content Body */}
            <div 
                className="prose prose-lg max-w-none text-gray-800 prose-headings:font-heading prose-headings:text-corporate-blue prose-a:text-corporate-red prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: article.content }} 
            />

            {/* Tags / CTA */}
            <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Sujets associés :</h3>
                <div className="flex flex-wrap gap-2 mb-8">
                    {isBlog ? (
                                                <>
                                                    <span className="bg-blue-50 text-corporate-blue px-3 py-1 rounded-full text-sm font-medium flex items-center"><Tag className="w-3 h-3 mr-1" /> {article.category}</span>
                                                    {Array.isArray(article.topics) && article.topics.map((t: string) => (
                                                        <span key={t} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">{t}</span>
                                                    ))}
                                                </>
                    ) : (
                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center"><Tag className="w-3 h-3 mr-1" /> Technique</span>
                    )}
                </div>

                                {isBlog && Array.isArray(article.sources) && article.sources.length > 0 && (
                                    <div className="mb-10">
                                        <h3 className="font-bold text-gray-900 mb-3">Sources :</h3>
                                        <ul className="list-disc list-inside text-gray-700">
                                            {article.sources.map((s: any, idx: number) => (
                                                <li key={idx}>
                                                    {s?.url ? (
                                                        <a
                                                            className="text-corporate-red hover:underline break-all overflow-wrap break-word"
                                                            style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
                                                            href={s.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
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

                <div className="bg-corporate-blue rounded-xl p-8 text-center text-white">
                    <h3 className="text-2xl font-bold mb-4">Besoin d'accompagnement sur ce sujet ?</h3>
                    <p className="mb-6 text-blue-100">Nos experts X-Zone sont disponibles pour auditer votre infrastructure.</p>
                    <Link to="/contact">
                        <Button variant="white">Contacter un expert</Button>
                    </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
