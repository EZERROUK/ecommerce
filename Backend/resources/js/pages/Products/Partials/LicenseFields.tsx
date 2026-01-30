import { Input } from '@/components/ui/input';
import { Key } from 'lucide-react';
import React from 'react';

export interface LicenseData {
    software_name: string;
    version?: string | null;
    license_type: string;
    validity_period?: string | null;
    activation_method?: string | null;
    platform?: string | null;
}

type Setter = <K extends keyof LicenseData>(f: K, v: LicenseData[K]) => void;

interface Props {
    data: LicenseData;
    setData: Setter;
    errors?: Partial<Record<keyof LicenseData, string>>;
}

const licenseTypes = ['OEM', 'Retail', 'Volume', 'E-SD', 'Subscription', 'Trial', 'Free', 'Open Source', 'Site', 'Academic'];

const durations = ['6 mois', '1 an', '2 ans', '3 ans', '4 ans', '5 ans', '7 ans', '10 ans'];

const LicenseFields: React.FC<Props> = ({ data, setData, errors = {} }) => (
    <div className="space-y-6">
        <div className="mb-4 flex items-center gap-2">
            <Key className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Spécifications Licence Logicielle</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Nom du logiciel */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Logiciel <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        value={data.software_name}
                        onChange={(e) => setData('software_name', e.target.value)}
                        placeholder="Microsoft Office, Adobe Creative..."
                        maxLength={100}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.software_name && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.software_name}</div>}
                </div>

                {/* Version */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Version</label>
                    <Input
                        type="text"
                        value={data.version ?? ''}
                        onChange={(e) => setData('version', e.target.value || null)}
                        placeholder="2024, 365, CC..."
                        maxLength={100}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.version && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.version}</div>}
                </div>

                {/* Type de licence */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Type de licence <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={data.license_type}
                        onChange={(e) => setData('license_type', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                        <option value="" className="text-slate-500">
                            Sélectionnez un type...
                        </option>
                        {licenseTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                    {errors.license_type && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.license_type}</div>}
                </div>

                {/* Validité */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Validité</label>
                    <select
                        value={data.validity_period ?? ''}
                        onChange={(e) => setData('validity_period', e.target.value || null)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                        <option value="" className="text-slate-500">
                            Sélectionnez une durée...
                        </option>
                        {durations.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                    {errors.validity_period && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.validity_period}</div>}
                </div>

                {/* Méthode d'activation */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Méthode d'activation</label>
                    <Input
                        type="text"
                        value={data.activation_method ?? ''}
                        onChange={(e) => setData('activation_method', e.target.value || null)}
                        placeholder="Clé produit, Activation en ligne..."
                        maxLength={100}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.activation_method && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.activation_method}</div>}
                </div>

                {/* Plateforme */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Plate-forme</label>
                    <Input
                        type="text"
                        value={data.platform ?? ''}
                        onChange={(e) => setData('platform', e.target.value || null)}
                        placeholder="Windows, macOS, Linux..."
                        maxLength={100}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.platform && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.platform}</div>}
                </div>
            </div>

            {/* Info section */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="mb-1 font-medium">Conseils pour les licences logicielles :</p>
                    <ul className="space-y-1 text-xs">
                        <li>• Vérifiez la compatibilité avec votre système d'exploitation</li>
                        <li>• Les licences OEM sont liées au matériel</li>
                        <li>• Conservez précieusement vos clés d'activation</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

export default LicenseFields;
