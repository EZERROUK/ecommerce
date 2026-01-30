<?php

declare(strict_types=1);

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

final class BlogContentSanitizer
{
    /**
     * Assainit le HTML provenant de l'éditeur (TipTap) pour limiter les risques XSS.
     *
     * Notes:
     * - on conserve une allowlist simple compatible StarterKit
     * - on supprime les attributs dangereux (on*) et on limite les URLs des liens
     */
    public static function sanitize(?string $html): ?string
    {
        $html = is_string($html) ? trim($html) : '';
        if ($html === '') {
            return null;
        }

        $allowedTags = [
            'p', 'br',
            'strong', 'em',
            'ul', 'ol', 'li',
            'blockquote',
            'h2', 'h3',
            'pre', 'code',
            'a',
            'hr',
        ];

        $allowedAttrsByTag = [
            'a' => ['href', 'target', 'rel'],
        ];

        $dom = new DOMDocument('1.0', 'UTF-8');

        // Évite les warnings sur HTML partiel; empêche les accès réseau pour entités externes.
        $options = LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NONET;
        @$dom->loadHTML('<?xml encoding="utf-8" ?>' . $html, $options);

        /** @var DOMNode $node */
        foreach (iterator_to_array($dom->childNodes) as $node) {
            self::sanitizeNode($node, $allowedTags, $allowedAttrsByTag);
        }

        $result = $dom->saveHTML();
        $result = is_string($result) ? trim($result) : '';

        return $result !== '' ? $result : null;
    }

    /**
     * @param array<int, string> $allowedTags
     * @param array<string, array<int, string>> $allowedAttrsByTag
     */
    private static function sanitizeNode(DOMNode $node, array $allowedTags, array $allowedAttrsByTag): void
    {
        // Supprimer les commentaires
        if ($node->nodeType === XML_COMMENT_NODE) {
            $node->parentNode?->removeChild($node);
            return;
        }

        // Descendre d'abord dans les enfants (copie car on peut modifier la liste)
        foreach (iterator_to_array($node->childNodes) as $child) {
            self::sanitizeNode($child, $allowedTags, $allowedAttrsByTag);
        }

        if (!($node instanceof DOMElement)) {
            return;
        }

        $tag = strtolower($node->tagName);

        // Si tag interdit: on "unwrap" (remonter les enfants) puis supprimer le node.
        if (!in_array($tag, $allowedTags, true)) {
            $parent = $node->parentNode;
            if ($parent) {
                while ($node->firstChild) {
                    $parent->insertBefore($node->firstChild, $node);
                }
                $parent->removeChild($node);
            }
            return;
        }

        // Nettoyage des attributs
        $allowedAttrs = $allowedAttrsByTag[$tag] ?? [];
        if ($node->hasAttributes()) {
            foreach (iterator_to_array($node->attributes) as $attr) {
                $name = strtolower($attr->nodeName);

                // bloquer les handlers d'events et les attributs non allowlistés
                if (str_starts_with($name, 'on') || (!in_array($name, $allowedAttrs, true))) {
                    $node->removeAttributeNode($attr);
                    continue;
                }

                // sécurité de base sur href
                if ($tag === 'a' && $name === 'href') {
                    $href = trim((string) $attr->nodeValue);
                    if ($href === '' || !self::isSafeUrl($href)) {
                        $node->removeAttribute('href');
                    }
                }

                // target: seulement _blank
                if ($tag === 'a' && $name === 'target') {
                    $target = strtolower(trim((string) $attr->nodeValue));
                    if ($target !== '_blank') {
                        $node->removeAttribute('target');
                    }
                }
            }
        }

        // Forcer rel sûr si target=_blank
        if ($tag === 'a' && $node->getAttribute('target') === '_blank') {
            $node->setAttribute('rel', 'noreferrer noopener');
        }
    }

    private static function isSafeUrl(string $url): bool
    {
        // Autoriser les ancres et chemins relatifs
        if (str_starts_with($url, '#') || str_starts_with($url, '/')) {
            return true;
        }

        $lower = strtolower($url);
        if (str_starts_with($lower, 'javascript:') || str_starts_with($lower, 'data:') || str_starts_with($lower, 'vbscript:')) {
            return false;
        }

        $parts = parse_url($url);
        if (!is_array($parts)) {
            return false;
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        if ($scheme === '') {
            // ex: "www.example.com" — on refuse pour éviter les cas ambigus
            return false;
        }

        return in_array($scheme, ['http', 'https', 'mailto'], true);
    }
}
