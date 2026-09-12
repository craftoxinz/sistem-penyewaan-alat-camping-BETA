<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated admin user is redirected to admin dashboard', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('admin.dashboard'));

    $dashboardResponse = $this->get(route('admin.dashboard'));
    $dashboardResponse->assertOk();
});

test('authenticated customer is redirected to my bookings page', function () {
    $user = User::factory()->create(['role' => 'customer']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('bookings.index'));

    $bookingsResponse = $this->get(route('bookings.index'));
    $bookingsResponse->assertOk();
});
