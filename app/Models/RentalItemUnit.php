<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentalItemUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'rental_item_id',
        'equipment_unit_id',
        'condition_out',
        'condition_in',
        'notes_out',
        'notes_in',
        'damage_fee',
        'handover_at',
        'returned_at',
    ];

    protected function casts(): array
    {
        return [
            'damage_fee' => 'decimal:2',
            'handover_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    public function rentalItem(): BelongsTo
    {
        return $this->belongsTo(RentalItem::class);
    }

    public function equipmentUnit(): BelongsTo
    {
        return $this->belongsTo(EquipmentUnit::class);
    }
}
