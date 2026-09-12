<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'rental_id' => ['required', 'exists:rentals,id'],
            'equipment_id' => ['required', 'exists:equipment,id'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'rating.required' => 'Rating bintang wajib dipilih (1-5).',
            'rating.between' => 'Rating harus antara 1 sampai 5 bintang.',
        ];
    }
}
