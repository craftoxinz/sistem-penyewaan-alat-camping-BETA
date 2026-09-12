import type { User } from './auth';

export type Category = {
    id: number;
    name: string;
    slug: string;
    icon?: string | null;
    description?: string | null;
    equipment_count?: number;
    created_at?: string;
    updated_at?: string;
};

export type Brand = {
    id: number;
    name: string;
    slug: string;
    logo_url?: string | null;
    website_url?: string | null;
    description?: string | null;
    is_active: boolean;
    equipment_count?: number;
    created_at?: string;
    updated_at?: string;
};

export type EquipmentUnitCondition = 'baik' | 'butuh_perbaikan' | 'rusak' | 'hilang';
export type EquipmentUnitStatus =
    | 'tersedia'
    | 'disewa'
    | 'maintenance'
    | 'afkir'
    | 'hilang';

export type EquipmentUnit = {
    id: number;
    equipment_id: number;
    unit_code: string;
    condition: EquipmentUnitCondition;
    status: EquipmentUnitStatus;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
    equipment?: Equipment;
    unit_logs?: UnitLog[];
};

export type Equipment = {
    id: number;
    category_id: number;
    brand_id?: number | null;
    name: string;
    slug: string;
    description: string;
    specifications?: Record<string, string> | null;
    price_per_day: number | string;
    deposit_per_unit: number | string;
    fine_minor_damage?: number | string;
    fine_heavy_damage?: number | string;
    fine_lost?: number | string;
    image_url?: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    category?: Category;
    brand?: Brand | null;
    units?: EquipmentUnit[];
    available_units?: EquipmentUnit[];
    availableUnits?: EquipmentUnit[];
    total_units_count?: number;
    /** Total fleet capacity (non-afkir, non-hilang, non-rusak) – the booking ceiling. */
    usable_units_count?: number;
    /** Currently physically "tersedia" – does NOT account for date-range overlaps. */
    available_units_count?: number;
    rented_units_count?: number;
    maintenance_units_count?: number;
    rental_items_count?: number;
    reviews_avg_rating?: number | null;
    reviews_count?: number;
    reviews?: Review[];
};

export type RentalPaymentStatus =
    | 'pending_dp'
    | 'dp_verified'
    | 'dp_rejected'
    | 'dp_refunded'
    | 'dp_forfeited'
    | 'paid_in_full'
    | 'cancelled';
export type RentalStatus =
    | 'pending_dp'
    | 'confirmed'
    | 'ready_pickup'
    | 'active'
    | 'completed'
    | 'cancelled'
    | 'defaulted';
export type DepositStatus = 'unpaid' | 'held' | 'refunded' | 'forfeited' | 'cancelled';
export type FinePaymentStatus =
    | 'none'
    | 'settled_from_deposit'
    | 'paid_extra_cash'
    | 'unpaid_defaulted';

export type RentalItemUnit = {
    id: number;
    rental_item_id: number;
    equipment_unit_id: number;
    condition_out: EquipmentUnitCondition;
    condition_in?: EquipmentUnitCondition | null;
    notes_out?: string | null;
    notes_in?: string | null;
    damage_fee?: number | string;
    handover_at?: string | null;
    returned_at?: string | null;
    equipment_unit?: EquipmentUnit;
};

export type RentalItem = {
    id: number;
    rental_id: number;
    equipment_id: number;
    quantity: number;
    price_per_day: number | string;
    deposit_per_unit: number | string;
    subtotal_price: number | string;
    subtotal_deposit: number | string;
    created_at?: string;
    updated_at?: string;
    equipment?: Equipment;
    item_units?: RentalItemUnit[];
};

export type Rental = {
    id: number;
    user_id: number;
    booking_code: string;
    invoice_number: string;
    start_date: string;
    end_date: string;
    total_days: number;
    subtotal_price: number | string;
    total_deposit: number | string;
    total_price: number | string;
    late_days?: number;
    late_fee?: number | string;
    damage_fee?: number | string;
    total_fine?: number | string;
    additional_charge_paid?: number | string;
    fine_payment_status?: FinePaymentStatus;
    is_overdue?: boolean;
    overdue_days?: number;
    is_schedule_expired?: boolean;
    dp_amount: number | string;
    remaining_amount: number | string;
    payment_status: RentalPaymentStatus;
    rental_status: RentalStatus;
    deposit_status: DepositStatus;
    deposit_refund_amount: number | string;
    dp_proof_image?: string | null;
    dp_paid_at?: string | null;
    dp_verified_at?: string | null;
    cod_paid_at?: string | null;
    handover_at?: string | null;
    returned_at?: string | null;
    customer_notes?: string | null;
    admin_notes?: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
    items?: RentalItem[];
    reviews?: Review[];
};

export type UnitLogType =
    'handover' | 'return' | 'maintenance' | 'condition_update';

export type UnitLog = {
    id: number;
    equipment_unit_id: number;
    rental_id?: number | null;
    user_id?: number | null;
    type: UnitLogType;
    condition_before: string;
    condition_after: string;
    notes?: string | null;
    created_at: string;
    equipment_unit?: EquipmentUnit;
    user?: User;
    rental?: Rental;
};

export type Review = {
    id: number;
    user_id: number;
    equipment_id: number;
    rental_id: number;
    rating: number;
    comment?: string | null;
    is_visible: boolean;
    created_at: string;
    user?: User;
    equipment?: Equipment;
    rental?: Rental;
};

export type CartItem = {
    equipment_id: number;
    equipment: Equipment;
    quantity: number;
};
