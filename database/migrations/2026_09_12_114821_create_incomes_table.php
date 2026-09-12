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
        Schema::create('incomes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('income_number')->unique();
            $table->enum('category', [
                'penjualan_barang',
                'jasa_layanan',
                'modal_tambahan',
                'pendapatan_bunga',
                'klaim_kompensasi',
                'lain_lain',
            ])->default('penjualan_barang');
            $table->string('title');
            $table->decimal('amount', 12, 2);
            $table->date('income_date');
            $table->enum('payment_method', ['cash', 'transfer'])->default('cash');
            $table->enum('payment_status', ['received', 'pending'])->default('received');
            $table->text('notes')->nullable();
            $table->string('receipt_image')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incomes');
    }
};
