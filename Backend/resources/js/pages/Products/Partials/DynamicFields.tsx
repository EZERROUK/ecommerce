/* --------------------------------------------------------------------
   DynamicFields – rend le sous-formulaire spécialisé selon le slug
--------------------------------------------------------------------- */

/* ---- Imports des sous-formulaires spécialisés -------------------- */
import AccessoryFields, { AccessoryData } from './AccessoryFields';
import CpuFields, { CpuData } from './CpuFields';
import DesktopFields, { DesktopData } from './DesktopFields';
import GraphicCardFields, { GraphicCardData } from './GraphicCardFields';
import HddFields, { HddData } from './HddFields';
import LaptopFields, { LaptopData } from './LaptopFields';
import LicenseFields, { LicenseData } from './LicenseFields';
import MoboFields, { MoboData } from './MoboFields';
import NicFields, { NicData } from './NicFields';
import PsuFields, { PsuData } from './PsuFields';
import { RamData, RamFields } from './RamFields';
import ServerFields, { ServerData } from './ServerFields';
import SoftwareFields, { SoftwareData } from './SoftwareFields';

/* ------------- Types utilitaires ---------------------------------- */
type Setter = (field: string, value: any) => void;
type ErrorBag<T> = Partial<Record<keyof T, string>>;

/* ----------- Mapping slug → composant ----------------------------- */
const components = {
    rams: RamFields,
    ram: RamFields, // alias singulier
    processors: CpuFields,
    processor: CpuFields,
    hard_drives: HddFields,
    hard_drive: HddFields,
    power_supplies: PsuFields,
    power_supply: PsuFields,
    motherboards: MoboFields,
    motherboard: MoboFields,
    network_cards: NicFields,
    network_card: NicFields,
    graphic_cards: GraphicCardFields,
    graphic_card: GraphicCardFields,
    licenses: LicenseFields,
    license: LicenseFields,
    softwares: SoftwareFields,
    software: SoftwareFields,
    accessories: AccessoryFields,
    accessory: AccessoryFields,
    laptops: LaptopFields,
    laptop: LaptopFields,
    desktops: DesktopFields,
    desktop: DesktopFields,
    servers: ServerFields,
    server: ServerFields,
} as const;

/* -------------- Union de toutes les « Data » connues -------------- */
type AllData =
    | RamData
    | CpuData
    | HddData
    | PsuData
    | MoboData
    | NicData
    | GraphicCardData
    | LicenseData
    | SoftwareData
    | AccessoryData
    | LaptopData
    | DesktopData
    | ServerData
    | Record<string, any>; // fallback

/* --------------------- Props du composant maître ------------------ */
export interface DynamicFieldsProps {
    slug: keyof typeof components;
    data: AllData;
    setData: Setter;
    errors?: ErrorBag<any>;
}

/* ---------------------- Composant maître -------------------------- */
export default function DynamicFields({ slug, data, setData, errors = {} }: DynamicFieldsProps) {
    const Component = components[slug];
    if (!Component) return null; // slug inconnu → rien à rendre

    return <Component data={data as any} setData={setData} errors={errors} />;
}
