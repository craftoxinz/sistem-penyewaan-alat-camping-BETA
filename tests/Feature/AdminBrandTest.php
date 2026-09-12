<?php

use App\Models\Brand;
use App\Models\User;
use Database\Seeders\CampingRentalSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
    $this->admin = User::where('role', 'admin')->first();
    $this->customer = User::where('role', 'customer')->first();
});

test('unauthenticated guest cannot access admin brands index', function () {
    $response = $this->get(route('admin.brands.index'));

    $response->assertRedirect(route('login'));
});

test('customer role cannot access admin brands index', function () {
    $response = $this->actingAs($this->customer)->get(route('admin.brands.index'));

    $response->assertForbidden();
});

test('admin can view brands index page', function () {
    $response = $this->actingAs($this->admin)->get(route('admin.brands.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/brands/index')
        ->has('brands')
        ->has('stats')
        ->has('filters')
    );
});

test('admin can filter brands by status and search', function () {
    $brand = Brand::first();

    $response = $this->actingAs($this->admin)->get(route('admin.brands.index', [
        'search' => $brand->name,
        'status' => '1',
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/brands/index')
        ->where('filters.search', $brand->name)
        ->where('filters.status', '1')
    );
});

test('admin can create a new brand with logo upload', function () {
    Storage::fake('public');

    $logo = UploadedFile::fake()->image('brand_logo.png', 200, 200);

    $response = $this->actingAs($this->admin)->post(route('admin.brands.store'), [
        'name' => 'Black Diamond Equipment',
        'website_url' => 'https://www.blackdiamondequipment.com',
        'description' => 'Merk perlengkapan panjat tebing dan headlamp nomor satu.',
        'is_active' => true,
        'logo' => $logo,
    ]);

    $response->assertRedirect(route('admin.brands.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('brands', [
        'name' => 'Black Diamond Equipment',
        'slug' => 'black-diamond-equipment',
        'is_active' => true,
    ]);

    $createdBrand = Brand::where('slug', 'black-diamond-equipment')->first();
    expect($createdBrand->logo_url)->not->toBeNull();
    Storage::disk('public')->assertExists(str_replace('/storage/', '', $createdBrand->logo_url));
});

test('admin can update an existing brand', function () {
    $brand = Brand::create([
        'name' => 'Merk Uji Coba',
        'slug' => 'merk-uji-coba',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->admin)->put(route('admin.brands.update', $brand), [
        'name' => 'Merk Uji Coba Diperbarui',
        'slug' => 'merk-uji-coba-diperbarui',
        'website_url' => 'https://brand-update.test',
        'description' => 'Deskripsi merk yang diperbarui',
        'is_active' => false,
    ]);

    $response->assertRedirect(route('admin.brands.index'));
    $response->assertSessionHas('success');

    $brand->refresh();
    expect($brand->name)->toBe('Merk Uji Coba Diperbarui');
    expect($brand->is_active)->toBeFalse();
});

test('admin cannot delete a brand that is still associated with equipment', function () {
    $brandWithEquipment = Brand::has('equipment')->first();

    $response = $this->actingAs($this->admin)->delete(route('admin.brands.destroy', $brandWithEquipment));

    $response->assertSessionHas('error');
    $this->assertDatabaseHas('brands', [
        'id' => $brandWithEquipment->id,
    ]);
});

test('admin can delete a brand with zero equipment', function () {
    $emptyBrand = Brand::create([
        'name' => 'Brand Tanpa Produk',
        'slug' => 'brand-tanpa-produk',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->admin)->delete(route('admin.brands.destroy', $emptyBrand));

    $response->assertRedirect(route('admin.brands.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseMissing('brands', [
        'id' => $emptyBrand->id,
    ]);
});
