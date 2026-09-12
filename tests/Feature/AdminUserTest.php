<?php

use App\Models\User;
use Database\Seeders\CampingRentalSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
    $this->admin = User::where('role', 'admin')->first();
    $this->customer = User::where('role', 'customer')->first();
});

test('unauthenticated guest cannot access admin users index', function () {
    $response = $this->get(route('admin.users.index'));

    $response->assertRedirect(route('login'));
});

test('customer role cannot access admin users index', function () {
    $response = $this->actingAs($this->customer)->get(route('admin.users.index'));

    $response->assertForbidden();
});

test('admin can view users index page', function () {
    $response = $this->actingAs($this->admin)->get(route('admin.users.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->has('users')
        ->has('stats')
        ->has('filters')
    );
});

test('admin can search users and filter by role', function () {
    $response = $this->actingAs($this->admin)->get(route('admin.users.index', [
        'search' => $this->customer->email,
        'role' => 'customer',
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/users/index')
        ->where('filters.search', $this->customer->email)
        ->where('filters.role', 'customer')
    );
});

test('admin can create a new customer user', function () {
    $response = $this->actingAs($this->admin)->post(route('admin.users.store'), [
        'name' => 'Budi Santoso',
        'email' => 'budi.santoso@example.com',
        'password' => 'password123',
        'role' => 'customer',
        'phone' => '081234567890',
        'address' => 'Jl. Kebon Jeruk No. 10, Jakarta Barat',
    ]);

    $response->assertRedirect(route('admin.users.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('users', [
        'name' => 'Budi Santoso',
        'email' => 'budi.santoso@example.com',
        'role' => 'customer',
        'phone' => '081234567890',
    ]);

    $newUser = User::where('email', 'budi.santoso@example.com')->first();
    expect(Hash::check('password123', $newUser->password))->toBeTrue();
});

test('admin can create a new kasir user', function () {
    $response = $this->actingAs($this->admin)->post(route('admin.users.store'), [
        'name' => 'Kasir Baru',
        'email' => 'kasir.baru@example.com',
        'password' => 'kasirSecret123',
        'role' => 'kasir',
        'phone' => '081298765432',
    ]);

    $response->assertRedirect(route('admin.users.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('users', [
        'name' => 'Kasir Baru',
        'email' => 'kasir.baru@example.com',
        'role' => 'kasir',
    ]);
});

test('admin can create a new petugas_gudang user', function () {
    $response = $this->actingAs($this->admin)->post(route('admin.users.store'), [
        'name' => 'Gudang Baru',
        'email' => 'gudang.baru@example.com',
        'password' => 'gudangSecret123',
        'role' => 'petugas_gudang',
        'phone' => '081712345678',
    ]);

    $response->assertRedirect(route('admin.users.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('users', [
        'name' => 'Gudang Baru',
        'email' => 'gudang.baru@example.com',
        'role' => 'petugas_gudang',
    ]);
});

test('admin can update an existing user', function () {
    $user = User::factory()->create([
        'name' => 'User Lama',
        'email' => 'user.lama@example.com',
        'role' => 'customer',
    ]);

    $response = $this->actingAs($this->admin)->put(route('admin.users.update', $user), [
        'name' => 'User Diperbarui',
        'email' => 'user.baru@example.com',
        'role' => 'customer',
        'phone' => '08987654321',
        'address' => 'Jl. Merdeka No. 45, Bandung',
    ]);

    $response->assertRedirect(route('admin.users.index'));
    $response->assertSessionHas('success');

    $user->refresh();
    expect($user->name)->toBe('User Diperbarui');
    expect($user->email)->toBe('user.baru@example.com');
    expect($user->phone)->toBe('08987654321');
});

test('admin cannot demote self to customer', function () {
    $response = $this->actingAs($this->admin)->put(route('admin.users.update', $this->admin), [
        'name' => $this->admin->name,
        'email' => $this->admin->email,
        'role' => 'customer',
    ]);

    $response->assertSessionHas('error');
    $this->admin->refresh();
    expect($this->admin->role)->toBe('admin');
});

test('admin cannot delete own account', function () {
    $response = $this->actingAs($this->admin)->delete(route('admin.users.destroy', $this->admin));

    $response->assertSessionHas('error');
    $this->assertDatabaseHas('users', [
        'id' => $this->admin->id,
    ]);
});

test('admin can delete a customer user without active rentals', function () {
    $emptyUser = User::factory()->create([
        'name' => 'User Hapus',
        'email' => 'hapus@example.com',
        'role' => 'customer',
    ]);

    $response = $this->actingAs($this->admin)->delete(route('admin.users.destroy', $emptyUser));

    $response->assertRedirect(route('admin.users.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseMissing('users', [
        'id' => $emptyUser->id,
    ]);
});
