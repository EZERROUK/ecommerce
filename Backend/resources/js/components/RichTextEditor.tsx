import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo, useRef } from 'react';
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Code,
    FileImage,
    Heading1,
    Heading2,
    Heading3,
    Highlighter,
    Italic,
    Link2,
    List,
    ListOrdered,
    Minus,
    Quote,
    Redo,
    RemoveFormatting,
    Strikethrough,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    Table as TableIcon,
    Underline as UnderlineIcon,
    Undo,
} from 'lucide-react';

type Props = {
    value: string;
    onChange: (html: string) => void;
    disabled?: boolean;
    className?: string;
};

export default function RichTextEditor({ value, onChange, disabled, className }: Props) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const fontFamilies = useMemo(
        () => [
            { label: 'Par défaut', value: '' },
            { label: 'Arial', value: 'Arial' },
            { label: 'Georgia', value: 'Georgia' },
            { label: 'Times New Roman', value: 'Times New Roman' },
            { label: 'Verdana', value: 'Verdana' },
            { label: 'Courier New', value: 'Courier New' },
        ],
        [],
    );

    const editor = useEditor({
        editable: !disabled,
        editorProps: {
            attributes: {
                class: 'prose max-w-none focus:outline-none min-h-[260px] px-1 py-1',
                spellcheck: 'true',
            },
        },
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            Highlight,
            TextStyle,
            Color,
            FontFamily,
            Subscript,
            Superscript,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Image.configure({
                inline: false,
                allowBase64: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Placeholder.configure({
                placeholder: "Écris ton article ici…",
            }),
            Link.configure({
                openOnClick: true,
                autolink: true,
                linkOnPaste: true,
                HTMLAttributes: {
                    rel: 'noreferrer noopener',
                    target: '_blank',
                    class: 'text-blue-600 underline',
                },
            }),
        ],
        content: value || '',
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (!editor) return;
        // Synchroniser si une valeur externe est injectée (ex: chargement initial / reset)
        const current = editor.getHTML();
        const next = value || '';
        if (current !== next) {
            editor.commands.setContent(next, { emitUpdate: false });
        }
    }, [editor, value]);

    if (!editor) {
        return (
            <div className={`w-full rounded-md border bg-white p-3 text-sm text-gray-500 dark:bg-neutral-950 ${className || ''}`}>
                Chargement de l’éditeur…
            </div>
        );
    }

    const btn = (active: boolean) =>
        `px-2 py-1 rounded border text-xs font-medium ${
            active
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black dark:border-white'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-neutral-950 dark:text-slate-200 dark:border-neutral-800 dark:hover:bg-neutral-900'
        }`;

    const btnDisabled = (_active: boolean) =>
        `px-2 py-1 rounded border text-xs font-medium opacity-50 cursor-not-allowed bg-white text-slate-700 border-slate-200 dark:bg-neutral-950 dark:text-slate-200 dark:border-neutral-800`;

    const canRun = (run: () => boolean) => {
        try {
            return run();
        } catch {
            return false;
        }
    };

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL du lien :', previousUrl || '');
        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const insertImage = () => {
        const url = window.prompt("URL de l'image (ou laisse vide pour choisir un fichier) :");
        if (url && url.trim()) {
            editor.chain().focus().setImage({ src: url.trim() }).run();
            return;
        }
        fileInputRef.current?.click();
    };

    const onPickImageFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            const src = String(reader.result || '');
            if (!src) return;
            editor.chain().focus().setImage({ src }).run();
        };
        reader.readAsDataURL(file);
    };

    const setTextColor = () => {
        const current = editor.getAttributes('textStyle')?.color as string | undefined;
        const next = window.prompt('Couleur (ex: #111827, #ef4444, red) :', current || '');
        if (next === null) return;
        if (next.trim() === '') {
            editor.chain().focus().unsetColor().run();
            return;
        }
        editor.chain().focus().setColor(next.trim()).run();
    };

    const currentFontFamily = (editor.getAttributes('textStyle')?.fontFamily as string | undefined) ?? '';
    const formatValue = editor.isActive('heading', { level: 1 })
        ? 'h1'
        : editor.isActive('heading', { level: 2 })
          ? 'h2'
          : editor.isActive('heading', { level: 3 })
            ? 'h3'
            : 'p';

    const setFormat = (next: string) => {
        if (next === 'p') editor.chain().focus().setParagraph().run();
        if (next === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
        if (next === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
        if (next === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
    };

    const setFontFamily = (next: string) => {
        if (!next) {
            editor.chain().focus().unsetFontFamily().run();
            return;
        }
        editor.chain().focus().setFontFamily(next).run();
    };

    const insertTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    const iconBtnClass = (active: boolean) =>
        `h-8 w-8 inline-flex items-center justify-center rounded border ${
            active
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black dark:border-white'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-neutral-950 dark:text-slate-200 dark:border-neutral-800 dark:hover:bg-neutral-900'
        }`;

    return (
        <div className={className}>
            <div className="mb-2 rounded-md border bg-white/70 p-2 backdrop-blur dark:bg-neutral-950/60">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                        <select
                            className="h-8 rounded border bg-white px-2 text-xs dark:bg-neutral-950 dark:border-neutral-800"
                            value={formatValue}
                            onChange={(e) => setFormat(e.target.value)}
                        >
                            <option value="p">Texte</option>
                            <option value="h1">Titre 1</option>
                            <option value="h2">Titre 2</option>
                            <option value="h3">Titre 3</option>
                        </select>
                        <select
                            className="h-8 rounded border bg-white px-2 text-xs dark:bg-neutral-950 dark:border-neutral-800"
                            value={currentFontFamily}
                            onChange={(e) => setFontFamily(e.target.value)}
                        >
                            {fontFamilies.map((f) => (
                                <option key={f.label} value={f.value}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-neutral-800" />

                    <div className="flex items-center gap-1">
                        <button type="button" className={iconBtnClass(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Gras">
                            <Bold className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique">
                            <Italic className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Souligné">
                            <UnderlineIcon className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} title="Barré">
                            <Strikethrough className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive('subscript'))} onClick={() => editor.chain().focus().toggleSubscript().run()} title="Indice">
                            <SubscriptIcon className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive('superscript'))} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="Exposant">
                            <SuperscriptIcon className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive('highlight'))} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Surligner">
                            <Highlighter className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-neutral-800" />

                    <div className="flex items-center gap-1">
                        <button type="button" className={iconBtnClass(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Aligner à gauche">
                            <AlignLeft className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centrer">
                            <AlignCenter className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Aligner à droite">
                            <AlignRight className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive({ textAlign: 'justify' }))} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justifier">
                            <AlignJustify className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-neutral-800" />

                    <div className="flex items-center gap-1">
                        <button type="button" className={iconBtnClass(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste">
                            <List className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numérotée">
                            <ListOrdered className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citation">
                            <Quote className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive('code'))} onClick={() => editor.chain().focus().toggleCode().run()} title="Code">
                            <Code className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-neutral-800" />

                    <div className="flex items-center gap-1">
                        <button type="button" className={iconBtnClass(editor.isActive('link'))} onClick={setLink} title="Lien">
                            <Link2 className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(false)} onClick={insertImage} title="Image">
                            <FileImage className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(editor.isActive('table'))} onClick={insertTable} title="Insérer un tableau">
                            <TableIcon className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
                            <Minus className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-neutral-800" />

                    <div className="flex items-center gap-1">
                        <button type="button" className={iconBtnClass(false)} onClick={setTextColor} title="Couleur du texte">
                            <Heading1 className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(false)} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Nettoyer la mise en forme">
                            <RemoveFormatting className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(false)} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler">
                            <Undo className="h-4 w-4" />
                        </button>
                        <button type="button" className={iconBtnClass(false)} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rétablir">
                            <Redo className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onPickImageFile(f);
                        e.target.value = '';
                    }}
                />
            </div>

            <div className="rounded-md border bg-white p-3 ring-0 focus-within:ring-2 focus-within:ring-slate-900/15 dark:bg-neutral-950 dark:focus-within:ring-white/10">
                <EditorContent editor={editor} />
            </div>

            <div className="mt-2 text-xs text-gray-500">Astuce: colle directement du texte, puis mets en forme.</div>
        </div>
    );
}
