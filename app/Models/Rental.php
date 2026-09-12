<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Rental extends Model
{
    use HasFactory;

    protected $appends = [
        'is_overdue',
        'overdue_days',
        'is_schedule_expired',
    ];

    protected $fillable = [
        'user_id',
        'booking_code',
        'invoice_number',
        'start_date',
        'end_date',
        'total_days',
        'subtotal_price',
        'total_deposit',
        'total_price',
        'late_days',
        'late_fee',
        'damage_fee',
        'total_fine',
        'additional_charge_paid',
        'fine_payment_status',
        'dp_amount',
        'remaining_amount',
        'payment_status',
        'rental_status',
        'deposit_status',
        'deposit_refund_amount',
        'dp_proof_image',
        'dp_paid_at',
        'dp_verified_at',
        'cod_paid_at',
        'handover_at',
        'returned_at',
        'customer_notes',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'subtotal_price' => 'decimal:2',
            'total_deposit' => 'decimal:2',
            'total_price' => 'decimal:2',
            'late_days' => 'integer',
            'late_fee' => 'decimal:2',
            'damage_fee' => 'decimal:2',
            'total_fine' => 'decimal:2',
            'additional_charge_paid' => 'decimal:2',
            'dp_amount' => 'decimal:2',
            'remaining_amount' => 'decimal:2',
            'deposit_refund_amount' => 'decimal:2',
            'dp_paid_at' => 'datetime',
            'dp_verified_at' => 'datetime',
            'cod_paid_at' => 'datetime',
            'handover_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    /**
     * Check if active rental is currently overdue.
     */
    public function isOverdue(): bool
    {
        if ($this->rental_status !== 'active') {
            return false;
        }

        $endDate = Carbon::parse($this->end_date)->startOfDay();
        $today = now()->startOfDay();

        return $today->gt($endDate);
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->isOverdue();
    }

    /**
     * Calculate current overdue days.
     */
    public function getOverdueDaysAttribute(): int
    {
        if (! $this->isOverdue()) {
            return 0;
        }

        $endDate = Carbon::parse($this->end_date)->startOfDay();
        $today = now()->startOfDay();

        return max(1, (int) $endDate->diffInDays($today));
    }

    /**
     * Check if booking schedule has already passed start date without being active/completed.
     */
    public function isScheduleExpired(): bool
    {
        if (in_array($this->rental_status, ['active', 'completed', 'cancelled', 'defaulted'])) {
            return false;
        }

        $startDate = Carbon::parse($this->start_date)->startOfDay();
        $today = now()->startOfDay();

        return $today->gt($startDate);
    }

    public function getIsScheduleExpiredAttribute(): bool
    {
        return $this->isScheduleExpired();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RentalItem::class);
    }

    public function rentalItemUnits(): HasManyThrough
    {
        return $this->hasManyThrough(RentalItemUnit::class, RentalItem::class);
    }

    public function unitLogs(): HasMany
    {
        return $this->hasMany(UnitLog::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
