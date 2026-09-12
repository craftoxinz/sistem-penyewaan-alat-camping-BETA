<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RentalItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'rental_id',
        'equipment_id',
        'quantity',
        'price_per_day',
        'deposit_per_unit',
        'subtotal_price',
        'subtotal_deposit',
    ];

    protected function casts(): array
    {
        return [
            'price_per_day' => 'decimal:2',
            'deposit_per_unit' => 'decimal:2',
            'subtotal_price' => 'decimal:2',
            'subtotal_deposit' => 'decimal:2',
        ];
    }

    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    public function itemUnits(): HasMany
    {
        return $this->hasMany(RentalItemUnit::class);
    }
}
