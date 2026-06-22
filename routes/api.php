<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

Route::prefix('mates-cafe')->group(function () {
    Route::get('/bootstrap', function () {
        $customerEmail = request()->query('customerEmail');
        $ordersQuery = DB::table('cafe_orders')->orderByDesc('created_at');

        if (is_string($customerEmail) && $customerEmail !== '' && Schema::hasColumn('cafe_orders', 'customer_email')) {
            $ordersQuery->where('customer_email', $customerEmail);
        }

        return [
            'menuItems' => DB::table('cafe_menu_items')->orderBy('sort_order')->orderBy('id')->get()->map(fn ($item) => formatMenuItem($item)),
            'orders' => $ordersQuery->get()->map(fn ($order) => formatOrder($order)),
            'staffMembers' => DB::table('cafe_staff_members')->orderBy('id')->get()->map(fn ($staff) => formatStaffMember($staff)),
            'stockItems' => DB::table('cafe_stock_items')->orderBy('id')->get()->map(fn ($stock) => formatStockItem($stock)),
            'customers' => DB::table('cafe_customers')->orderBy('id')->get()->map(fn ($cust) => formatCustomer($cust)),
        ];
    });

    Route::post('/menu-items', function (Request $request) {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'basePrice' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'iconType' => ['nullable', 'string', 'max:255'],
            'imageUrl' => ['nullable', 'string'],
        ]);

        $maxSort = DB::table('cafe_menu_items')->max('sort_order') ?? 0;

        $id = DB::table('cafe_menu_items')->insertGetId([
            'name' => $data['name'],
            'category' => $data['category'],
            'base_price' => $data['basePrice'],
            'description' => $data['description'] ?? null,
            'icon_type' => $data['iconType'] ?? defaultIconType($data['category']),
            'image_url' => $data['imageUrl'] ?? null,
            'sort_order' => $maxSort + 1,
            'is_available' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return formatMenuItem(DB::table('cafe_menu_items')->find($id));
    });

    Route::put('/menu-items/{id}', function (Request $request, int $id) {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'basePrice' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'iconType' => ['nullable', 'string', 'max:255'],
            'imageUrl' => ['nullable', 'string'],
            'isAvailable' => ['nullable', 'boolean'],
        ]);

        $updates = [
            'name' => $data['name'],
            'category' => $data['category'],
            'base_price' => $data['basePrice'],
            'description' => $data['description'] ?? null,
            'icon_type' => $data['iconType'] ?? defaultIconType($data['category']),
            'image_url' => $data['imageUrl'] ?? null,
            'updated_at' => now(),
        ];

        if (array_key_exists('isAvailable', $data)) {
            $updates['is_available'] = $data['isAvailable'];
        }

        DB::table('cafe_menu_items')->where('id', $id)->update($updates);

        return formatMenuItem(DB::table('cafe_menu_items')->find($id));
    });

    Route::delete('/menu-items/{id}', function (int $id) {
        DB::table('cafe_menu_items')->where('id', $id)->delete();

        return response()->noContent();
    });

    Route::post('/menu-items/reorder', function (Request $request) {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        if (empty($data['ids'])) {
            return DB::table('cafe_menu_items')->orderBy('sort_order')->orderBy('id')->get()->map(fn ($item) => formatMenuItem($item));
        }

        $query = "UPDATE cafe_menu_items SET sort_order = CAST(CASE id ";
        $bindings = [];

        foreach ($data['ids'] as $index => $id) {
            $query .= "WHEN ? THEN ? ";
            $bindings[] = $id;
            $bindings[] = $index;
        }

        $query .= "END AS INTEGER), updated_at = ? WHERE id IN (" . implode(',', array_fill(0, count($data['ids']), '?')) . ")";
        $bindings[] = now();
        $bindings = array_merge($bindings, $data['ids']);

        DB::update($query, $bindings);

        return DB::table('cafe_menu_items')->orderBy('sort_order')->orderBy('id')->get()->map(fn ($item) => formatMenuItem($item));
    });

    Route::post('/orders', function (Request $request) {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'total' => ['required', 'numeric', 'min:0'],
            'payment' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'time' => ['required', 'string', 'max:255'],
            'date' => ['required', 'string', 'max:255'],
            'customer' => ['required', 'string', 'max:255'],
            'customerEmail' => ['nullable', 'string', 'max:255'],
            'customerPhone' => ['nullable', 'string', 'max:255'],
        ]);

        $id = DB::table('cafe_orders')->insertGetId([
            'order_number' => nextOrderNumber(),
            'items' => json_encode($data['items']),
            'total' => $data['total'],
            'payment' => $data['payment'],
            'status' => $data['status'] ?? 'Pending',
            'time' => $data['time'],
            'date' => $data['date'],
            'customer' => $data['customer'],
            'created_at' => now(),
            'updated_at' => now(),
        ] + (Schema::hasColumn('cafe_orders', 'customer_email') ? ['customer_email' => $data['customerEmail'] ?? null] : [])
          + (Schema::hasColumn('cafe_orders', 'customer_phone') ? ['customer_phone' => $data['customerPhone'] ?? null] : []));

        return formatOrder(DB::table('cafe_orders')->find($id));
    });

    Route::patch('/orders/customer-email', function (Request $request) {
        $data = $request->validate([
            'oldEmail' => ['required', 'string', 'max:255'],
            'newEmail' => ['required', 'string', 'max:255'],
        ]);

        if (Schema::hasColumn('cafe_orders', 'customer_email') && strcasecmp($data['oldEmail'], $data['newEmail']) !== 0) {
            DB::table('cafe_orders')
                ->where('customer_email', $data['oldEmail'])
                ->update([
                    'customer_email' => $data['newEmail'],
                    'updated_at' => now(),
                ]);
        }

        return response()->noContent();
    });

    Route::patch('/orders/{orderNumber}', function (Request $request, string $orderNumber) {
        $data = $request->validate([
            'status' => ['nullable', 'string', 'max:255'],
            'delay' => ['nullable', 'string', 'max:255'],
            'cancelReason' => ['nullable', 'string'],
        ]);

        $updates = ['updated_at' => now()];
        if (array_key_exists('status', $data)) {
            $updates['status'] = $data['status'];
        }
        if (array_key_exists('delay', $data)) {
            $updates['delay'] = $data['delay'];
        }
        if (array_key_exists('cancelReason', $data)) {
            $updates['cancel_reason'] = $data['cancelReason'];
        }

        DB::table('cafe_orders')->where('order_number', $orderNumber)->update($updates);

        return formatOrder(DB::table('cafe_orders')->where('order_number', $orderNumber)->first());
    });

    Route::post('/staff-members', function (Request $request) {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
        ]);

        $id = DB::table('cafe_staff_members')->insertGetId([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return formatStaffMember(DB::table('cafe_staff_members')->find($id));
    });

    Route::put('/staff-members/{id}', function (Request $request, int $id) {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
        ]);

        DB::table('cafe_staff_members')->where('id', $id)->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
            'updated_at' => now(),
        ]);

        return formatStaffMember(DB::table('cafe_staff_members')->find($id));
    });

    Route::delete('/staff-members/{id}', function (int $id) {
        DB::table('cafe_staff_members')->where('id', $id)->delete();

        return response()->noContent();
    });

    Route::post('/customers', function (Request $request) {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        $id = DB::table('cafe_customers')->insertGetId([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return formatCustomer(DB::table('cafe_customers')->find($id));
    });

    Route::put('/customers/{id}', function (Request $request, int $id) {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        DB::table('cafe_customers')->where('id', $id)->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'updated_at' => now(),
        ]);

        return formatCustomer(DB::table('cafe_customers')->find($id));
    });

    Route::delete('/customers/{id}', function (int $id) {
        DB::table('cafe_customers')->where('id', $id)->delete();

        return response()->noContent();
    });

    Route::post('/stock-items', function (Request $request) {
        $data = validateStockItem($request);

        $id = DB::table('cafe_stock_items')->insertGetId([
            ...stockDatabasePayload($data),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return formatStockItem(DB::table('cafe_stock_items')->find($id));
    });

    Route::put('/stock-items/{id}', function (Request $request, int $id) {
        $data = validateStockItem($request);

        DB::table('cafe_stock_items')->where('id', $id)->update([
            ...stockDatabasePayload($data),
            'updated_at' => now(),
        ]);

        return formatStockItem(DB::table('cafe_stock_items')->find($id));
    });

    Route::delete('/stock-items/{id}', function (int $id) {
        DB::table('cafe_stock_items')->where('id', $id)->delete();

        return response()->noContent();
    });
});

