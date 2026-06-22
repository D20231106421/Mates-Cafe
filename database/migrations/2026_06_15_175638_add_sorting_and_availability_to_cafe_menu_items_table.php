<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cafe_menu_items', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->after('icon_type');
            $table->boolean('is_available')->default(true)->after('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cafe_menu_items', function (Blueprint $table) {
            $table->dropColumn(['sort_order', 'is_available']);
        });
    }
};
