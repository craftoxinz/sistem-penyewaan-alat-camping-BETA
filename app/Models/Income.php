<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Income extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'income_number',
        'category',
        'title',
        'amount',
        'income_date',
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
            'income_date' => 'date:Y-m-d',
        ];
    }

    /**
     * User/Staff who recorded this income.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate next sequential income number (e.g. INC-202609-0001).
     */
    public static function generateIncomeNumber(): string
    {
        $prefix = 'INC-'.date('Ym').'-';
        $latest = static::where('income_number', 'like', "{$prefix}%")
            ->orderByDesc('id')
            ->value('income_number');

        if (! $latest) {
            return $prefix.'0001';
        }

        $seq = (int) substr($latest, strlen($prefix)) + 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
