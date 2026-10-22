-- =========================================================
-- pahuway_space database schema
-- Generated from the PHP backend (db.php, login.php, signup.php,
-- properties.php, bookings.php, favorites.php, etc.)
-- Import this in phpMyAdmin, or run via the mysql CLI.
-- =========================================================

CREATE DATABASE IF NOT EXISTS pahuway_space
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE pahuway_space;

-- ---------------------------------------------------------
-- users
-- ---------------------------------------------------------
CREATE TABLE users (
    user_id     INT AUTO_INCREMENT PRIMARY KEY,
    full_name   VARCHAR(150)    NOT NULL,
    email       VARCHAR(150)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,   -- stores password_hash() output
    -- 'admin' can ONLY be granted from the Admin Access Panel (My Account)
    -- or directly in this database. Signup always creates 'user'.
    account_type ENUM('user','admin') NOT NULL DEFAULT 'user',
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- To create your first admin after importing (replace the email):
-- UPDATE users SET account_type = 'admin' WHERE email = 'you@example.com';

-- ---------------------------------------------------------
-- properties
-- ---------------------------------------------------------
CREATE TABLE properties (
    property_id     INT AUTO_INCREMENT PRIMARY KEY,
    owner_id        INT             NOT NULL,
    property_code   VARCHAR(50)     NOT NULL UNIQUE,
    property_type   VARCHAR(50)     NOT NULL,
    title           VARCHAR(150)    NOT NULL,
    location        VARCHAR(255)    NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2)   NOT NULL,
    price_unit      ENUM('daily','monthly') NOT NULL DEFAULT 'monthly',
    bedrooms        INT             NOT NULL DEFAULT 0,
    bathrooms       INT             NOT NULL DEFAULT 0,
    area            VARCHAR(50),
    image           VARCHAR(255),
    verified        TINYINT(1)      NOT NULL DEFAULT 0,
    status          ENUM('available','rented','inactive') NOT NULL DEFAULT 'available',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_properties_owner
        FOREIGN KEY (owner_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- bookings
-- ---------------------------------------------------------
CREATE TABLE bookings (
    booking_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT             NOT NULL,
    property_id     INT             NOT NULL,
    check_in        DATE            NOT NULL,
    check_out       DATE            NOT NULL,
    guests          INT             NOT NULL DEFAULT 1,
    nights          INT             NOT NULL,
    total_amount    DECIMAL(10,2)   NOT NULL,
    booking_status  ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bookings_property
        FOREIGN KEY (property_id) REFERENCES properties(property_id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- payments  (created when a booking is confirmed)
-- ---------------------------------------------------------
CREATE TABLE payments (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    booking_id      INT             NOT NULL,
    payment_method  VARCHAR(50)     NOT NULL,
    amount          DECIMAL(10,2)   NOT NULL,
    payment_status  VARCHAR(50)     NOT NULL DEFAULT 'pending',
    payment_date    DATETIME        NOT NULL,
    CONSTRAINT fk_payments_booking
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- favorites  (many-to-many: users <-> properties)
-- ---------------------------------------------------------
CREATE TABLE favorites (
    user_id     INT NOT NULL,
    property_id INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, property_id),
    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_favorites_property
        FOREIGN KEY (property_id) REFERENCES properties(property_id)
        ON DELETE CASCADE
);
