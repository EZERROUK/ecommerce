<?php

use App\Models\User;
use App\Models\Client;
use App\Models\Provider;
use App\Models\Invoice;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
public function up(): void
{
Schema::create('financial_transactions', function (Blueprint $table) {
$table->id(); // ou uuid, adapte à ton standard

// Encaissement ou décaissement
$table->enum('direction', ['in', 'out']);

// Contexte (facultatif mais pratique pour filtrer/analyser)
$table->string('context')->nullable();
// ex: customer_payment, supplier_payment, bank_fee, shipping_cost, courier_cost, other

// Liens métiers
$table->foreignIdFor(Invoice::class)->nullable()->constrained()->nullOnDelete();
$table->foreignIdFor(Client::class)->nullable()->constrained()->nullOnDelete();
$table->foreignIdFor(Provider::class)->nullable()->constrained()->nullOnDelete();

// Catégorie de dépense (frais de banque, livraison, etc.)
$table->foreignId('expense_category_id')->nullable()->constrained()->nullOnDelete();

// Infos financières
$table->decimal('amount', 15, 2);
$table->string('currency', 3)->default('EUR'); // ou récupère de AppSetting

// Échéance / réalisation
$table->date('due_date')->nullable(); // date théorique
$table->dateTime('paid_at')->nullable(); // date réelle

// planned = prévu, paid = réglé, overdue = en retard, canceled = annulé
$table->enum('status', ['planned', 'paid', 'overdue', 'canceled'])
->default('planned');

// Méthode de paiement
$table->string('payment_method')->nullable(); // cash, card, bank_transfer, etc.

$table->string('reference')->nullable(); // ex: n° opération bancaire, n° chèque, etc.
$table->string('label')->nullable(); // titre court
$table->text('notes')->nullable(); // détails

// Traçabilité
$table->foreignIdFor(User::class, 'created_by')->nullable()->constrained('users')->nullOnDelete();
$table->foreignIdFor(User::class, 'updated_by')->nullable()->constrained('users')->nullOnDelete();

$table->timestamps();
$table->softDeletes();
});
}

public function down(): void
{
Schema::dropIfExists('financial_transactions');
}
};
