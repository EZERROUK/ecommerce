import React from 'react';

export interface SoftwareData {
    name: string;
    version?: string;
    os_support?: string;
    type: string;
    license_included: boolean;
    download_link?: string;
    activation_instructions?: string;
}

interface Props {
    data: SoftwareData;
    setData: (field: keyof SoftwareData, value: any) => void;
    errors?: Partial<Record<keyof SoftwareData, string>>;
}

const SoftwareFields: React.FC<Props> = ({ data, setData, errors = {} }) => (
    <div className="space-y-6">
        <div className="mb-4 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-red-500">
                <div className="h-3 w-2 rounded-sm bg-white"></div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Spécifications Logiciel</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                    ['Nom', 'name', 'text'],
                    ['Version', 'version', 'text'],
                    ['OS supportés', 'os_support', 'text'],
                    ['Type', 'type', 'text'],
                ].map(([label, key, type]) => (
                    <div key={key as string} className="col-span-1">
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            {label} {key === 'name' || key === 'type' ? <span className="text-red-500">*</span> : ''}
                        </label>
                        <input
                            type={type}
                            value={(data as any)[key as string] ?? ''}
                            onChange={(e) => setData(key as keyof SoftwareData, e.target.value)}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                        {errors[key as keyof SoftwareData] && (
                            <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[key as keyof SoftwareData]}</div>
                        )}
                    </div>
                ))}

                {/* Lien de téléchargement avec préfixe */}
                <div className="col-span-1 md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Lien de téléchargement</label>
                    <div className="flex w-full">
                        <span className="inline-flex items-center rounded-l border border-r-0 border-slate-300 bg-slate-100 px-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            https://
                        </span>
                        <input
                            type="text"
                            value={(data.download_link ?? '').replace(/^https?:\/\//, '')}
                            onChange={(e) => setData('download_link', 'https://' + e.target.value)}
                            className="w-full rounded-r border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                    {errors.download_link && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.download_link}</div>}
                </div>

                {/* Instructions d'activation */}
                <div className="col-span-1 md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Instructions d'activation</label>
                    <textarea
                        value={data.activation_instructions ?? ''}
                        onChange={(e) => setData('activation_instructions', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        rows={4}
                    />
                    {errors.activation_instructions && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.activation_instructions}</div>
                    )}
                </div>

                {/* Licence incluse */}
                <div className="col-span-1 flex items-center gap-2 md:col-span-2">
                    <input
                        type="checkbox"
                        checked={data.license_included}
                        onChange={(e) => setData('license_included', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 dark:border-slate-600"
                    />
                    <label className="text-sm text-slate-700 dark:text-slate-300">Licence incluse</label>
                    {errors.license_included && <div className="ml-2 text-xs text-red-600 dark:text-red-400">{errors.license_included}</div>}
                </div>
            </div>

            {/* Info section */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="mb-1 font-medium">Conseils pour les logiciels :</p>
                    <ul className="space-y-1 text-xs">
                        <li>• Vérifiez la compatibilité avec votre système d'exploitation</li>
                        <li>• Assurez-vous d'avoir les droits de redistribution</li>
                        <li>• Fournissez des instructions claires pour l'activation</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

export default SoftwareFields;
