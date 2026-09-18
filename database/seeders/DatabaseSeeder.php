<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\ParkingSlot;
use App\Models\FuelProduct;
use App\Models\Supplier;
use App\Models\Promo;
use App\Models\Vehicle;
use App\Models\Booking;
use App\Models\ParkingTransaction;
use App\Models\ParkingPayment;
use App\Models\FuelInventory;
use App\Models\FuelSale;
use App\Models\GasolinePayment;
use App\Models\InventoryLog;
use App\Models\ParkingRemittance;
use App\Models\FuelRemittance;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Clear tables in correct order
        $tables = [
            'inventory_logs', 'gasoline_payments', 'fuel_sales', 'fuel_inventory',
            'fuel_remittances', 'parking_remittances', 'parking_payments',
            'parking_transactions', 'bookings', 'vehicles', 'promo',
            'parking_slots', 'fuel_products', 'suppliers', 'otp_codes', 'users'
        ];

        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // ─── 1. Create Users ──────────────────────────────────────────────────

        // Admin
        $admin = User::create([
            'email'          => 'admin@parking.com',
            'password'       => Hash::make('password123'),
            'first_name'     => 'Admin',
            'middle_name'    => null,
            'last_name'      => 'User',
            'phone_number'   => '09123456789',
            'address'        => '123 Admin St, Manila, Philippines',
            'role'           => 'admin',
            'customer_type'  => null,
            'employee_id'    => 'ADMIN001',
            'is_active'      => true,
            'email_verified' => true,
        ]);

        // Staff
        $staff1 = User::create([
            'email'          => 'staff1@parking.com',
            'password'       => Hash::make('password123'),
            'first_name'     => 'John',
            'middle_name'    => 'Michael',
            'last_name'      => 'Doe',
            'phone_number'   => '09234567890',
            'address'        => '456 Staff St, Quezon City, Philippines',
            'role'           => 'staff',
            'customer_type'  => null,
            'employee_id'    => 'EMP001',
            'is_active'      => true,
            'email_verified' => true,
        ]);

        $staff2 = User::create([
            'email'          => 'staff2@parking.com',
            'password'       => Hash::make('password123'),
            'first_name'     => 'Jane',
            'middle_name'    => 'Marie',
            'last_name'      => 'Smith',
            'phone_number'   => '09345678901',
            'address'        => '789 Staff Ave, Makati City, Philippines',
            'role'           => 'staff',
            'customer_type'  => null,
            'employee_id'    => 'EMP002',
            'is_active'      => true,
            'email_verified' => true,
        ]);

        // ─── 2. Create Customers (20 customers with realistic data) ──────────

        $customers = [];
        $customerData = [
            // [first_name, middle_name, last_name, phone, email, address]
            ['Juan', 'Carlos', 'Dela Cruz', '09123456780', 'juan.delacruz@email.com', 'Blk 1 Lot 1, Tondo, Manila'],
            ['Maria', 'Isabel', 'Santos', '09234567891', 'maria.santos@email.com', 'Blk 2 Lot 2, Pasig City'],
            ['Pedro', 'Manuel', 'Reyes', '09345678902', 'pedro.reyes@email.com', 'Blk 3 Lot 3, Caloocan City'],
            ['Ana', 'Christina', 'Lopez', '09456789012', 'ana.lopez@email.com', 'Blk 4 Lot 4, Mandaluyong City'],
            ['Jose', 'Rizal', 'Garcia', '09567890123', 'jose.garcia@email.com', 'Blk 5 Lot 5, San Juan City'],
            ['Elena', 'Marie', 'Martinez', '09678901234', 'elena.martinez@email.com', 'Blk 6 Lot 6, Las Piñas City'],
            ['Ramon', 'Miguel', 'Fernandez', '09789012345', 'ramon.fernandez@email.com', 'Blk 7 Lot 7, Muntinlupa City'],
            ['Luisa', 'Angela', 'Gonzales', '09890123456', 'luisa.gonzales@email.com', 'Blk 8 Lot 8, Taguig City'],
            ['Antonio', 'Jose', 'Rodriguez', '09901234567', 'antonio.rodriguez@email.com', 'Blk 9 Lot 9, Paranaque City'],
            ['Carmen', 'Rosa', 'Flores', '09012345678', 'carmen.flores@email.com', 'Blk 10 Lot 10, Pasay City'],
            ['Ricardo', 'Alfonso', 'Cruz', '09123456781', 'ricardo.cruz@email.com', 'Blk 11 Lot 11, Malabon City'],
            ['Isabella', 'Marie', 'Torres', '09234567892', 'isabella.torres@email.com', 'Blk 12 Lot 12, Navotas City'],
            ['Fernando', 'Jose', 'Aquino', '09345678903', 'fernando.aquino@email.com', 'Blk 13 Lot 13, Valenzuela City'],
            ['Gloria', 'Macapagal', 'Ramos', '09456789013', 'gloria.ramos@email.com', 'Blk 14 Lot 14, Marikina City'],
            ['Benigno', 'Aquino', 'Cojuangco', '09567890124', 'benigno.cojuangco@email.com', 'Blk 15 Lot 15, Pateros City'],
            ['Corazon', 'Aquino', 'Sumulong', '09678901235', 'corazon.sumulong@email.com', 'Blk 16 Lot 16, Cainta, Rizal'],
            ['Ramon', 'Magsaysay', 'Tan', '09789012346', 'ramon.tan@email.com', 'Blk 17 Lot 17, Antipolo City'],
            ['Gloria', 'Arroyo', 'Macapagal', '09890123457', 'gloria.arroyo@email.com', 'Blk 18 Lot 18, Taytay, Rizal'],
            ['Rodrigo', 'Duterte', 'Roa', '09901234568', 'rodrigo.duterte@email.com', 'Blk 19 Lot 19, Davao City'],
            ['Leni', 'Robredo', 'Gerona', '09012345679', 'leni.robredo@email.com', 'Blk 20 Lot 20, Naga City'],
        ];

        foreach ($customerData as $i => $data) {
            $customers[] = User::create([
                'email'          => $data[4],
                'password'       => Hash::make('password123'),
                'first_name'     => $data[0],
                'middle_name'    => $data[1],
                'last_name'      => $data[2],
                'phone_number'   => $data[3],
                'address'        => $data[5],
                'role'           => 'customer',
                'customer_type'  => 'registered',
                'employee_id'    => null,
                'is_active'      => true,
                'email_verified' => true,
            ]);
        }

        // ─── 3. Create Parking Slots (30 slots with realistic numbering) ─────

        $slots = [];
        $slotConfigs = [
            // Ground Floor - A1 to A15
            ['A01', 250], ['A02', 250], ['A03', 250], ['A04', 250], ['A05', 250],
            ['A06', 250], ['A07', 250], ['A08', 250], ['A09', 250], ['A10', 250],
            ['A11', 250], ['A12', 250], ['A13', 250], ['A14', 250], ['A15', 250],
            // Second Floor - B1 to B10
            ['B01', 200], ['B02', 200], ['B03', 200], ['B04', 200], ['B05', 200],
            ['B06', 200], ['B07', 200], ['B08', 200], ['B09', 200], ['B10', 200],
            // VIP Section - V1 to V5
            ['V01', 500], ['V02', 500], ['V03', 500], ['V04', 500], ['V05', 500],
        ];

        foreach ($slotConfigs as $i => $config) {
            // Make first 5 slots occupied, last 2 maintenance, rest available
            $status = 'available';
            if ($i < 5) {
                $status = 'occupied';
            } elseif ($i >= count($slotConfigs) - 2) {
                $status = 'maintenance';
            }

            $slots[] = ParkingSlot::create([
                'slot_number'  => $config[0],
                'status'       => $status,
                'nightly_rate' => $config[1],
            ]);
        }

        // ─── 4. Create Vehicles for each customer ────────────────────────────

        $vehicles = [];
        $vehicleData = [
            ['ABC-1234', 'Toyota Vios 2022'],
            ['XYZ-5678', 'Honda Civic 2021'],
            ['DEF-9012', 'Mitsubishi Mirage 2023'],
            ['GHI-3456', 'Ford Ranger 2020'],
            ['JKL-7890', 'Nissan Navara 2022'],
            ['MNO-1234', 'Toyota Fortuner 2021'],
            ['PQR-5678', 'Hyundai Tucson 2023'],
            ['STU-9012', 'Kia Stonic 2022'],
            ['VWX-3456', 'Suzuki Ertiga 2021'],
            ['YZA-7890', 'Isuzu D-Max 2022'],
            ['BCD-1234', 'Mitsubishi Strada 2023'],
            ['EFG-5678', 'Toyota Innova 2022'],
            ['HIJ-9012', 'Nissan Terra 2021'],
            ['KLM-3456', 'Ford Everest 2022'],
            ['NOP-7890', 'Chevrolet Trailblazer 2023'],
            ['QRS-1234', 'Toyota Wigo 2022'],
            ['TUV-5678', 'Honda Brio 2023'],
            ['WXY-9012', 'Suzuki Swift 2022'],
            ['ZAB-3456', 'Hyundai Accent 2021'],
            ['CDE-7890', 'Kia Rio 2022'],
        ];

        foreach ($customers as $i => $customer) {
            $data = $vehicleData[$i % count($vehicleData)];
            $vehicles[] = Vehicle::create([
                'customer_id'   => $customer->id,
                'plate_number'  => $data[0],
                'vehicle_model' => $data[1],
            ]);
        }

        // Give some customers additional vehicles (for variety)
        $extraVehicles = [
            ['FGH-1234', 'Toyota Hilux 2022', 2],
            ['JKL-5678', 'Honda HR-V 2023', 4],
            ['MNO-9012', 'Mitsubishi Montero 2022', 6],
        ];

        foreach ($extraVehicles as $ev) {
            $customer = $customers[$ev[2] % count($customers)] ?? $customers[0];
            Vehicle::create([
                'customer_id'   => $customer->id,
                'plate_number'  => $ev[0],
                'vehicle_model' => $ev[1],
            ]);
        }

        // ─── 5. Create Promos ─────────────────────────────────────────────────

        $promos = [];
        $promoData = [
            ['Early Bird Discount', '10% off for bookings made 7 days in advance', 10],
            ['Weekend Special', '15% off for weekend stays (Fri-Sun)', 15],
            ['Long Stay Discount', '20% off for stays longer than 5 nights', 20],
            ['Senior Citizen Discount', '10% off for senior citizens with valid ID', 10],
            ['Holiday Promo', '25% off during selected holidays', 25],
            ['Park & Fly', 'Free shuttle to airport for 7+ night stays', 0],
            ['Corporate Rate', 'Special rates for corporate partners', 15],
            ['Student Discount', '15% off with valid student ID', 15],
        ];

        foreach ($promoData as $data) {
            $promos[] = Promo::create([
                'title'       => $data[0],
                'description' => $data[1],
                'discount'    => $data[2],
                'user_id'     => $admin->id,
            ]);
        }

        // ─── 6. Create Bookings (mix of statuses for all customers) ──────────

        $bookings = [];
        $statuses = ['pending', 'approved', 'completed', 'cancelled', 'rejected'];
        $bookingTypes = ['online', 'walk_in'];

        // Create at least 2-3 bookings per customer
        foreach ($customers as $i => $customer) {
            $vehicle = $vehicles[$i % count($vehicles)];
            $slot = $slots[$i % count($slots)];
            $promo = $i % 3 === 0 ? $promos[$i % count($promos)] : null;

            // 1. Past completed booking
            $checkIn = Carbon::now()->subDays(rand(5, 30))->setTime(14, 0, 0);
            $nights = rand(1, 5);
            $checkOut = $checkIn->copy()->addDays($nights)->setTime(12, 0, 0);

            $booking = Booking::create([
                'customer_id'     => $customer->id,
                'vehicle_id'      => $vehicle->id,
                'parking_slot_id' => $slot->id,
                'check_in_date'   => $checkIn,
                'check_out_date'  => $checkOut,
                'status'          => 'completed',
                'booking_type'    => $bookingTypes[$i % 2],
                'confirm_by_id'   => $i % 2 == 0 ? $admin->id : $staff1->id,
                'promo_id'        => $promo?->id,
            ]);

            $bookings[] = $booking;

            // Create transaction and payment for completed booking
            $transaction = ParkingTransaction::create([
                'booking_id'     => $booking->id,
                'check_out_date' => $checkOut,
                'checked_in_by'  => $staff1->id,
            ]);

            $totalAmount = $nights * $slot->nightly_rate;
            $discount = $promo ? ($promo->discount / 100 * $totalAmount) : 0;
            $finalAmount = $totalAmount - $discount;
            $amountPaid = $finalAmount + rand(0, 50); // Sometimes overpay
            $changeAmount = max(0, $amountPaid - $finalAmount);

            // ✅ FIX: Only use 'cash' or 'gcash' - removed 'card'
            $paymentMethod = ['cash', 'cash', 'gcash'][rand(0, 2)];

            ParkingPayment::create([
                'parking_transaction_id' => $transaction->id,
                'booking_id'             => $booking->id,
                'discount'               => $discount,
                'amount_paid'            => $amountPaid,
                'change_amount'          => $changeAmount,
                'payment_method'         => $paymentMethod,
                'status'                 => 'paid',
                'processed_by'           => $staff1->id,
                'paid_at'                => $checkOut,
            ]);

            // 2. Approved booking (not yet checked in)
            if ($i % 3 !== 0) {
                $checkIn = Carbon::now()->addDays(rand(1, 7))->setTime(14, 0, 0);
                $nights = rand(1, 4);
                $checkOut = $checkIn->copy()->addDays($nights)->setTime(12, 0, 0);

                $booking2 = Booking::create([
                    'customer_id'     => $customer->id,
                    'vehicle_id'      => $vehicle->id,
                    'parking_slot_id' => $slots[($i + 5) % count($slots)]->id,
                    'check_in_date'   => $checkIn,
                    'check_out_date'  => $checkOut,
                    'status'          => 'approved',
                    'booking_type'    => $bookingTypes[($i + 1) % 2],
                    'confirm_by_id'   => $admin->id,
                    'promo_id'        => $i % 4 === 0 ? $promos[($i + 2) % count($promos)]?->id : null,
                ]);

                $bookings[] = $booking2;
            }

            // 3. Pending booking (for some customers)
            if ($i % 2 === 0) {
                $checkIn = Carbon::now()->addDays(rand(2, 10))->setTime(14, 0, 0);
                $nights = rand(1, 3);
                $checkOut = $checkIn->copy()->addDays($nights)->setTime(12, 0, 0);

                $booking3 = Booking::create([
                    'customer_id'     => $customer->id,
                    'vehicle_id'      => $vehicle->id,
                    'parking_slot_id' => $slots[($i + 10) % count($slots)]->id,
                    'check_in_date'   => $checkIn,
                    'check_out_date'  => $checkOut,
                    'status'          => 'pending',
                    'booking_type'    => 'online',
                    'confirm_by_id'   => null,
                    'promo_id'        => $i % 5 === 0 ? $promos[($i + 3) % count($promos)]?->id : null,
                ]);

                $bookings[] = $booking3;
            }

            // 4. Cancelled booking (for some customers)
            if ($i % 3 === 1) {
                $checkIn = Carbon::now()->subDays(rand(3, 15))->setTime(14, 0, 0);
                $nights = rand(1, 3);
                $checkOut = $checkIn->copy()->addDays($nights)->setTime(12, 0, 0);

                $booking4 = Booking::create([
                    'customer_id'     => $customer->id,
                    'vehicle_id'      => $vehicle->id,
                    'parking_slot_id' => $slots[($i + 15) % count($slots)]->id,
                    'check_in_date'   => $checkIn,
                    'check_out_date'  => $checkOut,
                    'status'          => 'cancelled',
                    'booking_type'    => $bookingTypes[$i % 2],
                    'confirm_by_id'   => $admin->id,
                    'promo_id'        => null,
                ]);

                $bookings[] = $booking4;
            }

            // 5. Rejected booking (for some customers)
            if ($i % 5 === 0) {
                $checkIn = Carbon::now()->addDays(rand(1, 5))->setTime(14, 0, 0);
                $nights = rand(1, 2);
                $checkOut = $checkIn->copy()->addDays($nights)->setTime(12, 0, 0);

                $booking5 = Booking::create([
                    'customer_id'     => $customer->id,
                    'vehicle_id'      => $vehicle->id,
                    'parking_slot_id' => $slots[($i + 20) % count($slots)]->id,
                    'check_in_date'   => $checkIn,
                    'check_out_date'  => $checkOut,
                    'status'          => 'rejected',
                    'booking_type'    => 'online',
                    'confirm_by_id'   => $admin->id,
                    'promo_id'        => null,
                ]);

                $bookings[] = $booking5;
            }
        }

        // ─── 7. Create Active Parking Transactions ───────────────────────────

        // Get approved bookings that don't have transactions yet
        $approvedBookings = Booking::where('status', 'approved')
            ->whereDoesntHave('transaction')
            ->limit(8)
            ->get();

        foreach ($approvedBookings as $booking) {
            $transaction = ParkingTransaction::create([
                'booking_id'     => $booking->id,
                'check_out_date' => null,
                'checked_in_by'  => $staff1->id,
            ]);

            // Mark slot as occupied
            $slot = ParkingSlot::find($booking->parking_slot_id);
            if ($slot && $slot->status === 'available') {
                $slot->status = 'occupied';
                $slot->save();
            }

            // Create unpaid payment (will be paid at checkout)
            ParkingPayment::create([
                'parking_transaction_id' => $transaction->id,
                'booking_id'             => $booking->id,
                'discount'               => 0,
                'amount_paid'            => 0,
                'change_amount'          => 0,
                'payment_method'         => 'cash',
                'status'                 => 'unpaid',
                'processed_by'           => null,
                'paid_at'                => null,
            ]);
        }

        // ─── 8. Create Fuel Products ─────────────────────────────────────────

        $fuelProducts = [];
        $fuelTypes = [
            ['Premium Gasoline (95 Octane)', 62.75],
            ['Regular Gasoline (91 Octane)', 58.50],
            ['Diesel', 55.25],
            ['Premium Diesel', 58.00],
            ['Unleaded Gasoline', 56.75],
        ];

        foreach ($fuelTypes as $data) {
            $fuelProducts[] = FuelProduct::create([
                'type'                    => $data[0],
                'current_selling_price'   => $data[1],
            ]);
        }

        // ─── 9. Create Suppliers ──────────────────────────────────────────────

        $suppliers = [];
        $supplierNames = [
            'Petron Corporation',
            'Shell Philippines',
            'Caltex Philippines',
            'Unioil Philippines',
            'Phoenix Petroleum',
            'TotalEnergies Philippines',
        ];

        foreach ($supplierNames as $name) {
            $suppliers[] = Supplier::create([
                'supplier_name' => $name,
            ]);
        }

        // ─── 10. Create Fuel Inventory ────────────────────────────────────────

        $fuelInventories = [];

        foreach ($fuelProducts as $i => $product) {
            $supplier = $suppliers[$i % count($suppliers)];

            // Multiple deliveries for each product
            for ($j = 0; $j < 4; $j++) {
                $liters = rand(800, 3000);
                $costPrice = $product->current_selling_price * 0.85;
                $sellingPrice = $product->current_selling_price + rand(-3, 5);

                // Some deliveries are older (already partially sold)
                $daysAgo = rand(1, 60);
                $remainingLiters = $j < 2 ? max(0, $liters - rand(200, $liters - 100)) : $liters;

                $inventory = FuelInventory::create([
                    'fuel_product_id'         => $product->id,
                    'supplier_id'             => $supplier->id,
                    'delivery_date'           => Carbon::now()->subDays($daysAgo),
                    'liters_delivered'        => $liters,
                    'remaining_liters'        => $remainingLiters,
                    'cost_price_per_liter'    => $costPrice,
                    'selling_price_per_liter' => max(10, $sellingPrice),
                    'reference_no'            => 'INV-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                ]);

                $fuelInventories[] = $inventory;

                // Create inventory log for stock in
                InventoryLog::create([
                    'fuel_inventory_id' => $inventory->id,
                    'reference_id'      => $product->id,
                    'movement'          => 'in',
                    'liters'            => $liters,
                    'liters_before'     => 0,
                    'liters_after'      => $liters,
                    'price_per_liter'   => $costPrice,
                ]);

                // Create stock out logs for older deliveries
                if ($j < 2 && $remainingLiters < $liters) {
                    $soldLiters = $liters - $remainingLiters;
                    InventoryLog::create([
                        'fuel_inventory_id' => $inventory->id,
                        'reference_id'      => $product->id,
                        'movement'          => 'out',
                        'liters'            => $soldLiters,
                        'liters_before'     => $liters,
                        'liters_after'      => $remainingLiters,
                        'price_per_liter'   => $sellingPrice,
                    ]);
                }
            }
        }

        // ─── 11. Create Fuel Sales ─────────────────────────────────────────────

        $staffMembers = [$staff1, $staff2];
        $paymentMethods = ['cash', 'cash', 'gcash']; // ✅ FIX: Only cash and gcash

        foreach ($fuelInventories as $i => $inventory) {
            if ($inventory->remaining_liters > 0) {
                $numSales = rand(1, 5);
                $remaining = $inventory->remaining_liters;

                for ($s = 0; $s < $numSales && $remaining > 0; $s++) {
                    $litersSold = min(rand(20, 150), $remaining);
                    $pricePerLiter = $inventory->selling_price_per_liter;
                    $totalAmount = $litersSold * $pricePerLiter;
                    $amountPaid = $totalAmount + rand(0, 50);
                    $changeAmount = max(0, $amountPaid - $totalAmount);

                    $sale = FuelSale::create([
                        'fuel_inventory_id' => $inventory->id,
                        'recorded_by'       => $staffMembers[$i % 2]->id,
                        'sale_date'         => Carbon::now()->subHours(rand(1, 72)),
                        'liters_sold'       => $litersSold,
                        'price_per_liter'   => $pricePerLiter,
                    ]);

                    GasolinePayment::create([
                        'fuel_sale_id'   => $sale->id,
                        'amount_paid'    => $amountPaid,
                        'change_amount'  => $changeAmount,
                        'payment_method' => $paymentMethods[($i + $s) % count($paymentMethods)],
                        'status'         => 'paid',
                        'processed_by'   => $staffMembers[$i % 2]->id,
                    ]);

                    $remaining -= $litersSold;

                    // Update remaining liters
                    InventoryLog::create([
                        'fuel_inventory_id' => $inventory->id,
                        'reference_id'      => $inventory->fuel_product_id,
                        'movement'          => 'out',
                        'liters'            => $litersSold,
                        'liters_before'     => $remaining + $litersSold,
                        'liters_after'      => $remaining,
                        'price_per_liter'   => $pricePerLiter,
                    ]);
                }

                // Update inventory with final remaining
                $inventory->remaining_liters = $remaining;
                $inventory->save();
            }
        }

        // ─── 12. Create Remittances ───────────────────────────────────────────

        // Parking Remittances (walk-in collections)
        $parkingPayments = ParkingPayment::where('status', 'paid')
            ->whereHas('transaction.booking', function ($q) {
                $q->where('booking_type', 'walk_in');
            })
            ->get()
            ->groupBy('processed_by');

        foreach ($parkingPayments as $staffId => $payments) {
            $today = Carbon::now()->subDays(rand(0, 3));
            $totalRemitted = $payments->sum('amount_paid');
            $actualSales = $payments->sum(function ($p) {
                return $p->amount_paid - $p->change_amount;
            });

            ParkingRemittance::create([
                'staff_id'            => $staffId,
                'remittance_date'     => $today->format('Y-m-d'),
                'remitted_amount'     => round($totalRemitted, 2),
                'actual_sales_amount' => round($actualSales, 2),
                'status'              => ['pending', 'pending', 'approved', 'approved'][rand(0, 3)],
                'reviewed_at'         => rand(0, 1) ? Carbon::now()->subHours(rand(1, 24)) : null,
            ]);
        }

        // Fuel Remittances
        $fuelSalesGrouped = FuelSale::with('gasolinePayment')
            ->get()
            ->groupBy('recorded_by');

        foreach ($fuelSalesGrouped as $staffId => $sales) {
            $today = Carbon::now()->subDays(rand(0, 3));
            $totalRemitted = $sales->sum(function ($s) {
                return $s->gasolinePayment->amount_paid ?? 0;
            });
            $actualSales = $sales->sum(function ($s) {
                return ($s->liters_sold * $s->price_per_liter);
            });

            FuelRemittance::create([
                'staff_id'            => $staffId,
                'remittance_date'     => $today->format('Y-m-d'),
                'remitted_amount'     => round($totalRemitted, 2),
                'actual_sales_amount' => round($actualSales, 2),
                'status'              => ['pending', 'pending', 'approved'][rand(0, 2)],
                'reviewed_at'         => rand(0, 1) ? Carbon::now()->subHours(rand(1, 24)) : null,
            ]);
        }

        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('');
        $this->command->info('📊 SEED SUMMARY:');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('👤 Admin:        admin@parking.com / password123');
        $this->command->info('👤 Staff:        staff1@parking.com / password123');
        $this->command->info('👤 Staff:        staff2@parking.com / password123');
        $this->command->info('');
        $this->command->info('👥 Customers:    ' . count($customers) . ' registered');
        $this->command->info('🚗 Vehicles:     ' . (count($vehicles) + count($extraVehicles)) . ' total');
        $this->command->info('🅿️  Slots:        ' . count($slots) . ' parking slots');
        $this->command->info('📅 Bookings:     ' . count($bookings) . ' total');
        $this->command->info('⛽ Fuel Products: ' . count($fuelProducts));
        $this->command->info('📦 Fuel Inventory: ' . count($fuelInventories) . ' records');
        $this->command->info('🛢️  Fuel Sales:   ' . FuelSale::count() . ' transactions');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('');
        $this->command->info('🔑 Test customer accounts (password: password123):');
        $this->command->info('   - juan.delacruz@email.com');
        $this->command->info('   - maria.santos@email.com');
        $this->command->info('   - pedro.reyes@email.com');
        $this->command->info('   - ana.lopez@email.com');
        $this->command->info('   - ... and ' . (count($customers) - 4) . ' more');
    }
}