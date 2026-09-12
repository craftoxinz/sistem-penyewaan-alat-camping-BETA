<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EquipmentRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Equipment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EquipmentController extends Controller
{
    /**
     * Display a listing of equipment (SRS-F-003).
     */
    public function index(Request $request): Response
    {
        $categories = Category::orderBy('name')->get();
        $brands = Brand::orderBy('name')->get();

        $query = Equipment::query()
            ->with(['category', 'brand'])
            ->withCount([
                'units as total_units_count',
                'units as available_units_count' => function ($q) {
                    $q->where('status', 'tersedia')->where('condition', '!=', 'rusak');
                },
                'units as rented_units_count' => function ($q) {
                    $q->where('status', 'disewa');
                },
                'units as maintenance_units_count' => function ($q) {
                    $q->whereIn('status', ['maintenance', 'afkir'])->orWhere('condition', 'rusak');
                },
            ]);

        if ($request->filled('category')) {
            $query->where('category_id', $request->input('category'));
        }

        if ($request->filled('brand')) {
            $query->where('brand_id', $request->input('brand'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 5);
        if (! in_array($perPage, [5, 10, 20, 50, 100])) {
            $perPage = 5;
        }

        $equipment = $query->latest()->paginate($perPage)->withQueryString();

        return Inertia::render('admin/equipment/index', [
            'equipment' => $equipment,
            'categories' => $categories,
            'brands' => $brands,
            'filters' => [
                'category' => $request->input('category', ''),
                'brand' => $request->input('brand', ''),
                'search' => $request->input('search', ''),
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show the form for creating a new equipment.
     */
    public function create(): Response
    {
        $categories = Category::orderBy('name')->get();
        $brands = Brand::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('admin/equipment/form', [
            'categories' => $categories,
            'brands' => $brands,
            'equipment' => null,
        ]);
    }

    /**
     * Store a newly created equipment in storage.
     */
    public function store(EquipmentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']).'-'.Str::lower(Str::random(4));
        }

        if ($request->hasFile('image')) {
            $data['image_url'] = '/storage/'.$request->file('image')->store('equipment', 'public');
        }

        $data['fine_minor_damage'] = $data['fine_minor_damage'] ?? 0;
        $data['fine_heavy_damage'] = $data['fine_heavy_damage'] ?? 0;
        $data['fine_lost'] = $data['fine_lost'] ?? 0;

        Equipment::create($data);

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Data alat camping berhasil ditambahkan.');
    }

    /**
     * Show the form for editing the specified equipment.
     */
    public function edit(Equipment $equipment): Response
    {
        $categories = Category::orderBy('name')->get();
        $brands = Brand::orderBy('name')->get();

        return Inertia::render('admin/equipment/form', [
            'categories' => $categories,
            'brands' => $brands,
            'equipment' => $equipment,
        ]);
    }

    /**
     * Update the specified equipment in storage.
     */
    public function update(EquipmentRequest $request, Equipment $equipment): RedirectResponse
    {
        $data = $request->validated();

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        if ($request->hasFile('image')) {
            if ($equipment->image_url && Str::startsWith($equipment->image_url, '/storage/')) {
                $oldPath = Str::replaceFirst('/storage/', '', $equipment->image_url);
                Storage::disk('public')->delete($oldPath);
            }
            $data['image_url'] = '/storage/'.$request->file('image')->store('equipment', 'public');
        }

        $data['fine_minor_damage'] = $data['fine_minor_damage'] ?? 0;
        $data['fine_heavy_damage'] = $data['fine_heavy_damage'] ?? 0;
        $data['fine_lost'] = $data['fine_lost'] ?? 0;

        $equipment->update($data);

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Data alat camping berhasil diperbarui.');
    }

    /**
     * Remove the specified equipment from storage.
     */
    public function destroy(Equipment $equipment): RedirectResponse
    {
        if ($equipment->image_url && Str::startsWith($equipment->image_url, '/storage/')) {
            $oldPath = Str::replaceFirst('/storage/', '', $equipment->image_url);
            Storage::disk('public')->delete($oldPath);
        }

        $equipment->delete();

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Data alat camping berhasil dihapus.');
    }
}
