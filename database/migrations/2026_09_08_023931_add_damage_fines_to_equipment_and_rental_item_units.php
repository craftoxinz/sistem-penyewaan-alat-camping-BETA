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
        Schema::table('equipment', function (Blueprint $table) {
            $table->decimal('fine_minor_damage', 12, 2)->default(0)->after('deposit_per_unit');
            $table->decimal('fine_heavy_damage', 12, 2)->default(0)->after('fine_minor_damage');
            $table->decimal('fine_lost', 12, 2)->default(0)->after('fine_heavy_damage');
        });

        Schema::table('rental_item_units', function (Blueprint $table) {
            $table->decimal('damage_fee', 12, 2)->default(0)->after('notes_in');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rental_item_units', function (Blueprint $table) {
            $table->dropColumn('damage_fee');
        });

        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn([
                'fine_minor_damage',
                'fine_heavy_damage',
                'fine_lost',
            ]);
        });
    }
};
