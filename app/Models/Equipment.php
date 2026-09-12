<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Equipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'slug',
        'description',
        'specifications',
        'price_per_day',
        'deposit_per_unit',
        'fine_minor_damage',
        'fine_heavy_damage',
        'fine_lost',
        'image_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'specifications' => 'array',
            'price_per_day' => 'decimal:2',
            'deposit_per_unit' => 'decimal:2',
            'fine_minor_damage' => 'decimal:2',
            'fine_heavy_damage' => 'decimal:2',
            'fine_lost' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function units(): HasMany
    {
        return $this->hasMany(EquipmentUnit::class);
    }

    public function availableUnits(): HasMany
    {
        return $this->hasMany(EquipmentUnit::class)
            ->where('status', 'tersedia')
            ->where('condition', '!=', 'rusak');
    }

    public function rentalItems(): HasMany
    {
        return $this->hasMany(RentalItem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('is_visible', true);
    }

    /**
     * Get the total number of usable (non-retired, non-severely-damaged) units.
     * This is the physical fleet capacity regardless of current booking state.
     */
    public function getTotalUsableUnits(): int
    {
        return $this->units()
            ->whereNotIn('status', ['afkir', 'hilang'])
            ->where('condition', '!=', 'rusak')
            ->count();
    }

    /**
     * Calculate available stock units for a specific date range.
     * Returns usable units minus those already booked in the overlapping period.
     */
    public function getAvailableStockForDates(string $startDate, string $endDate): int
    {
        $totalUsableUnits = $this->getTotalUsableUnits();

        // Count overlapping active rentals
        $overlappingBookedQuantity = RentalItem::where('equipment_id', $this->id)
            ->whereHas('rental', function ($query) use ($startDate, $endDate) {
                $query->whereIn('rental_status', ['pending_dp', 'confirmed', 'ready_pickup', 'active'])
                    ->where(function ($q) use ($startDate, $endDate) {
                        $q->where('start_date', '<=', $endDate)
                            ->where('end_date', '>=', $startDate);
                    });
            })
            ->sum('quantity');

        return max(0, $totalUsableUnits - $overlappingBookedQuantity);
    }

    /**
     * Generate unit code suggestion metadata and preview codes for new units.
     *
     * @return array{
     *     last_code: ?string,
     *     prefix: string,
     *     next_number: int,
     *     pad_length: int,
     *     preview_codes: list<string>
     * }
     */
    public function getUnitCodeSuggestion(int $quantity = 1): array
    {
        $units = $this->units()->select('unit_code')->get();

        $highestNum = 0;
        $detectedPrefix = null;
        $padLength = 3;

        foreach ($units as $unit) {
            if (preg_match('/^(.*?)(\d+)$/', $unit->unit_code, $matches)) {
                $prefix = $matches[1];
                $num = (int) $matches[2];
                $len = strlen($matches[2]);

                if ($num > $highestNum) {
                    $highestNum = $num;
                    $detectedPrefix = $prefix;
                    $padLength = max(3, $len);
                }
            }
        }

        $lastUnit = $units->last();
        $lastCode = $lastUnit?->unit_code;

        if (! $detectedPrefix) {
            // Generate clean prefix from slug / category / name
            $slugParts = explode('-', (string) $this->slug);
            if (count($slugParts) >= 2) {
                $p1 = strtoupper(substr($slugParts[0], 0, 3));
                $p2 = strtoupper(substr($slugParts[1], 0, 3));
                $detectedPrefix = "{$p1}-{$p2}-";
            } elseif (count($slugParts) === 1 && ! empty($slugParts[0])) {
                $p1 = strtoupper(substr($slugParts[0], 0, 4));
                $detectedPrefix = "{$p1}-";
            } else {
                $detectedPrefix = 'EQP-';
            }
            $highestNum = 0;
            $padLength = 3;
        }

        $nextNumber = $highestNum + 1;
        $previewCodes = [];

        for ($i = 0; $i < max(1, min(100, $quantity)); $i++) {
            $numStr = str_pad((string) ($nextNumber + $i), $padLength, '0', STR_PAD_LEFT);
            $previewCodes[] = "{$detectedPrefix}{$numStr}";
        }

        return [
            'last_code' => $lastCode,
            'prefix' => $detectedPrefix,
            'next_number' => $nextNumber,
            'pad_length' => $padLength,
            'preview_codes' => $previewCodes,
        ];
    }
}
