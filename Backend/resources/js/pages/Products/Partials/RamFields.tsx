/* ------------------------------------------------------------------
   RamFields.tsx  –  Formulaire limité selon la migration `rams`
   ------------------------------------------------------------------
   - type, form_factor : VARCHAR(10)  → maxLength={10}
   - capacity, speed   : UNSIGNED SMALLINT (0-65535)
   - voltage           : DECIMAL(3,2)  (0.00-9.99)  → step 0.01, max 9.99
   - module_count      : TINYINT (0-255)
------------------------------------------------------------------- */

import React from 'react';

export interface RamData {
    type: string;
    form_factor: string;
    capacity: number;
    speed: number;
    voltage: string;
    ecc: boolean;
    buffered: boolean;
    rank?: string;
    module_count: number;
}

interface Props {
    data: RamData;
    setData: <K extends keyof RamData>(field: K, value: RamData[K]) => void;
    errors?: Partial<Record<keyof RamData, string>>;
}

export const RamFields: React.FC<Props> = ({ data, setData, errors = {} }) => (
    <div className="space-y-6">
        <div className="mb-4 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-red-500">
                <div className="h-2 w-3 rounded-sm bg-white"></div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Spécifications Mémoire RAM</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Type (10 car. max) ------------------------------------------------ */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Type <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        maxLength={10}
                        placeholder="DDR4"
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.type && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.type}</div>}
                </div>

                {/* Form-factor (DIMM, SO-DIMM…) ------------------------------------- */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Form-factor <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        maxLength={10}
                        placeholder="DIMM"
                        value={data.form_factor}
                        onChange={(e) => setData('form_factor', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.form_factor && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.form_factor}</div>}
                </div>

                {/* Capacity --------------------------------------------------------- */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Capacité (GB) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={65535}
                        value={data.capacity}
                        onChange={(e) => setData('capacity', Number(e.target.value))}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.capacity && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.capacity}</div>}
                </div>

                {/* Speed ------------------------------------------------------------ */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Fréquence (MHz) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={65535}
                        value={data.speed}
                        onChange={(e) => setData('speed', Number(e.target.value))}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.speed && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.speed}</div>}
                </div>

                {/* Voltage ---------------------------------------------------------- */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tension (V) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step={0.01}
                        min={0}
                        max={9.99}
                        placeholder="1.20"
                        value={data.voltage}
                        onChange={(e) => setData('voltage', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.voltage && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.voltage}</div>}
                </div>

                {/* Module count ----------------------------------------------------- */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Nb modules <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={255}
                        value={data.module_count}
                        onChange={(e) => setData('module_count', Number(e.target.value))}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.module_count && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.module_count}</div>}
                </div>

                {/* ECC -------------------------------------------------------------- */}
                <div className="flex items-center">
                    <input
                        id="ram-ecc"
                        type="checkbox"
                        checked={data.ecc}
                        onChange={(e) => setData('ecc', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 dark:border-slate-600"
                    />
                    <label htmlFor="ram-ecc" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                        ECC
                    </label>
                </div>

                {/* Buffered --------------------------------------------------------- */}
                <div className="flex items-center">
                    <input
                        id="ram-buffered"
                        type="checkbox"
                        checked={data.buffered}
                        onChange={(e) => setData('buffered', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 dark:border-slate-600"
                    />
                    <label htmlFor="ram-buffered" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                        Buffered
                    </label>
                </div>

                {/* Rank ------------------------------------------------------------- */}
                <div className="col-span-1 md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Rank</label>
                    <input
                        type="text"
                        maxLength={20}
                        value={data.rank ?? ''}
                        onChange={(e) => setData('rank', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.rank && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.rank}</div>}
                </div>
            </div>

            {/* Info section */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="mb-1 font-medium">Conseils pour la mémoire RAM :</p>
                    <ul className="space-y-1 text-xs">
                        <li>• Vérifiez la compatibilité avec votre carte-mère</li>
                        <li>• Plus la fréquence est élevée, meilleures sont les performances</li>
                        <li>• ECC recommandé pour les serveurs critiques</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);
// }
