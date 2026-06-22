<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cafe_menu_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->decimal('base_price', 8, 2);
            $table->text('description')->nullable();
            $table->string('icon_type')->default('coffee');
            $table->timestamps();
        });

        Schema::create('cafe_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->json('items');
            $table->decimal('total', 8, 2);
            $table->string('payment');
            $table->string('status')->default('Pending');
            $table->string('time');
            $table->string('date');
            $table->string('customer');
            $table->string('delay')->nullable();
            $table->text('cancel_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('cafe_staff_members', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('role');
            $table->timestamps();
        });

        Schema::create('cafe_stock_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('quantity')->default(0);
            $table->string('unit')->default('pcs');
            $table->unsignedInteger('low_stock_alert')->default(10);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cafe_stock_items');
        Schema::dropIfExists('cafe_staff_members');
        Schema::dropIfExists('cafe_orders');
        Schema::dropIfExists('cafe_menu_items');
    }
};
