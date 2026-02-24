<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Models\Project;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Default Roles
        $adminRole = Role::create(['name' => 'Admin']);
        Role::create(['name' => 'Project Manager']);
        Role::create(['name' => 'Sales']);
        Role::create(['name' => 'Accounting']);
        Role::create(['name' => 'Site Supervisor']);

        // Create Super Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@belconcore.com'],
            [
                'name' => 'Belcon Sistem Yöneticisi',
                'password' => Hash::make('password'),
            ]
        );
        $admin->assignRole($adminRole);
    }
}
