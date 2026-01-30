
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Rss } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchBlogPosts } from '../utils/apiBlog';
import type { ApiBlogPost } from '../utils/apiTypes';
import { LazyImage } from '../components/LazyImage';
import { prefetchRoute } from '../utils/routePrefetch';

export const Blog: React.FC = () => {
  const { t } = useLanguage();

  const [posts, setPosts] = useState<ApiBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchBlogPosts({ perPage: 50 });
        if (!mounted) return;
        setPosts(res.data ?? []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Erreur lors du chargement des articles.');
        setPosts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const blogSchema = {
    '@type': 'CollectionPage',
    name: t('blogPage.title'),
    description: t('blogPage.subtitle'),
    url: 'https://x-zone.ma/blog',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts
        .filter((p) => p?.slug && p?.title)
        .slice(0, 50)
        .map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `https://x-zone.ma/blog/${p.slug}`,
          name: p.title,
        })),
    },
  };

  return (
    <div className="bg-white min-h-screen">
      <SEO
        title={t('blogPage.title')}
        description={t('blogPage.subtitle')}
        canonicalPath="/blog"
        schema={blogSchema}
      />

      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-corporate-blue font-heading mb-4">{t('blogPage.title')}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('blogPage.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {loading && (
          <div className="text-center text-gray-600">Chargement des articles…</div>
        )}

        {!loading && error && (
          <div className="text-center text-red-600">{error}</div>
        )}
        
        {/* Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article key={post.id} className="flex flex-col bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100">
              <Link
                to={`/blog/${post.slug}`}
                className="h-48 overflow-hidden block"
                onMouseEnter={() => prefetchRoute(`/blog/${post.slug}`)}
                onFocus={() => prefetchRoute(`/blog/${post.slug}`)}
              >
                {post.image ? (
                  <LazyImage
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      width={1200}
                      height={630}
                      loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    image
                  </div>
                )}
              </Link>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center text-xs text-gray-500 mb-3 space-x-4">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {post.date || ''}</span>
                    <span className="text-corporate-red font-semibold uppercase">{post.category}</span>
                </div>
                <Link
                  to={`/blog/${post.slug}`}
                  onMouseEnter={() => prefetchRoute(`/blog/${post.slug}`)}
                  onFocus={() => prefetchRoute(`/blog/${post.slug}`)}
                >
                    <h3 className="text-xl font-bold text-gray-900 mb-3 font-heading leading-tight hover:text-corporate-blue transition-colors">{post.title}</h3>
                </Link>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.summary || post.excerpt || ''}</p>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                        <User className="w-3 h-3 mr-1" /> {post.author || ''}
                    </div>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-corporate-blue font-bold text-sm flex items-center hover:text-corporate-red"
                      onMouseEnter={() => prefetchRoute(`/blog/${post.slug}`)}
                      onFocus={() => prefetchRoute(`/blog/${post.slug}`)}
                    >
                        {t('blogPage.readArticle')} <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
              </div>
            </article>
          ))}
          </div>
        )}

        {/* Newsletter Box */}
        <div className="mt-20 bg-corporate-blue rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
                <Rss className="w-12 h-12 mx-auto mb-4 text-corporate-red" />
                <h2 className="text-2xl font-bold mb-4 font-heading">{t('blogPage.newsletter.title')}</h2>
                <p className="text-blue-100 mb-8">{t('blogPage.newsletter.text')}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <input type="email" placeholder={t('blogPage.newsletter.placeholder')} className="px-6 py-3 rounded-md text-gray-900 w-full sm:w-auto focus:outline-none" />
                    <button className="px-8 py-3 bg-corporate-red rounded-md font-bold hover:bg-red-700 transition-colors">{t('blogPage.newsletter.button')}</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
