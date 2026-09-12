<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    protected $model = Expense::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = [
            'pemeliharaan_alat',
            'perlengkapan_alat',
            'operasional_toko',
            'gaji_karyawan',
            'lain_lain',
        ];

        return [
            'user_id' => User::factory(),
            'expense_number' => 'EXP-'.date('Ym').'-'.fake()->unique()->numerify('####'),
            'category' => fake()->randomElement($categories),
            'title' => fake()->sentence(3),
            'amount' => fake()->randomFloat(2, 20000, 500000),
            'expense_date' => fake()->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'payment_method' => fake()->randomElement(['cash', 'transfer']),
            'payment_status' => 'paid',
            'notes' => fake()->optional()->sentence(),
            'receipt_image' => null,
        ];
    }
}
