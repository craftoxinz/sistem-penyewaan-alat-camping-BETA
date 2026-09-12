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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->json('specifications')->nullable();
            $table->decimal('price_per_day', 12, 2);
            $table->decimal('deposit_per_unit', 12, 2)->default(0);
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('equipment_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained('equipment')->cascadeOnDelete();
            $table->string('unit_code')->unique();
            $table->enum('condition', ['baik', 'butuh_perbaikan', 'rusak'])->default('baik');
            $table->enum('status', ['tersedia', 'disewa', 'maintenance', 'afkir', 'hilang'])->default('tersedia');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('rentals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('booking_code')->unique();
            $table->string('invoice_number')->unique();
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('total_days');
            $table->decimal('subtotal_price', 12, 2);
            $table->decimal('total_deposit', 12, 2)->default(0);
            $table->decimal('total_price', 12, 2);
            $table->decimal('dp_amount', 12, 2);
            $table->decimal('remaining_amount', 12, 2);
            $table->enum('payment_status', ['pending_dp', 'dp_verified', 'dp_rejected', 'paid_in_full'])->default('pending_dp');
            $table->enum('rental_status', ['pending_dp', 'confirmed', 'ready_pickup', 'active', 'completed', 'cancelled', 'defaulted'])->default('pending_dp');
            $table->enum('deposit_status', ['unpaid', 'held', 'refunded', 'forfeited'])->default('unpaid');
            $table->decimal('deposit_refund_amount', 12, 2)->default(0);
            $table->string('dp_proof_image')->nullable();
            $table->timestamp('dp_paid_at')->nullable();
            $table->timestamp('dp_verified_at')->nullable();
            $table->timestamp('cod_paid_at')->nullable();
            $table->timestamp('handover_at')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->text('customer_notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('rental_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rental_id')->constrained('rentals')->cascadeOnDelete();
            $table->foreignId('equipment_id')->constrained('equipment')->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('price_per_day', 12, 2);
            $table->decimal('deposit_per_unit', 12, 2)->default(0);
            $table->decimal('subtotal_price', 12, 2);
            $table->decimal('subtotal_deposit', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('rental_item_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rental_item_id')->constrained('rental_items')->cascadeOnDelete();
            $table->foreignId('equipment_unit_id')->constrained('equipment_units')->cascadeOnDelete();
            $table->enum('condition_out', ['baik', 'butuh_perbaikan', 'rusak'])->default('baik');
            $table->enum('condition_in', ['baik', 'butuh_perbaikan', 'rusak', 'hilang'])->nullable();
            $table->text('notes_out')->nullable();
            $table->text('notes_in')->nullable();
            $table->timestamp('handover_at')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->timestamps();
        });

        Schema::create('unit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_unit_id')->constrained('equipment_units')->cascadeOnDelete();
            $table->foreignId('rental_id')->nullable()->constrained('rentals')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['handover', 'return', 'maintenance', 'condition_update']);
            $table->string('condition_before');
            $table->string('condition_after');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('equipment_id')->constrained('equipment')->cascadeOnDelete();
            $table->foreignId('rental_id')->constrained('rentals')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('unit_logs');
        Schema::dropIfExists('rental_item_units');
        Schema::dropIfExists('rental_items');
        Schema::dropIfExists('rentals');
        Schema::dropIfExists('equipment_units');
        Schema::dropIfExists('equipment');
        Schema::dropIfExists('categories');
    }
};
