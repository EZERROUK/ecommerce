
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { COMPANY_INFO } from '../siteConfig';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'product' | 'service' | 'profile';
  schema?: object | object[]; // Support single or array of schemas
  keywords?: string[];
  canonicalPath?: string;
  locale?: string; // e.g. fr_MA
  alternates?: Array<{ hrefLang: string; href: string }>; // hreflang
  robots?: string;
  noIndex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  image = 'https://x-zone.ma/og-default.jpg', 
  type = 'website',
  schema,
  keywords,
  canonicalPath,
  locale = 'fr_MA',
  alternates,
  robots,
  noIndex
}) => {
  const location = useLocation();
  const siteName = COMPANY_INFO.name;

  const getSiteUrl = () => {
    const envUrl = (import.meta as any)?.env?.VITE_SITE_URL as string | undefined;
    const base = (envUrl && String(envUrl).trim()) || 'https://x-zone.ma';
    return base.replace(/\/$/, '');
  };

  const normalizePath = (path: string) => {
    if (!path) return '/';
    return path.startsWith('/') ? path : `/${path}`;
  };

  const toAbsoluteUrl = (url: string) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    const siteUrl = getSiteUrl();
    return `${siteUrl}${normalizePath(url)}`;
  };

  const canonicalUrl = (() => {
    const siteUrl = getSiteUrl();
    const path = normalizePath(canonicalPath || location.pathname);
    return `${siteUrl}${path}`;
  })();

  const resolvedImage = toAbsoluteUrl(image);

  const resolvedRobots = (() => {
    if (robots && robots.trim()) return robots;
    if (noIndex) return 'noindex, nofollow, noarchive, max-image-preview:large';
    return 'index, follow, max-image-preview:large';
  })();

  const ensureMeta = (selector: string, attrs: Record<string, string>) => {
    let element = document.querySelector(selector) as HTMLElement | null;
    if (!element) {
      element = document.createElement('meta');
      Object.entries(attrs).forEach(([k, v]) => element!.setAttribute(k, v));
      document.head.appendChild(element);
      return;
    }
    Object.entries(attrs).forEach(([k, v]) => element!.setAttribute(k, v));
  };

  const ensureLink = (id: string, rel: string, href: string, extra?: Record<string, string>) => {
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = href;
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => link!.setAttribute(k, v));
    }
  };

  const removeLinksByPrefix = (prefix: string) => {
    document.querySelectorAll(`link[id^="${prefix}"]`).forEach((el) => el.remove());
  };

  const normalizeSchemas = (pageSchema: object | object[] | undefined) => {
    const siteUrl = getSiteUrl();
    const isoLang = locale.replace('_', '-');

    const logoUrl = toAbsoluteUrl('/images/logo.png');

    const baseOrg = {
      '@type': 'Organization',
      '@id': `${siteUrl}#organization`,
      name: siteName,
      url: siteUrl,
      email: COMPANY_INFO.email,
      telephone: COMPANY_INFO.phone,
      sameAs: [COMPANY_INFO.social.linkedin, COMPANY_INFO.social.facebook, COMPANY_INFO.social.instagram].filter(
        (x) => x && x !== '#',
      ),
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: COMPANY_INFO.address,
        addressLocality: 'Casablanca',
        addressCountry: 'MA',
      },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'sales',
          telephone: COMPANY_INFO.phone,
          email: COMPANY_INFO.email,
          areaServed: 'MA',
          availableLanguage: [isoLang, 'fr'],
        },
      ],
    };

    const webSite = {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      url: siteUrl,
      name: siteName,
      inLanguage: isoLang,
      publisher: { '@id': `${siteUrl}#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    const webPage = {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: title,
      description,
      isPartOf: { '@id': `${siteUrl}#website` },
      inLanguage: isoLang,
    };

    const nodes = [webSite, baseOrg, webPage, ...(Array.isArray(pageSchema) ? pageSchema : pageSchema ? [pageSchema] : [])];
    return nodes;
  };

  useEffect(() => {
    // 1. Basic Meta Tags
    document.title = `${title} | ${siteName}`;

    ensureMeta('meta[name="description"]', { name: 'description', content: description });
    ensureMeta('meta[name="keywords"]', {
      name: 'keywords',
      content:
        keywords?.join(', ') ||
        'informatique maroc, matériel it casablanca, maintenance informatique, serveurs, réseaux, location pc',
    });
    ensureMeta('meta[name="author"]', { name: 'author', content: 'Global Glimpse SARL' });
    ensureMeta('meta[name="robots"]', { name: 'robots', content: resolvedRobots });

    // Open Graph
    ensureMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    ensureMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    ensureMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    ensureMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    ensureMeta('meta[property="og:image"]', { property: 'og:image', content: resolvedImage });
    ensureMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: title });
    ensureMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: siteName });
    ensureMeta('meta[property="og:locale"]', { property: 'og:locale', content: locale });

    // Twitter
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: resolvedImage });
    ensureMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt', content: title });

    // Canonical
    ensureLink('seo-canonical', 'canonical', canonicalUrl);

    // hreflang alternates (cleanup + re-add)
    removeLinksByPrefix('seo-hreflang-');
    if (Array.isArray(alternates) && alternates.length > 0) {
      alternates.forEach((alt) => {
        if (!alt?.href || !alt?.hrefLang) return;
        const id = `seo-hreflang-${alt.hrefLang}`;
        ensureLink(id, 'alternate', alt.href, { hreflang: alt.hrefLang });
      });
    }

    // JSON-LD
    const scriptId = 'json-ld-schema';
    const schemas = normalizeSchemas(schema);
    const graph = {
      '@context': 'https://schema.org',
      '@graph': schemas.map((node: any) => {
        if (node && typeof node === 'object' && node['@context']) {
          const { ['@context']: _ctx, ...rest } = node;
          return rest;
        }
        return node;
      }),
    };

    let scriptSchema = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptSchema) {
      scriptSchema = document.createElement('script');
      scriptSchema.id = scriptId;
      scriptSchema.type = 'application/ld+json';
      document.head.appendChild(scriptSchema);
    }
    scriptSchema.textContent = JSON.stringify(graph);

    return () => {
      // No aggressive cleanup: tags are updated in-place on next render.
    };
  }, [
    title,
    description,
    resolvedImage,
    type,
    canonicalUrl,
    schema,
    keywords,
    resolvedRobots,
    locale,
    alternates,
  ]);

  return null;
};
