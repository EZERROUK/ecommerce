export type TicketStatus =
    | 'new'
    | 'open'
    | 'pending_customer'
    | 'pending_internal'
    | 'on_hold'
    | 'resolved'
    | 'closed'
    | 'cancelled';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

const STATUS_LABELS_FR: Record<TicketStatus, string> = {
    new: 'Nouveau',
    open: 'Ouvert',
    pending_customer: 'En attente client',
    pending_internal: 'En attente interne',
    on_hold: 'En pause',
    resolved: 'Résolu',
    closed: 'Fermé',
    cancelled: 'Annulé',
};

const PRIORITY_LABELS_FR: Record<TicketPriority, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    critical: 'Critique',
};

export function ticketStatusLabelFr(status: TicketStatus | string): string {
    return (STATUS_LABELS_FR as any)[status] ?? String(status);
}

export function ticketPriorityLabelFr(priority: TicketPriority | string): string {
    return (PRIORITY_LABELS_FR as any)[priority] ?? String(priority);
}
