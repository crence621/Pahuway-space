-- =========================================================
-- Migration: pets + parking info, and monthly move-in bookings
-- Run this ONCE on a database that was already imported from the
-- older pahuway_space.sql (local XAMPP and the live InfinityFree DB).
-- In phpMyAdmin: select the database -> SQL tab -> paste -> Go.
-- Fresh installs using the updated pahuway_space.sql do NOT need it.
-- =========================================================

-- 1) Pets and parking info on each property
ALTER TABLE properties
    ADD COLUMN pets_allowed   TINYINT(1)       NOT NULL DEFAULT 0   AFTER status,
    ADD COLUMN pet_conditions VARCHAR(255)     NULL                 AFTER pets_allowed,
    ADD COLUMN parking_nearby TINYINT(1)       NOT NULL DEFAULT 0   AFTER pet_conditions,
    ADD COLUMN parking_fee    ENUM('free','paid') NULL              AFTER parking_nearby;

-- 2) Monthly rentals only have a move-in date, so check_out may be empty
ALTER TABLE bookings
    MODIFY check_out DATE NULL;
