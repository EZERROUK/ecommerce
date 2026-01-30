// resources/js/pages/Products/Partials/CompatibilityFields.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

export type CompatibilityEntry = {
    compatible_with_id: string;
    direction?: 'bidirectional' | 'uni';
    note?: string;
};

export default function CompatibilityFields({
    compatibilities,
    allProducts,
    onChange,
}: {
    compatibilities: CompatibilityEntry[];
    allProducts: { id: string; name: string }[];
    onChange: (list: CompatibilityEntry[]) => void;
}) {
    const usedIds = useMemo(() => new Set(compatibilities.map((c) => c.compatible_with_id).filter(Boolean)), [compatibilities]);
    const byId = useMemo(() => Object.fromEntries(allProducts.map((p) => [p.id, p.name])), [allProducts]);

    const addRow = () => onChange([...compatibilities, { compatible_with_id: '', direction: 'bidirectional', note: '' }]);

    const updateRow = (idx: number, patch: Partial<CompatibilityEntry>) => {
        const next = compatibilities.map((c, i) => (i === idx ? { ...c, ...patch } : c));
        onChange(next);
    };

    const removeRow = (idx: number) => {
        const next = compatibilities.filter((_, i) => i !== idx);
        onChange(next);
    };

    return (
        <div className="space-y-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
                Liez ce produit à des <b>machines</b> (PC, laptop, serveur, …) compatibles. Le sens
                <em> “bidirectionnel”</em> signifie que la compatibilité est considérée valable dans les deux sens.
            </div>

            <div className="space-y-3">
                {compatibilities.length === 0 && (
                    <div className="text-sm text-slate-500 italic dark:text-slate-400">
                        Aucune compatibilité. Cliquez sur “Ajouter une compatibilité”.
                    </div>
                )}

                {compatibilities.map((row, idx) => {
                    const duplicate =
                        row.compatible_with_id && compatibilities.filter((c) => c.compatible_with_id === row.compatible_with_id).length > 1;

                    return (
                        <div
                            key={idx}
                            className="rounded-lg border border-slate-200 bg-white/70 p-4 backdrop-blur-md dark:border-slate-700 dark:bg-white/5"
                        >
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                {/* Produit */}
                                <div className="md:col-span-5">
                                    <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">Produit (machine)</div>
                                    <Select value={row.compatible_with_id} onValueChange={(v) => updateRow(idx, { compatible_with_id: v })}>
                                        <SelectTrigger className={`w-full ${duplicate ? 'border-red-400' : ''}`}>
                                            <SelectValue placeholder="Sélectionnez un produit…" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-72">
                                            {allProducts.map((p) => (
                                                <SelectItem
                                                    key={p.id}
                                                    value={p.id}
                                                    disabled={p.id === row.compatible_with_id ? false : usedIds.has(p.id)}
                                                >
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {duplicate && <div className="mt-1 text-xs text-red-600">Ce produit est sélectionné en double.</div>}
                                </div>

                                {/* Sens */}
                                <div className="md:col-span-3">
                                    <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">Sens</div>
                                    <Select
                                        value={row.direction || 'bidirectional'}
                                        onValueChange={(v) => updateRow(idx, { direction: v as 'bidirectional' | 'uni' })}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Sens" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bidirectional">
                                                <span className="inline-flex items-center gap-2">
                                                    <ArrowLeftRight className="h-4 w-4" /> Bidirectionnel
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="uni">
                                                <span className="inline-flex items-center gap-2">
                                                    <ArrowRight className="h-4 w-4" /> Unidirectionnel
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Note */}
                                <div className="md:col-span-3">
                                    <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">Note</div>
                                    <Input
                                        value={row.note || ''}
                                        onChange={(e) => updateRow(idx, { note: e.target.value })}
                                        placeholder="Optionnel (ex: révision BIOS, slots, …)"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex md:col-span-1 md:justify-end">
                                    <Button type="button" variant="destructive" onClick={() => removeRow(idx)} className="mt-6 md:mt-0">
                                        <Trash2 className="mr-2 h-4 w-4" /> Retirer
                                    </Button>
                                </div>
                            </div>

                            {row.compatible_with_id && (
                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    Lié à : <b>{byId[row.compatible_with_id]}</b>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Button type="button" onClick={addRow} className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2 h-4 w-4" /> Ajouter une compatibilité
            </Button>
        </div>
    );
}
