<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsStaff
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || ! $request->user()->isStaff()) {
            abort(403, 'Akses ditolak. Halaman ini hanya dapat diakses oleh Staff (Admin, Kasir, atau Petugas Gudang).');
        }

        return $next($request);
    }
}
