<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BrandRequest;
use App\Models\Brand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    /**
     * Display a listing of equipment brands/merks.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status');

        $query = Brand::query()
            ->withCount('equipment');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('is_active', filter_var($status, FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = (int) $request->input('per_page', 5);
        if (! in_array($perPage, [5, 10, 20, 50, 100])) {
            $perPage = 5;
        }

        $brands = $query->orderBy('name')->paginate($perPage)->withQueryString();

        $stats = [
            'total_brands' => Brand::count(),
            'active_brands' => Brand::where('is_active', true)->count(),
            'inactive_brands' => Brand::where('is_active', false)->count(),
            'total_branded_equipment' => Brand::withCount('equipment')->get()->sum('equipment_count'),
        ];

        return Inertia::render('admin/brands/index', [
            'brands' => $brands,
            'stats' => $stats,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created brand in storage.
     */
    public function store(BrandRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if (empty($data['slug'])) {
            $baseSlug = Str::slug($data['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (Brand::where('slug', $slug)->exists()) {
                $slug = $baseSlug.'-'.$counter++;
            }
            $data['slug'] = $slug;
        }

        if ($request->hasFile('logo')) {
            $data['logo_url'] = '/storage/'.$request->file('logo')->store('brands', 'public');
        }

        $data['is_active'] = $request->boolean('is_active', true);

        Brand::create($data);

        return redirect()->route('admin.brands.index')
            ->with('success', "Brand '{$data['name']}' berhasil ditambahkan.");
    }

    /**
     * Update the specified brand in storage.
     */
    public function update(BrandRequest $request, Brand $brand): RedirectResponse
    {
        $data = $request->validated();

        if (empty($data['slug'])) {
            $baseSlug = Str::slug($data['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (Brand::where('slug', $slug)->where('id', '!=', $brand->id)->exists()) {
                $slug = $baseSlug.'-'.$counter++;
            }
            $data['slug'] = $slug;
        }

        if ($request->hasFile('logo')) {
            if ($brand->logo_url && Str::startsWith($brand->logo_url, '/storage/')) {
                $oldPath = Str::replaceFirst('/storage/', '', $brand->logo_url);
                Storage::disk('public')->delete($oldPath);
            }
            $data['logo_url'] = '/storage/'.$request->file('logo')->store('brands', 'public');
        }

        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }

        $brand->update($data);

        return redirect()->route('admin.brands.index')
            ->with('success', "Brand '{$brand->name}' berhasil diperbarui.");
    }

    /**
     * Remove the specified brand from storage.
     */
    public function destroy(Brand $brand): RedirectResponse
    {
        $equipmentCount = $brand->equipment()->count();

        if ($equipmentCount > 0) {
            return back()->with('error', "Brand '{$brand->name}' tidak dapat dihapus karena masih digunakan oleh {$equipmentCount} alat camping. Ubah brand pada alat terkait terlebih dahulu.");
        }

        if ($brand->logo_url && Str::startsWith($brand->logo_url, '/storage/')) {
            $oldPath = Str::replaceFirst('/storage/', '', $brand->logo_url);
            Storage::disk('public')->delete($oldPath);
        }

        $name = $brand->name;
        $brand->delete();

        return redirect()->route('admin.brands.index')
            ->with('success', "Brand '{$name}' berhasil dihapus.");
    }
}
