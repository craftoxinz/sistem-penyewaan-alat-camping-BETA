<?php

use App\Models\Category;
use App\Models\User;
use Database\Seeders\CampingRentalSeeder;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
    $this->admin = User::where('role', 'admin')->first();
    $this->customer = User::where('role', 'customer')->first();
});

test('unauthenticated guest cannot access admin categories index', function () {
    $response = $this->get(route('admin.categories.index'));

    $response->assertRedirect(route('login'));
});

test('customer role cannot access admin categories index', function () {
    $response = $this->actingAs($this->customer)->get(route('admin.categories.index'));

    $response->assertForbidden();
});

test('admin can view categories index page', function () {
    $response = $this->actingAs($this->admin)->get(route('admin.categories.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/categories/index')
        ->has('categories')
        ->has('stats')
        ->has('filters')
    );
});

test('admin can search categories by keyword', function () {
    $category = Category::first();

    $response = $this->actingAs($this->admin)->get(route('admin.categories.index', [
        'search' => $category->name,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/categories/index')
        ->where('filters.search', $category->name)
    );
});

test('admin can create a new category', function () {
    $response = $this->actingAs($this->admin)->post(route('admin.categories.store'), [
        'name' => 'Trekking & Hiking Poles',
        'icon' => 'Compass',
        'description' => 'Tongkat pendakian ultralight dan aksesoris trekking.',
    ]);

    $response->assertRedirect(route('admin.categories.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('categories', [
        'name' => 'Trekking & Hiking Poles',
        'slug' => 'trekking-hiking-poles',
        'icon' => 'Compass',
    ]);
});

test('admin can update an existing category', function () {
    $category = Category::create([
        'name' => 'Kategori Dummy',
        'slug' => 'kategori-dummy',
        'icon' => 'Tent',
        'description' => 'Deskripsi dummy lama',
    ]);

    $response = $this->actingAs($this->admin)->put(route('admin.categories.update', $category), [
        'name' => 'Kategori Dummy Baru',
        'slug' => 'kategori-dummy-baru',
        'icon' => 'Mountain',
        'description' => 'Deskripsi dummy baru yang diperbarui',
    ]);

    $response->assertRedirect(route('admin.categories.index'));
    $response->assertSessionHas('success');

    $category->refresh();
    expect($category->name)->toBe('Kategori Dummy Baru');
    expect($category->slug)->toBe('kategori-dummy-baru');
    expect($category->icon)->toBe('Mountain');
});

test('admin cannot delete a category that still has associated equipment', function () {
    $categoryWithEquipment = Category::has('equipment')->first();

    $response = $this->actingAs($this->admin)->delete(route('admin.categories.destroy', $categoryWithEquipment));

    $response->assertSessionHas('error');
    $this->assertDatabaseHas('categories', [
        'id' => $categoryWithEquipment->id,
    ]);
});

test('admin can delete a category that has no equipment', function () {
    $emptyCategory = Category::create([
        'name' => 'Kategori Kosong',
        'slug' => 'kategori-kosong',
        'icon' => 'Sparkles',
    ]);

    $response = $this->actingAs($this->admin)->delete(route('admin.categories.destroy', $emptyCategory));

    $response->assertRedirect(route('admin.categories.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseMissing('categories', [
        'id' => $emptyCategory->id,
    ]);
});
