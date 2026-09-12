<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->isAdmin();
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User|null $targetUser */
        $targetUser = $this->route('user');
        $isUpdate = $targetUser !== null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                $isUpdate ? Rule::unique('users')->ignore($targetUser->id) : Rule::unique('users'),
            ],
            'password' => $isUpdate
                ? ['nullable', 'string', Password::defaults()]
                : ['required', 'string', Password::defaults()],
            'role' => ['required', 'string', Rule::in(['admin', 'kasir', 'petugas_gudang', 'customer'])],
            'status' => ['sometimes', 'string', Rule::in(['active', 'suspended'])],
            'phone' => ['nullable', 'string', 'max:25'],
            'address' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Alamat email sudah digunakan oleh akun lain.',
            'password.required' => 'Password wajib diisi untuk pengguna baru.',
            'password.min' => 'Password minimal terdiri dari :min karakter.',
            'role.required' => 'Pilih peran akun pengguna.',
            'role.in' => 'Peran akun tidak valid.',
        ];
    }
}
