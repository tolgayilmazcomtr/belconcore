<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserController extends Controller
{
    // Module permission constants
    const MODULES = [
        'module.dashboard',
        'module.projects',
        'module.crm',
        'module.accounting',
        'module.stock',
        'module.site',
        'module.reports',
        'module.settings',
    ];

    // Default module access per role
    const ROLE_DEFAULTS = [
        'Admin'           => ['module.dashboard','module.projects','module.crm','module.accounting','module.stock','module.site','module.reports','module.settings'],
        'Project Manager' => ['module.dashboard','module.projects','module.crm','module.reports'],
        'Sales'           => ['module.dashboard','module.crm'],
        'Accounting'      => ['module.dashboard','module.accounting','module.reports'],
        'Site Supervisor' => ['module.dashboard','module.projects','module.site','module.stock'],
    ];

    private function ensurePermissionsExist(): void
    {
        foreach (self::MODULES as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }
    }

    // ─── Users ───────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $this->adminOnly($request);
        $users = User::with('roles')->withCount('projects')->orderBy('name')->get()
            ->map(fn($u) => [
                'id'             => $u->id,
                'name'           => $u->name,
                'email'          => $u->email,
                'role'           => $u->roles->first()?->name,
                'projects_count' => $u->projects_count,
                'created_at'     => $u->created_at,
            ]);
        return response()->json(['data' => $users]);
    }

    public function store(Request $request)
    {
        $this->adminOnly($request);
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role'     => 'required|string|exists:roles,name',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);
        $user->syncRoles([$data['role']]);

        return response()->json([
            'message' => 'Kullanıcı oluşturuldu.',
            'data'    => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $data['role']],
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $this->adminOnly($request);
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'email'    => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'role'     => 'sometimes|string|exists:roles,name',
        ]);

        if (!empty($data['name']))     $user->name  = $data['name'];
        if (!empty($data['email']))    $user->email = $data['email'];
        if (!empty($data['password'])) $user->password = Hash::make($data['password']);
        $user->save();

        if (!empty($data['role'])) $user->syncRoles([$data['role']]);

        return response()->json(['message' => 'Kullanıcı güncellendi.', 'data' => $user->load('roles')]);
    }

    public function destroy(Request $request, string $id)
    {
        $this->adminOnly($request);
        if ((int)$id === $request->user()->id) {
            return response()->json(['message' => 'Kendi hesabınızı silemezsiniz.'], 422);
        }
        User::findOrFail($id)->delete();
        return response()->json(['message' => 'Kullanıcı silindi.']);
    }

    // ─── Roles ───────────────────────────────────────────────────────────────────

    public function roles(Request $request)
    {
        $this->adminOnly($request);
        $this->ensurePermissionsExist();

        $roles = Role::with('permissions')->orderBy('name')->get()->map(fn($r) => [
            'id'          => $r->id,
            'name'        => $r->name,
            'permissions' => $r->permissions->pluck('name')->filter(fn($p) => str_starts_with($p, 'module.'))->values(),
        ]);

        return response()->json(['data' => $roles, 'modules' => self::MODULES]);
    }

    public function updateRolePermissions(Request $request, string $roleId)
    {
        $this->adminOnly($request);
        $data = $request->validate([
            'permissions'   => 'required|array',
            'permissions.*' => 'string|starts_with:module.',
        ]);

        $this->ensurePermissionsExist();
        $role = Role::findOrFail($roleId);

        // Only sync module.* permissions, keep other permissions untouched
        $otherPerms = $role->permissions->filter(fn($p) => !str_starts_with($p->name, 'module.'))->pluck('name');
        $role->syncPermissions(array_merge($otherPerms->toArray(), $data['permissions']));

        return response()->json([
            'message'     => 'Rol izinleri güncellendi.',
            'permissions' => $data['permissions'],
        ]);
    }

    public function initRoleDefaults(Request $request)
    {
        $this->adminOnly($request);
        $this->ensurePermissionsExist();

        foreach (self::ROLE_DEFAULTS as $roleName => $modules) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->syncPermissions($modules);
            }
        }

        return response()->json(['message' => 'Varsayılan rol izinleri uygulandı.']);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private function adminOnly(Request $request): void
    {
        if (!$request->user()?->hasRole('Admin')) {
            abort(403, 'Bu işlem için yönetici yetkisi gereklidir.');
        }
    }
}
