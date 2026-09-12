<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->integer('late_days')->default(0)->after('total_days');
            $table->decimal('late_fee', 12, 2)->default(0)->after('total_price');
            $table->decimal('damage_fee', 12, 2)->default(0)->after('late_fee');
            $table->decimal('total_fine', 12, 2)->default(0)->after('damage_fee');
            $table->decimal('additional_charge_paid', 12, 2)->default(0)->after('total_fine');
            $table->string('fine_payment_status')->default('none')->after('deposit_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn([
                'late_days',
                'late_fee',
                'damage_fee',
                'total_fine',
                'additional_charge_paid',
                'fine_payment_status',
            ]);
        });
    }
};
