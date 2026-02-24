<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasProjectAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Admin rolü her projeye erişebilir
        if ($user->hasRole('Admin')) {
            return $next($request);
        }

        // İstekten veya kullanıcının mevcut projesinden project_id'yi al
        $projectId = $request->header('X-Project-Id') ?? $user->current_project_id;

        if (!$projectId) {
            return response()->json(['message' => 'Lütfen bir proje seçin.'], 403);
        }

        // Kullanıcının bu projeye atanıp atanmadığını kontrol et
        if (!$user->projects()->where('project_id', $projectId)->exists()) {
            return response()->json(['message' => 'Bu projeye erişim yetkiniz bulunmuyor.'], 403);
        }

        // Proje id'sini diğer kontroller veya sorgular için request'e dahil et
        $request->merge(['active_project_id' => $projectId]);

        return $next($request);
    }
}
