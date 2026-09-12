<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Income;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class IncomeController extends Controller
{
    /**
     * Store a newly created income record.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category' => ['required', 'string', 'in:penjualan_barang,jasa_layanan,modal_tambahan,pendapatan_bunga,klaim_kompensasi,lain_lain'],
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:1'],
            'income_date' => ['required', 'date'],
            'payment_method' => ['required', 'string', 'in:cash,transfer'],
            'payment_status' => ['required', 'string', 'in:received,pending'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $validated['income_number'] = Income::generateIncomeNumber();
        $validated['user_id'] = $request->user()->id;

        Income::create($validated);

        return back()->with('success', 'Catatan pendapatan berhasil disimpan.');
    }

    /**
     * Update the specified income record.
     */
    public function update(Request $request, Income $income): RedirectResponse
    {
        $validated = $request->validate([
            'category' => ['required', 'string', 'in:penjualan_barang,jasa_layanan,modal_tambahan,pendapatan_bunga,klaim_kompensasi,lain_lain'],
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:1'],
            'income_date' => ['required', 'date'],
            'payment_method' => ['required', 'string', 'in:cash,transfer'],
            'payment_status' => ['required', 'string', 'in:received,pending'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $income->update($validated);

        return back()->with('success', 'Catatan pendapatan berhasil diperbarui.');
    }

    /**
     * Remove the specified income record.
     */
    public function destroy(Income $income): RedirectResponse
    {
        $income->delete();

        return back()->with('success', 'Catatan pendapatan berhasil dihapus.');
    }
}
