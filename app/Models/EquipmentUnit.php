<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EquipmentUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'equipment_id',
        'unit_code',
        'condition',
        'status',
        'notes',
    ];

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    public function rentalItemUnits(): HasMany
    {
        return $this->hasMany(RentalItemUnit::class);
    }

    public function unitLogs(): HasMany
    {
        return $this->hasMany(UnitLog::class)->latest();
    }

    public function activeRentalItemUnit()
    {
        return $this->hasOne(RentalItemUnit::class)->whereNull('returned_at')->latestOfMany();
    }
}
