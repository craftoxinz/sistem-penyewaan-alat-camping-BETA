<?php

use App\Models\Category;
use App\Models\Equipment;
use Carbon\Carbon;
use Database\Seeders\CampingRentalSeeder;

beforeEach(function () {
    $this->seed(CampingRentalSeeder::class);
});

test('guest can access public equipment catalog without login (SRS-F-001)', function () {
    $response = $this->get(route('home'));

    $response->assertOk();
});

test('guest can filter catalog by category and search keyword', function () {
    $category = Category::first();
    $equipment = Equipment::where('category_id', $category->id)->first();

    $response = $this->get(route('home', [
        'category' => $category->slug,
        'search' => $equipment->name,
    ]));

    $response->assertOk();
});

test('guest can filter catalog by brand', function () {
    $equipmentWithBrand = Equipment::whereNotNull('brand_id')->with('brand')->first();

    $response = $this->get(route('home', [
        'brand' => $equipmentWithBrand->brand->slug,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('catalog/index')
        ->where('filters.brand', $equipmentWithBrand->brand->slug)
        ->has('brands')
    );
});

test('guest can view equipment detail page with availability calendar (SRS-F-004)', function () {
    $equipment = Equipment::first();

    $response = $this->get(route('catalog.show', $equipment->slug));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('catalog/show')
        ->has('equipment')
        ->has('stats')
        ->has('calendarEvents')
    );
});

test('availability endpoint returns accurate stock for dates and prevents double booking', function () {
    $equipment = Equipment::first();
    $tomorrow = Carbon::tomorrow()->toDateString();
    $threeDaysLater = Carbon::tomorrow()->addDays(2)->toDateString();

    $response = $this->getJson(route('catalog.availability', [
        'equipment' => $equipment->slug,
        'start_date' => $tomorrow,
        'end_date' => $threeDaysLater,
        'quantity' => 1,
    ]));

    $response->assertOk();
    $response->assertJsonStructure([
        'available',
        'availableStock',
        'requestedQuantity',
        'message',
    ]);
});
