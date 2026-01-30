export function slugify(input: string): string {
    return input
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 200);
}

export function parseTopics(topicsText: string): string[] {
    return topicsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

export type SourceItem = { label?: string | null; url?: string | null };

export function parseSources(sourcesText: string): SourceItem[] {
    const lines = sourcesText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

    const items: SourceItem[] = [];

    for (const line of lines) {
        if (line.includes('|')) {
            const [labelRaw, urlRaw] = line.split('|', 2);
            const label = labelRaw?.trim() || null;
            const url = urlRaw?.trim() || null;
            if (url) items.push({ label, url });
        } else {
            items.push({ label: null, url: line });
        }
    }

    return items;
}

export function sourcesToText(sources: any[]): string {
    if (!Array.isArray(sources)) return '';
    return sources
        .map((s) => {
            const label = (s?.label ?? '').toString().trim();
            const url = (s?.url ?? '').toString().trim();
            if (!url) return '';
            return label ? `${label}|${url}` : url;
        })
        .filter(Boolean)
        .join('\n');
}
