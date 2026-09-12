<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of the users (Admins & Customers).
     */
    public function index(Request $request): Response
    {
        $query = User::query()->withCount('rentals');

        if ($request->filled('search')) {
            $search = trim($request->string('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role') && in_array($request->role, ['admin', 'kasir', 'petugas_gudang', 'customer'], true)) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status') && in_array($request->status, ['active', 'suspended'], true)) {
            $query->where('status', $request->status);
        }

        $perPage = (int) $request->input('per_page', 5);
        if (! in_array($perPage, [5, 10, 20, 50, 100])) {
            $perPage = 5;
        }

        $users = $query->latest()
            ->paginate($perPage)
            ->withQueryString();

        $stats = [
            'total_users' => User::count(),
            'total_admins' => User::where('role', 'admin')->count(),
            'total_cashiers' => User::where('role', 'kasir')->count(),
            'total_warehouse_staff' => User::where('role', 'petugas_gudang')->count(),
            'total_customers' => User::where('role', 'customer')->count(),
            'active_renters' => User::has('rentals')->count(),
            'total_suspended' => User::where('status', 'suspended')->count(),
        ];

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search ?? '',
                'role' => $request->role ?? '',
                'status' => $request->status ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(UserRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return redirect()->route('admin.users.index')
            ->with('success', 'Pengguna baru berhasil ditambahkan.');
    }

    /**
     * Update the specified user in storage.
     */
    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        // Prevent self-demotion from admin role
        if ($user->id === Auth::id() && $validated['role'] !== 'admin') {
            return redirect()->back()->with('error', 'Anda tidak dapat mengubah peran akun Anda sendiri.');
        }

        // Prevent self-suspension
        if ($user->id === Auth::id() && ($validated['status'] ?? null) === 'suspended') {
            return redirect()->back()->with('error', 'Anda tidak dapat menangguhkan akun Anda sendiri.');
        }

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('admin.users.index')
            ->with('success', 'Data pengguna berhasil diperbarui.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        // Check if user has active rentals in progress
        $hasActiveRentals = $user->rentals()
            ->whereIn('status', ['paid_dp', 'active_rented'])
            ->exists();

        if ($hasActiveRentals) {
            return redirect()->back()->with('error', 'Pengguna ini masih memiliki transaksi sewa yang sedang aktif berjalan.');
        }

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'Pengguna berhasil dihapus.');
    }
}
