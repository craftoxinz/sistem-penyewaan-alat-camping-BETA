<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    /**
     * Store a newly created expense record.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category' => ['required', 'string', 'in:pemeliharaan_alat,perlengkapan_alat,operasional_toko,gaji_karyawan,lain_lain'],
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:1'],
            'expense_date' => ['required', 'date'],
            'payment_method' => ['required', 'string', 'in:cash,transfer'],
            'payment_status' => ['required', 'string', 'in:paid,unpaid'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $validated['expense_number'] = Expense::generateExpenseNumber();
        $validated['user_id'] = $request->user()->id;

        Expense::create($validated);

        return back()->with('success', 'Catatan pengeluaran operasional berhasil disimpan.');
    }

    /**
     * Update the specified expense record.
     */
    public function update(Request $request, Expense $expense): RedirectResponse
    {
        $validated = $request->validate([
            'category' => ['required', 'string', 'in:pemeliharaan_alat,perlengkapan_alat,operasional_toko,gaji_karyawan,lain_lain'],
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:1'],
            'expense_date' => ['required', 'date'],
            'payment_method' => ['required', 'string', 'in:cash,transfer'],
            'payment_status' => ['required', 'string', 'in:paid,unpaid'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $expense->update($validated);

        return back()->with('success', 'Catatan pengeluaran operasional berhasil diperbarui.');
    }

    /**
     * Remove the specified expense record.
     */
    public function destroy(Expense $expense): RedirectResponse
    {
        $expense->delete();

        return back()->with('success', 'Catatan pengeluaran berhasil dihapus.');
    }
}
