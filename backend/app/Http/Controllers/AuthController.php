<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Verilen bilgiler kayıtlarımızla eşleşmiyor.'],
            ]);
        }

        // Return token and user data
        return response()->json([
            'user' => $user->load('roles'), // If using roles
            'token' => $user->createToken('auth_token')->plainTextToken,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Başarıyla çıkış yapıldı'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('roles');
        $modules = $user->hasRole('Admin')
            ? \App\Http\Controllers\UserController::MODULES
            : $user->getAllPermissions()->pluck('name')
                ->filter(fn($p) => str_starts_with($p, 'module.'))->values()->toArray();

        return response()->json([
            'user'    => $user,
            'modules' => $modules,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|unique:users,email,' . $user->id,
            'current_password'      => 'nullable|string',
            'password'              => 'nullable|string|min:8|confirmed',
        ]);

        if (!empty($validated['password'])) {
            if (empty($validated['current_password']) || !Hash::check($validated['current_password'], $user->password)) {
                return response()->json(['message' => 'Mevcut şifre hatalı.'], 422);
            }
            $user->password = Hash::make($validated['password']);
        }

        $user->name  = $validated['name'];
        $user->email = $validated['email'];
        $user->save();

        return response()->json(['message' => 'Profil güncellendi.', 'user' => $user->load('roles')]);
    }
}
