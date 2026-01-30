import { Input } from '@/components/ui/input';
import { Package } from 'lucide-react';
import React from 'react';

export interface AccessoryData {
    type: string;
    compatibility?: string;
    material?: string;
    dimensions?: string;
}

interface Props {
    data: AccessoryData;
    setData: (field: keyof AccessoryData, value: any) => void;
    errors?: Partial<Record<keyof AccessoryData, string>>;
}

const groupedTypes = [
    { label: 'Transport & protection', options: ['Sacoche', 'Housse', 'Étui', 'Pochette', 'Mallette', 'Coque rigide'] },
    { label: 'Alimentation', options: ['Chargeur', 'Adaptateur secteur', 'Batterie externe', 'Power bank', 'Station de charge'] },
    {
        label: 'Connectique',
        options: ['Câble USB', 'Câble HDMI', 'Câble Ethernet', 'Câble VGA', 'Câble DisplayPort', 'Convertisseur / Adaptateur', 'Répartiteur USB'],
    },
    { label: 'Périphériques', options: ['Souris', 'Clavier', 'Tapis de souris', 'Webcam', 'Manette', 'Lecteur de carte'] },
    {
        label: 'Support & ergonomie',
        options: [
            'Support PC',
            'Support écran',
            'Support tablette',
            'Rehausseur',
            'Bras articulé',
            "Station d'accueil",
            'Hub USB',
            'Ventilateur / Refroidisseur',
        ],
    },
    { label: 'Audio & vidéo', options: ['Casque audio', 'Microphone', 'Haut-parleur', 'Enceinte Bluetooth'] },
    { label: 'Entretien', options: ['Kit de nettoyage', 'Bombe à air', 'Chiffon microfibre'] },
    { label: 'Sécurité', options: ['Verrou Kensington', 'Filtre de confidentialité'] },
    { label: 'Autres', options: ['Étiquette câble', 'Accessoire imprimante', 'Accessoire réseau', 'Accessoire stockage', 'Antenne Wi-Fi'] },
];

const materials = ['Plastique', 'Métal', 'Aluminium', 'Cuir', 'Tissu', 'Caoutchouc', 'Silicone', 'Verre trempé'];

const AccessoryFields: React.FC<Props> = ({ data, setData, errors = {} }) => (
    <div className="space-y-6">
        <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Spécifications Accessoire</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Type */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                        <option value="" className="text-slate-500">
                            Sélectionnez un type...
                        </option>
                        {groupedTypes.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                                {group.options.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    {errors.type && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.type}</div>}
                </div>

                {/* Compatibilité */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Compatibilité</label>
                    <Input
                        type="text"
                        value={data.compatibility ?? ''}
                        onChange={(e) => setData('compatibility', e.target.value)}
                        placeholder="Compatible avec..."
                        maxLength={100}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.compatibility && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.compatibility}</div>}
                </div>

                {/* Matériau */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Matériau</label>
                    <select
                        value={data.material ?? ''}
                        onChange={(e) => setData('material', e.target.value || null)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                        <option value="" className="text-slate-500">
                            Sélectionnez un matériau...
                        </option>
                        {materials.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                    {errors.material && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.material}</div>}
                </div>

                {/* Dimensions */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Dimensions</label>
                    <Input
                        type="text"
                        value={data.dimensions ?? ''}
                        onChange={(e) => setData('dimensions', e.target.value)}
                        placeholder="L x l x h (cm)"
                        maxLength={30}
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.dimensions && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.dimensions}</div>}
                </div>
            </div>

            {/* Info section */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="mb-1 font-medium">Conseils pour les accessoires :</p>
                    <ul className="space-y-1 text-xs">
                        <li>• Vérifiez la compatibilité avec vos appareils</li>
                        <li>• Précisez les dimensions pour les accessoires de transport</li>
                        <li>• Le matériau influence la durabilité et le prix</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

export default AccessoryFields;
