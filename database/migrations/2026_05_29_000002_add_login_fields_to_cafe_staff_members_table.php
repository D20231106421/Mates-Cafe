<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('cafe_staff_members', 'email')) {
            Schema::table('cafe_staff_members', function (Blueprint $table) {
                $table->string('email')->nullable()->after('name');
                $table->string('password')->default('123456')->after('email');
            });
        }

        DB::table('cafe_staff_members')->where('name', 'Sarah')->update([
            'email' => 'staff@mates.com',
            'password' => '123456',
        ]);

        DB::table('cafe_staff_members')->where('name', 'Amin')->update([
            'email' => 'amin@mates.com',
            'password' => '123456',
        ]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('cafe_staff_members', 'email')) {
            Schema::table('cafe_staff_members', function (Blueprint $table) {
                $table->dropColumn(['email', 'password']);
            });
        }
    }
};
