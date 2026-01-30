<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Toujours nettoyer le cache des permissions avant de toucher aux données
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // === Permissions EXACTES vues dans web.php ===
        $permissions = [

            // Utilisateurs
            'user_list','user_create','user_edit','user_delete','user_show','user_export','user_restore',

            // Rôles
            'role_list','role_create','role_edit','role_delete','role_show','role_restore',

            // Permissions
            'permission_list','permission_create','permission_edit','permission_delete','permission_show','permission_restore',

            // Journaux
            'audit_list','audit_export',
            'loginlog_list','loginlog_export',

            // Catégories (inclut routes attributes.* protégées par category_edit)
            'category_list','category_create','category_show','category_edit','category_delete','category_restore',

            // Produits
            'product_list','product_create','product_show','product_edit','product_delete','product_restore',

            // Avis produits (modération)
            'product_review_list','product_review_moderate','product_review_delete',

            // Clients
            'client_list','client_create','client_show','client_edit','client_delete','client_restore',

            // Devis (Quotes)
            'quote_list','quote_create','quote_show','quote_edit','quote_delete','quote_convert','quote_export',

            // Commandes
            'order_list','order_show',

            // Commandes web (boutique)
            'web_order_list','web_order_show','web_order_edit','web_order_delete','web_order_restore',

            // Factures (Invoices)
            'invoice_list','invoice_show','invoice_edit','invoice_export','invoice_send','invoice_reopen','invoice_create',

            // Stock (fournisseurs & motifs) → utilisent les mêmes clés "stock_*"
            'stock_list','stock_create','stock_edit','stock_delete',

            // Mouvements de stock (clés dédiées)
            'stock_movement_list','stock_movement_create','stock_movement_edit','stock_movement_delete',

            // Devises & Taxes
            'currency_list','currency_create','currency_show','currency_edit','currency_delete','currency_restore',
            'taxrate_list','taxrate_create','taxrate_show','taxrate_edit','taxrate_delete','taxrate_restore',

            // Départements
            'department_list','department_create','department_show','department_edit','department_delete','department_restore',

            // Employés
            'employee_list','employee_create','employee_show','employee_edit','employee_delete','employee_restore',

            // Congés
            'leave_list','leave_create','leave_show','leave_cancel',
            'leave_manage_all','leave_approve_manager','leave_approve_hr',
            'leave_type_manage','holiday_manage','leave_balance_manage',

            // Promotions (back-office)
            'promotion_list','promotion_create','promotion_edit','promotion_delete',

            // Blog / Actualités (back-office)
            'blog_post_list','blog_post_create','blog_post_show','blog_post_edit','blog_post_delete',

            // Helpdesk / Tickets
            'ticket_list','ticket_create','ticket_show','ticket_edit','ticket_delete',
            'ticket_assign','ticket_change_status',
            'ticket_comment_public','ticket_comment_internal',
            'ticket_attachment_add',
            'ticket_attachment_delete',
            'ticket_manage_categories','ticket_manage_sla',
            'ticket_dashboard','ticket_report',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // Rôles
        $superAdmin = Role::firstOrCreate(['name' => 'SuperAdmin', 'guard_name' => 'web']);
        $admin      = Role::firstOrCreate(['name' => 'Admin',      'guard_name' => 'web']);
        $user       = Role::firstOrCreate(['name' => 'User',       'guard_name' => 'web']);
        $helpdeskManager    = Role::firstOrCreate(['name' => 'HelpdeskManager',    'guard_name' => 'web']);
        $helpdeskTechnician = Role::firstOrCreate(['name' => 'HelpdeskTechnician', 'guard_name' => 'web']);
        $clientRole         = Role::firstOrCreate(['name' => 'Client',             'guard_name' => 'web']);

        // SuperAdmin : absolument tout
        $superAdmin->syncPermissions(Permission::all());

        // Admin : large périmètre de gestion (sans restore global sur tout, ni opérations sensibles non présentes)
        $admin->syncPermissions([
            // Utilisateurs
            'user_list','user_create','user_edit','user_delete','user_show','user_export',

            // Rôles & Permissions (lecture/édition de base)
            'role_list','role_create','role_edit','role_delete','role_show',
            'permission_list','permission_create','permission_edit','permission_delete','permission_show',

            // Catégories & Produits
            'category_list','category_create','category_edit','category_delete','category_show',
            'product_list','product_create','product_edit','product_delete','product_show',

            // Avis produits
            'product_review_list','product_review_moderate','product_review_delete',

            // Clients / Devis / Commandes
            'client_list','client_create','client_edit','client_delete','client_show',
            'quote_list','quote_create','quote_edit','quote_delete','quote_convert','quote_export','quote_show',
            'order_list','order_show',

            // Commandes web (boutique)
            'web_order_list','web_order_show','web_order_edit','web_order_delete','web_order_restore',

            // Factures
            'invoice_list','invoice_show','invoice_edit','invoice_export','invoice_send','invoice_reopen','invoice_create',

            // Stock & Mouvements
            'stock_list','stock_create','stock_edit','stock_delete',
            'stock_movement_list','stock_movement_create','stock_movement_edit','stock_movement_delete',

            // Monnaies & Taxes
            'currency_list','currency_create','currency_edit','currency_delete','currency_show',
            'taxrate_list','taxrate_create','taxrate_edit','taxrate_delete','taxrate_show',

            // Départements & Employés
            'department_list','department_create','department_edit','department_delete','department_show',
            'employee_list','employee_create','employee_edit','employee_delete','employee_show',

            // Congés (Admin/RH)
            'leave_list','leave_create','leave_show','leave_cancel',
            'leave_manage_all','leave_approve_manager','leave_approve_hr',
            'leave_type_manage','holiday_manage','leave_balance_manage',

            // Promotions
            'promotion_list','promotion_create','promotion_edit','promotion_delete',

            // Blog / Actualités
            'blog_post_list','blog_post_create','blog_post_show','blog_post_edit','blog_post_delete',

            // Helpdesk / Tickets
            'ticket_list','ticket_create','ticket_show','ticket_edit','ticket_delete',
            'ticket_assign','ticket_change_status',
            'ticket_comment_public','ticket_comment_internal',
            'ticket_attachment_add',
            'ticket_attachment_delete',
            'ticket_manage_categories','ticket_manage_sla',
            'ticket_dashboard','ticket_report',

            // Logs
            'audit_list','audit_export',
            'loginlog_list','loginlog_export',
        ]);

        // User : lecture majoritaire
        $user->syncPermissions([
            'category_list','product_list',
            'client_list',
            'quote_list',
            'order_list','order_show',
            'invoice_list','invoice_show',
            'stock_list',
            'currency_list','taxrate_list',
            'department_list','employee_list',
            'promotion_list',

            // Blog / Actualités (lecture)
            'blog_post_list','blog_post_show',

            // Helpdesk / Tickets (lecture)
            'ticket_list','ticket_show',

            // Congés (self-service)
            'leave_list','leave_create','leave_show','leave_cancel',
        ]);

        // Helpdesk Manager : tout le périmètre tickets (inclut pilotage)
        $helpdeskManager->syncPermissions([
            'ticket_list','ticket_create','ticket_show','ticket_edit','ticket_delete',
            'ticket_assign','ticket_change_status',
            'ticket_comment_public','ticket_comment_internal',
            'ticket_attachment_add',
            'ticket_attachment_delete',
            'ticket_manage_categories','ticket_manage_sla',
            'ticket_dashboard','ticket_report',
        ]);

        // Helpdesk Technician : opérationnel (sans administration des référentiels)
        $helpdeskTechnician->syncPermissions([
            'ticket_list','ticket_create','ticket_show','ticket_edit',
            'ticket_assign','ticket_change_status',
            'ticket_comment_public','ticket_comment_internal',
            'ticket_attachment_add',
        ]);

        // Client (web) : aucun droit back-office par défaut
        $clientRole->syncPermissions([]);

        // Re-cache proprement
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
