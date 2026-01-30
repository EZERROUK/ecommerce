import { Input } from '@/components/ui/input';
import { Cpu } from 'lucide-react';
import React from 'react';

export interface CpuData {
    model: string;
    socket: string;
    cores: number;
    threads: number;
    base_clock: number;
    turbo_clock?: number | null;
    lithography?: number | null;
    tdp?: number | null;
    cache_l1?: number | null;
    cache_l2?: number | null;
    cache_l3?: number | null;
    hyperthreading: boolean;
    integrated_graphics: boolean;
}

interface Props {
    data: CpuData;
    setData: <K extends keyof CpuData>(field: K, value: CpuData[K]) => void;
    errors?: Partial<Record<keyof CpuData, string>>;
}

const CpuFields: React.FC<Props> = ({ data, setData, errors = {} }) => (
    <div className="space-y-6">
        <div className="mb-4 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Spécifications Processeur</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Modèle */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Modèle <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        value={data.model}
                        onChange={(e) => setData('model', e.target.value)}
                        placeholder="Intel Core i7-12700K"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.model && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.model}</div>}
                </div>

                {/* Socket */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Socket <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        value={data.socket}
                        onChange={(e) => setData('socket', e.target.value)}
                        placeholder="LGA1700"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.socket && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.socket}</div>}
                </div>

                {/* Cœurs */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Cœurs <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="number"
                        min={1}
                        value={data.cores}
                        onChange={(e) => setData('cores', Number(e.target.value))}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.cores && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.cores}</div>}
                </div>

                {/* Threads */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Threads <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="number"
                        min={1}
                        value={data.threads}
                        onChange={(e) => setData('threads', Number(e.target.value))}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.threads && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.threads}</div>}
                </div>

                {/* Fréquence base */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Fréquence base (GHz) <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="number"
                        step={0.01}
                        min={0}
                        value={data.base_clock}
                        onChange={(e) => setData('base_clock', Number(e.target.value))}
                        placeholder="3.60"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.base_clock && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.base_clock}</div>}
                </div>

                {/* Boost */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Boost (GHz)</label>
                    <Input
                        type="number"
                        step={0.01}
                        min={0}
                        value={data.turbo_clock ?? ''}
                        onChange={(e) => setData('turbo_clock', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="5.00"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.turbo_clock && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.turbo_clock}</div>}
                </div>

                {/* Lithographie */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Lithographie (nm)</label>
                    <Input
                        type="number"
                        min={0}
                        value={data.lithography ?? ''}
                        onChange={(e) => setData('lithography', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="10"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.lithography && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.lithography}</div>}
                </div>

                {/* TDP */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">TDP (W)</label>
                    <Input
                        type="number"
                        min={0}
                        value={data.tdp ?? ''}
                        onChange={(e) => setData('tdp', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="125"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.tdp && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.tdp}</div>}
                </div>

                {/* Cache L1 */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cache L1 (KB)</label>
                    <Input
                        type="number"
                        min={0}
                        value={data.cache_l1 ?? ''}
                        onChange={(e) => setData('cache_l1', e.target.value === '' ? null : Number(e.target.value))}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.cache_l1 && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.cache_l1}</div>}
                </div>

                {/* Cache L2 */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cache L2 (KB)</label>
                    <Input
                        type="number"
                        min={0}
                        value={data.cache_l2 ?? ''}
                        onChange={(e) => setData('cache_l2', e.target.value === '' ? null : Number(e.target.value))}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.cache_l2 && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.cache_l2}</div>}
                </div>

                {/* Cache L3 */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cache L3 (MB)</label>
                    <Input
                        type="number"
                        min={0}
                        value={data.cache_l3 ?? ''}
                        onChange={(e) => setData('cache_l3', e.target.value === '' ? null : Number(e.target.value))}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.cache_l3 && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.cache_l3}</div>}
                </div>
            </div>

            {/* Checkboxes */}
            <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-2">
                    <input
                        id="integrated_graphics"
                        type="checkbox"
                        checked={data.integrated_graphics}
                        onChange={(e) => setData('integrated_graphics', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 bg-white text-red-600 focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800"
                    />
                    <label htmlFor="integrated_graphics" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Processeur avec iGPU intégré
                    </label>
                    {errors.integrated_graphics && <div className="text-xs text-red-600 dark:text-red-400">{errors.integrated_graphics}</div>}
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        id="hyperthreading"
                        type="checkbox"
                        checked={data.hyperthreading}
                        onChange={(e) => setData('hyperthreading', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 bg-white text-red-600 focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800"
                    />
                    <label htmlFor="hyperthreading" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Hyper-Threading activé
                    </label>
                    {errors.hyperthreading && <div className="text-xs text-red-600 dark:text-red-400">{errors.hyperthreading}</div>}
                </div>
            </div>

            {/* Info section */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="mb-1 font-medium">Conseils pour les processeurs :</p>
                    <ul className="space-y-1 text-xs">
                        <li>• Vérifiez la compatibilité du socket avec la carte mère</li>
                        <li>• Le TDP influence le choix du refroidissement</li>
                        <li>• Les fréquences sont exprimées en GHz</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

export default CpuFields;
