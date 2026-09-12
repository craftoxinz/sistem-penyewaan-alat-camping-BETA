<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'expense_number',
        'category',
        'title',
        'amount',
        'expense_date',
        'payment_method',
        'payment_status',
        'notes',
        'receipt_image',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date:Y-m-d',
        ];
    }

    /**
     * User/Admin who recorded this expense.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate next sequential expense number (e.g. EXP-202609-0001).
     */
    public static function generateExpenseNumber(): string
    {
        $prefix = 'EXP-'.date('Ym').'-';
        $latest = static::where('expense_number', 'like', "{$prefix}%")
            ->orderByDesc('id')
            ->value('expense_number');

        if (! $latest) {
            return $prefix.'0001';
        }

        $seq = (int) substr($latest, strlen($prefix)) + 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
