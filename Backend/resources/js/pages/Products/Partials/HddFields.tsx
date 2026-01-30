import { Input } from '@/components/ui/input';
import { HardDrive } from 'lucide-react';
import React from 'react';

export interface HddData {
    type: string; // HDD / SSD / NVMe
    interface: string; // SATA, PCIe…
    capacity: number; // GB
    form_factor: string; // 2.5", 3.5"
    rpm?: number | null;
    read_speed?: number | null;
    write_speed?: number | null;
    nand_type?: string | null;
    mtbf?: number | null; // heures
    warranty?: number | null; // mois
}

type Setter = <K extends keyof HddData>(f: K, v: HddData[K]) => void;
interface Props {
    data: HddData;
    setData: Setter;
    errors?: Partial<Record<keyof HddData, string>>;
}

const HddFields: React.FC<Props> = ({ data, setData, errors = {} }) => (
    <div className="space-y-6">
        <div className="mb-4 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Spécifications Disque Dur</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Type */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Type <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                        placeholder="HDD, SSD, NVMe..."
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.type && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.type}</div>}
                </div>

                {/* Interface */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Interface <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        value={data.interface}
                        onChange={(e) => setData('interface', e.target.value)}
                        placeholder="SATA III, PCIe 4.0..."
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.interface && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.interface}</div>}
                </div>

                {/* Capacité */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Capacité (GB) <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="number"
                        min={0}
                        step={1}
                        value={data.capacity}
                        onChange={(e) => setData('capacity', Number(e.target.value))}
                        placeholder="1000"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.capacity && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.capacity}</div>}
                </div>

                {/* Form-factor */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Form-factor <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        value={data.form_factor}
                        onChange={(e) => setData('form_factor', e.target.value)}
                        placeholder="2.5\ 3.5\ M.2..."
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.form_factor && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.form_factor}</div>}
                </div>

                {/* RPM */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">RPM</label>
                    <Input
                        type="number"
                        min={0}
                        step={1}
                        value={data.rpm ?? ''}
                        onChange={(e) => setData('rpm', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="7200"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.rpm && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.rpm}</div>}
                </div>

                {/* Lecture */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Lecture (MB/s)</label>
                    <Input
                        type="number"
                        min={0}
                        step={1}
                        value={data.read_speed ?? ''}
                        onChange={(e) => setData('read_speed', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="550"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.read_speed && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.read_speed}</div>}
                </div>

                {/* Écriture */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Écriture (MB/s)</label>
                    <Input
                        type="number"
                        min={0}
                        step={1}
                        value={data.write_speed ?? ''}
                        onChange={(e) => setData('write_speed', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="520"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.write_speed && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.write_speed}</div>}
                </div>

                {/* Type NAND */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Type NAND</label>
                    <Input
                        type="text"
                        value={data.nand_type ?? ''}
                        onChange={(e) => setData('nand_type', e.target.value || null)}
                        placeholder="TLC, QLC..."
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.nand_type && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.nand_type}</div>}
                </div>

                {/* MTBF */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">MTBF (h)</label>
                    <Input
                        type="number"
                        min={0}
                        step={1}
                        value={data.mtbf ?? ''}
                        onChange={(e) => setData('mtbf', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="1000000"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.mtbf && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.mtbf}</div>}
                </div>

                {/* Garantie */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Garantie (mois)</label>
                    <Input
                        type="number"
                        min={0}
                        step={1}
                        value={data.warranty ?? ''}
                        onChange={(e) => setData('warranty', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="60"
                        className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    {errors.warranty && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.warranty}</div>}
                </div>
            </div>

            {/* Info section */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="mb-1 font-medium">Conseils pour les disques durs :</p>
                    <ul className="space-y-1 text-xs">
                        <li>• Les SSD sont plus rapides mais plus chers que les HDD</li>
                        <li>• Vérifiez la compatibilité de l'interface avec votre carte mère</li>
                        <li>• Le MTBF indique la fiabilité du disque</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

export default HddFields;
