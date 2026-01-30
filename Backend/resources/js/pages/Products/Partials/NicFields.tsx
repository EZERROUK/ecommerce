import React from 'react';

/* ---------- Typage aligné sur la table network_cards -------------- */
export interface NicData {
    interface: string; // PCIe…
    speed: number; // Gbps
    ports: number;
    connector_type: string; // RJ-45, SFP+
    chipset?: string; // facultatif
}

interface Props {
    data: NicData;
    setData: <K extends keyof NicData>(f: K, v: NicData[K]) => void;
    errors?: Partial<Record<keyof NicData, string>>;
}

const NicFields: React.FC<Props> = ({ data, setData, errors = {} }) => (
    <div className="space-y-6">
        <div className="mb-4 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-red-500">
                <div className="h-2 w-2 rounded-full bg-white"></div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Spécifications Carte Réseau</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                    ['Interface', 'interface', 'text'],
                    ['Débit (Gbps)', 'speed', 'number', 1],
                    ['Nombre ports', 'ports', 'number', 1],
                    ['Connecteur', 'connector_type', 'text'],
                    ['Chipset', 'chipset', 'text'],
                ].map(([label, key, type, step]) => (
                    <div key={key as string}>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
                        <input
                            type={type as string}
                            step={step as number | undefined}
                            min={type === 'number' ? 0 : undefined}
                            value={(data as any)[key as string] ?? ''}
                            onChange={(e) => setData(key as keyof NicData, type === 'number' ? Number(e.target.value) : e.target.value)}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                        {errors[key as keyof NicData] && (
                            <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[key as keyof NicData]}</div>
                        )}
                    </div>
                ))}
            </div>

            {/* Info section */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="mb-1 font-medium">Conseils pour les cartes réseau :</p>
                    <ul className="space-y-1 text-xs">
                        <li>• Vérifiez la compatibilité avec votre slot PCIe</li>
                        <li>• Le débit dépend de votre infrastructure réseau</li>
                        <li>• SFP+ permet l'utilisation de modules optiques</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

export default NicFields;
