<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();

            // Identité / contact
            $table->string('first_name');
            $table->string('last_name');
            $table->string('employee_code')->unique()->nullable(); // matricule interne
            $table->string('cin')->unique()->nullable();            // CIN
            $table->string('cnss_number')->nullable()->unique();
            $table->string('photo')->nullable();
            $table->string('cv_path')->nullable();        // 📄 CV
            $table->string('contract_path')->nullable();  // 📄 Contrat
            $table->string('email')->unique();
            $table->string('phone_number')->nullable();
            $table->string('address')->nullable();
            $table->date('date_of_birth');

            // Poste & organisation
            $table->string('position');
            $table->foreignId('department_id')
                ->nullable()
                ->constrained('departments')
                ->nullOnDelete();

            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->date('hire_date');
            $table->date('departure_date')->nullable();

            // Orga & suivi
            $table->foreignId('manager_id')
                ->nullable()
                ->constrained('employees')
                ->nullOnDelete(); // auto-référence

            $table->string('location')->nullable();               // site/bureau
            $table->date('probation_end_date')->nullable();       // fin période d’essai
            $table->date('last_review_date')->nullable();         // dernière évaluation
            $table->text('notes')->nullable();

            // Rémunération & contrat
            $table->enum('employment_type', ['permanent','fixed_term','intern','contractor','apprentice'])->default('permanent');
            $table->enum('contract_type',  ['full_time','part_time','temp','freelance'])->default('full_time');
            $table->json('work_schedule')->nullable();            // ex: {"weekly_hours":40,"monday":"09:00-17:00",...}

            $table->decimal('salary_gross', 12, 2)->default(0);   // salaire brut base
            $table->string('salary_currency', 3)->default('EUR'); // ISO ex: EUR, MAD
            $table->enum('pay_frequency', ['monthly','weekly','biweekly','hourly'])->default('monthly');
            $table->decimal('hourly_rate', 12, 2)->nullable();    // si “hourly”
            $table->decimal('bonus_target', 12, 2)->nullable();   // bonus cible annuel
            $table->json('benefits')->nullable();                 // avantages (mutuelle, TR, etc.)
            $table->string('cost_center')->nullable();            // centre de coût

            // Sécurité / bancaire
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('bank_iban')->nullable();              // IBAN (si utilisé)
            $table->string('bank_rib')->nullable()->unique();     // RIB texte (ex: Maroc)

            // Auteurs / audit
            $table->foreignId('created_by')->constrained('users');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('employees');
    }
};
