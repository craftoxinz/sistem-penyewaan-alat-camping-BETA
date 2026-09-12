<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EquipmentUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->canAccessWarehouse();
    }

    public function rules(): array
    {
        $unitId = $this->route('unit')?->id;
        $isCreate = $this->isMethod('post');
        $isBatch = $isCreate && ((int) $this->input('quantity', 1) > 1 || $this->has('unit_codes'));

        $unitCodeRules = $isBatch
            ? ['nullable', 'string', 'max:50']
            : ['required', 'string', 'max:50', Rule::unique('equipment_units', 'unit_code')->ignore($unitId)];

        return [
            'equipment_id' => ['required', 'exists:equipment,id'],
            'unit_code' => $unitCodeRules,
            'quantity' => ['nullable', 'integer', 'min:1', 'max:100'],
            'prefix' => ['nullable', 'string', 'max:30'],
            'start_number' => ['nullable', 'integer', 'min:1'],
            'unit_codes' => ['nullable', 'array', 'max:100'],
            'unit_codes.*' => ['string', 'max:50', 'distinct', Rule::unique('equipment_units', 'unit_code')],
            'condition' => ['required', Rule::in(['baik', 'butuh_perbaikan', 'rusak'])],
            'status' => ['required', Rule::in(['tersedia', 'disewa', 'maintenance', 'afkir'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'unit_code.required' => 'Kode unit unik wajib diisi.',
            'unit_code.unique' => 'Kode unit ini sudah terdaftar dalam sistem.',
            'unit_codes.*.unique' => 'Salah satu kode unit (:input) sudah terdaftar dalam sistem.',
            'unit_codes.*.distinct' => 'Daftar kode unit memiliki duplikasi.',
            'quantity.min' => 'Jumlah unit minimal 1.',
            'quantity.max' => 'Jumlah unit maksimal 100 per penambahan.',
        ];
    }
}
