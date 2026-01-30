import React from 'react';

/* -------- typage aligné sur la table « motherboards » ---------------- */
export interface MoboData {
    socket: string;
    chipset: string;
    form_factor: string; // ATX, m-ITX…
    ram_slots: number;
    max_ram: number; // GB
    supported_ram_type: string;
    sata_ports: number;
    nvme_slots: number;
    pcie_slots: number;
    usb_ports: number;
    lan_ports: number;
    supports_raid: boolean;
}

type Setter = <K extends keyof MoboData>(f: K, v: MoboData[K]) => void;
interface Props {
    data: MoboData;
    setData: Setter;
    errors?: Partial<Record<keyof MoboData, string>>;
}

/* --------------------------------------------------------------------- */
const fieldList: Array<[string, keyof MoboData, 'text' | 'number' | 'checkbox', number?]> = [
    ['Socket', 'socket', 'text'],
    ['Chipset', 'chipset', 'text'],
    ['Format (ATX…)', 'form_factor', 'text'],
    ['Slots RAM', 'ram_slots', 'number', 1],
    ['RAM max (GB)', 'max_ram', 'number', 1],
    ['Type RAM pris en charge', 'supported_ram_type', 'text'],
    ['Ports SATA', 'sata_ports', 'number', 1],
    ['Slots NVMe', 'nvme_slots', 'number', 1],
    ['Slots PCIe', 'pcie_slots', 'number', 1],
    ['Ports USB', 'usb_ports', 'number', 1],
    ['Ports LAN', 'lan_ports', 'number', 1],
];

/* --------------------------------------------------------------------- */
const MoboFields: React.FC<Props> = ({ data, setData, errors = {} }) => (
    <div className="space-y-6">
        <div className="mb-4 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-red-500">
                <div className="h-3 w-3 border border-white"></div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Spécifications Carte Mère</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fieldList.map(([label, key, type, step]) => (
                    <div key={key as string}>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
                        <input
                            type={type}
                            step={step}
                            min={type === 'number' ? 0 : undefined}
                            value={(data as any)[key] ?? ''}
                            onChange={(e) =>
                                setData(
                                    key,
                                    type === 'number' ? Number(e.target.value) : e.target.type === 'checkbox' ? e.target.checked : e.target.value,
                                )
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                        {errors[key] && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[key]}</div>}
                    </div>
                ))}

                {/* case à cocher RAID */}
                <div className="col-span-1 mt-1 flex items-center md:col-span-2">
                    <input
                        id="supports_raid"
                        type="checkbox"
                        checked={data.supports_raid}
                        onChange={(e) => setData('supports_raid', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 dark:border-slate-600"
                    />
                    <label htmlFor="supports_raid" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                        Supporte le RAID
                    </label>
                    {errors.supports_raid && <div className="ml-3 text-xs text-red-600 dark:text-red-400">{errors.supports_raid}</div>}
                </div>
            </div>

            {/* Info section */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="mb-1 font-medium">Conseils pour les cartes mères :</p>
                    <ul className="space-y-1 text-xs">
                        <li>• Vérifiez la compatibilité socket avec votre CPU</li>
                        <li>• Le chipset détermine les fonctionnalités disponibles</li>
                        <li>• Considérez le nombre de slots d'extension nécessaires</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

export default MoboFields;