function validateStockItem(Request $request): array
{
    return $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'quantity' => ['required', 'integer', 'min:0'],
        'unit' => ['required', 'string', 'max:255'],
        'lowStockAlert' => ['required', 'integer', 'min:0'],
    ]);
}

function stockDatabasePayload(array $data): array
{
    return [
        'name' => $data['name'],
        'quantity' => $data['quantity'],
        'unit' => $data['unit'],
        'low_stock_alert' => $data['lowStockAlert'],
    ];
}

function formatMenuItem(object $item): array
{
    return [
        'id' => $item->id,
        'name' => $item->name,
        'category' => $item->category,
        'basePrice' => (float) $item->base_price,
        'description' => $item->description,
        'iconType' => $item->icon_type,
        'imageUrl' => $item->image_url ?? null,
        'isAvailable' => (bool) ($item->is_available ?? true),
        'sortOrder' => (int) ($item->sort_order ?? 0),
    ];
}

function formatOrder(object $order): array
{
    return [
        'id' => $order->order_number,
        'items' => json_decode($order->items, true) ?: [],
        'total' => (float) $order->total,
        'payment' => $order->payment,
        'status' => $order->status,
        'time' => $order->time,
        'date' => $order->date,
        'customer' => $order->customer,
        'customerEmail' => $order->customer_email ?? null,
        'customerPhone' => $order->customer_phone ?? null,
        'delay' => $order->delay,
        'cancelReason' => $order->cancel_reason,
    ];
}

function formatStaffMember(object $staff): array
{
    return [
        'id' => $staff->id,
        'name' => $staff->name,
        'email' => $staff->email ?? '',
        'password' => $staff->password ?? '',
        'role' => $staff->role,
    ];
}

function formatCustomer(object $cust): array
{
    return [
        'id' => $cust->id,
        'name' => $cust->name,
        'email' => $cust->email ?? '',
        'password' => $cust->password ?? '',
    ];
}

function formatStockItem(object $stock): array
{
    return [
        'id' => $stock->id,
        'name' => $stock->name,
        'quantity' => $stock->quantity,
        'unit' => $stock->unit,
        'lowStockAlert' => $stock->low_stock_alert,
    ];
}

function defaultIconType(string $category): string
{
    return in_array($category, ['Coffee', 'Non-Coffee', 'Fizz'], true) ? 'coffee' : 'food';
}

function nextOrderNumber(): string
{
    do {
        $number = 'MC-'.random_int(1000, 9999);
    } while (DB::table('cafe_orders')->where('order_number', $number)->exists());

    return $number;
}
