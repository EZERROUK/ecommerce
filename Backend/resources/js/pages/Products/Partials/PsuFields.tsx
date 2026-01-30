import React from 'react';

export interface PsuData {
    power: number;
    efficiency_rating: string;
    modular: boolean; // ← booléen
    form_factor: string;
    connector_types?: string;
    protection_features?: string;
}

interface Props {
    data: PsuData;
    setData: <K extends keyof PsuData>(f: K, v: PsuData[K]) => void;
    errors?: Partial<Record<keyof PsuData, string>>;
}

const PsuFields: React.FC<Props> = ({ data, setData, errors = {} }) => (
    <div className="space-y-6">
        <div className="mb-4 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-red-500">
                <div className="h-1 w-3 rounded-full bg-white"></div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Spécifications Alimentation</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Puissance */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Puissance (W) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={data.power}
                        onChange={(e) => setData('power', Number(e.target.value))}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.power && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.power}</div>}
                </div>

                {/* Rendement 80+ */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Rendement 80+ <span className="text-red-500">*</span>
                    </label>
                    <input
                        value={data.efficiency_rating}
                        onChange={(e) => setData('efficiency_rating', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.efficiency_rating && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.efficiency_rating}</div>}
                </div>

                {/* Format */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Form-factor <span className="text-red-500">*</span>
                    </label>
                    <input
                        value={data.form_factor}
                        onChange={(e) => setData('form_factor', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.form_factor && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.form_factor}</div>}
                </div>

                {/* Modulaire */}
                <div className="flex items-center">
                    <input
                        id="psu_modular"
                        type="checkbox"
                        checked={data.modular}
                        onChange={(e) => setData('modular', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 dark:border-slate-600"
                    />
                    <label htmlFor="psu_modular" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                        Câbles modulaires
                    </label>
                    {errors.modular && <div className="ml-2 text-xs text-red-600 dark:text-red-400">{errors.modular}</div>}
                </div>

                {/* Connecteurs & protections (ligne entière) */}
                <div className="col-span-1 md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Types de connecteurs</label>
                    <input
                        value={data.connector_types ?? ''}
                        onChange={(e) => setData('connector_types', e.target.value || undefined)}
                        placeholder="Ex. 2×CPU 8 pin · 3×PCI-E 8 pin"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.connector_types && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.connector_types}</div>}
                </div>

                <div className="col-span-1 md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Protections (OVP, OCP…)</label>
                    <input
                        value={data.protection_features ?? ''}
                        onChange={(e) => setData('protection_features', e.target.value || undefined)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.protection_features && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.protection_features}</div>}
                </div>
            </div>

            {/* Info section */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="mb-1 font-medium">Conseils pour les alimentations :</p>
                    <ul className="space-y-1 text-xs">
                        <li>• Calculez la puissance nécessaire avec une marge de sécurité</li>
                        <li>• Une certification 80+ garantit une meilleure efficacité</li>
                        <li>• Les câbles modulaires facilitent la gestion des câbles</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

export default PsuFields;
// }
