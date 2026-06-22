<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('cafe_menu_items', 'image_url')) {
            Schema::table('cafe_menu_items', function (Blueprint $table) {
                $table->longText('image_url')->nullable()->after('icon_type');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('cafe_menu_items', 'image_url')) {
            Schema::table('cafe_menu_items', function (Blueprint $table) {
                $table->dropColumn('image_url');
            });
        }
    }
};
