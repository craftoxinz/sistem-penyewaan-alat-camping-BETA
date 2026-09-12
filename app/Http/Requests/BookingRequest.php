<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.equipment_id' => ['required', 'exists:equipment,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'customer_notes' => ['nullable', 'string', 'max:1000'],
            'payment_type' => ['nullable', 'in:dp,full'],
            'dp_proof' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:3072'],
        ];
    }

    public function messages(): array
    {
        return [
            'start_date.required' => 'Tanggal mulai sewa wajib dipilih.',
            'start_date.after_or_equal' => 'Tanggal mulai sewa tidak boleh sebelum hari ini.',
            'end_date.required' => 'Tanggal selesai sewa wajib dipilih.',
            'end_date.after' => 'Tanggal selesai sewa harus setelah tanggal mulai sewa.',
            'items.required' => 'Keranjang sewa tidak boleh kosong.',
            'items.*.quantity.min' => 'Jumlah alat minimal 1 unit.',
        ];
    }
}
