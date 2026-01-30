import { Input } from '@/components/ui/input';
import { Monitor } from 'lucide-react';
import React from 'react';

export interface DesktopData {
    cpu: string;
    ram: number;
    graphic_card: string;
    keyboard: string;
    condition: 'new' | 'used' | 'refurbished';
    storage: number;
    storage_type: 'SSD' | 'HDD';
    form_factor?: string;
    internal_drives_count: number;
}

interface Props {
    data: DesktopData;
    setData: <K extends keyof DesktopData>(field: K, value: DesktopData[K]) => void;
    errors?: Partial<Record<keyof DesktopData, string>>;
}

const DesktopFields: React.FC<Props> = ({ data, setData, errors = {} }) => (
    <div className="space-y-6">
        <div className="mb-4 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Spécifications Ordinateur de Bureau</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* CPU */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        CPU <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        value={data.cpu}
                        onChange={(e) => setData('cpu', e.target.value)}
                        placeholder="Intel Core i5, Ryzen 7..."
                        maxLength={100}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.cpu && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.cpu}</div>}
                </div>

                {/* RAM */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        RAM (Go) <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="number"
                        min={1}
                        max={1024}
                        step={1}
                        value={data.ram}
                        onChange={(e) => setData('ram', Number(e.target.value))}
                        placeholder="16"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.ram && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.ram}</div>}
                </div>

                {/* Carte graphique */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Carte graphique</label>
                    <Input
                        type="text"
                        value={data.graphic_card}
                        onChange={(e) => setData('graphic_card', e.target.value)}
                        placeholder="NVIDIA GTX 1660, Radeon RX..."
                        maxLength={100}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.graphic_card && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.graphic_card}</div>}
                </div>

                {/* Clavier */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Clavier</label>
                    <Input
                        type="text"
                        value={data.keyboard}
                        onChange={(e) => setData('keyboard', e.target.value)}
                        placeholder="AZERTY, QWERTY, sans clavier..."
                        maxLength={100}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.keyboard && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.keyboard}</div>}
                </div>

                {/* Stockage */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Stockage (Go) <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="number"
                        min={64}
                        max={8192}
                        step={64}
                        value={data.storage}
                        onChange={(e) => setData('storage', Number(e.target.value))}
                        placeholder="512"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.storage && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.storage}</div>}
                </div>

                {/* Type de stockage */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Type de stockage</label>
                    <select
                        value={data.storage_type}
                        onChange={(e) => setData('storage_type', e.target.value as 'SSD' | 'HDD')}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                        <option value="SSD">SSD</option>
                        <option value="HDD">HDD</option>
                    </select>
                    {errors.storage_type && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.storage_type}</div>}
                </div>

                {/* Form factor */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Facteur de forme</label>
                    <Input
                        type="text"
                        value={data.form_factor ?? ''}
                        onChange={(e) => setData('form_factor', e.target.value)}
                        placeholder="Tower, Mini-ITX..."
                        maxLength={50}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.form_factor && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.form_factor}</div>}
                </div>

                {/* Nombre de disques */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Disques internes</label>
                    <Input
                        type="number"
                        min={1}
                        max={10}
                        step={1}
                        value={data.internal_drives_count}
                        onChange={(e) => setData('internal_drives_count', Number(e.target.value))}
                        placeholder="2"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.internal_drives_count && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.internal_drives_count}</div>
                    )}
                </div>

                {/* État */}
                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        État <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={data.condition}
                        onChange={(e) => setData('condition', e.target.value as 'new' | 'used' | 'refurbished')}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                        <option value="new">Neuf</option>
                        <option value="used">Occasion</option>
                        <option value="refurbished">Reconditionné</option>
                    </select>
                    {errors.condition && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.condition}</div>}
                </div>
            </div>

            {/* Info section */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="mb-1 font-medium">Conseils pour les ordinateurs de bureau :</p>
                    <ul className="space-y-1 text-xs">
                        <li>• Vérifiez la compatibilité entre le CPU et la carte mère</li>
                        <li>• Considérez l'évolutivité des composants</li>
                        <li>• Le facteur de forme détermine la taille du boîtier</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

export default DesktopFields;
// }
