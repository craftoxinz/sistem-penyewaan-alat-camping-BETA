<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->canAccessWarehouse();
    }

    public function rules(): array
    {
        $equipmentId = $this->route('equipment')?->id;

        return [
            'category_id' => ['required', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('equipment', 'slug')->ignore($equipmentId)],
            'description' => ['required', 'string'],
            'specifications' => ['nullable', 'array'],
            'price_per_day' => ['required', 'numeric', 'min:0'],
            'deposit_per_unit' => ['required', 'numeric', 'min:0'],
            'fine_minor_damage' => ['nullable', 'numeric', 'min:0'],
            'fine_heavy_damage' => ['nullable', 'numeric', 'min:0'],
            'fine_lost' => ['nullable', 'numeric', 'min:0'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:3072'],
            'image_url' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }
}
