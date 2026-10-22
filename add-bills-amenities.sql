-- =========================================================
-- Migration: bills breakdown + amenities & facilities
-- Run this ONCE on a database that was already imported from an
-- older pahuway_space.sql (local XAMPP and the live InfinityFree DB).
-- In phpMyAdmin: select the database -> SQL tab -> paste -> Go.
-- Fresh installs using the updated pahuway_space.sql do NOT need it.
--
-- Bill values: 1 = covered by rent, 0 = paid separately (internet only: 2 = no internet).
-- (Already ran the previous version of this file? Nothing more to run.)
--
-- Existing listings default to "bills separate" and no amenities
-- until the owner edits them (My Account -> My Properties -> Edit).
-- =========================================================

ALTER TABLE properties
    ADD COLUMN electricity_included TINYINT(1)   NOT NULL DEFAULT 0 AFTER parking_fee,
    ADD COLUMN water_included       TINYINT(1)   NOT NULL DEFAULT 0 AFTER electricity_included,
    ADD COLUMN internet_included    TINYINT(1)   NOT NULL DEFAULT 0 AFTER water_included,
    ADD COLUMN amenities            VARCHAR(255) NOT NULL DEFAULT '' AFTER internet_included;