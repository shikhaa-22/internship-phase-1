CREATE DATABASE IF NOT EXISTS booking_system;
USE booking_system;

-- Drop tables in correct order to avoid foreign key conflicts during reset
DROP TABLE IF EXISTS appointment_add_ons;
DROP TABLE IF EXISTS add_ons;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS pricing_rules;
DROP TABLE IF EXISTS doctor_profiles;
DROP TABLE IF EXISTS specializations;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS users;

-- 1. Users table (Handles clients, doctors, and admins)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- In production, store hashed passwords
    role ENUM('client', 'doctor', 'admin') DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Specializations table (Categories for doctors)
CREATE TABLE specializations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- 3. Doctor Profiles table (Links doctors to their categories and professional details)
CREATE TABLE doctor_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    specialization_id INT NOT NULL,
    seniority_level ENUM('junior', 'senior', 'lead_specialist') DEFAULT 'senior',
    tier_multiplier DECIMAL(3,2) DEFAULT 1.00,
    bio TEXT,
    consultation_fee DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (specialization_id) REFERENCES specializations(id) ON DELETE CASCADE
);

-- 4. Services table
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    specialization_id INT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    duration_minutes INT NOT NULL,
    FOREIGN KEY (specialization_id) REFERENCES specializations(id) ON DELETE SET NULL
);

-- 5. Add-On Services table (Dynamic add-on charges during booking)
CREATE TABLE add_ons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INT DEFAULT 0
);

-- 6. Pricing Rules table (for dynamic pricing engine)
CREATE TABLE pricing_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NULL,
    rule_type ENUM('weekend', 'peak_hour', 'discount', 'tax', 'fixed') NOT NULL,
    adjustment_type ENUM('percentage', 'flat') NOT NULL,
    adjustment_value DECIMAL(10,2) NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    priority INT DEFAULT 0,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- 7. Appointments table (Links clients, services, and doctors)
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    doctor_id INT NOT NULL,
    service_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'blocked') DEFAULT 'confirmed',
    cancellation_reason TEXT NULL,
    clinical_notes TEXT NULL,
    prescription TEXT NULL,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- 8. Appointment Add-Ons junction table
CREATE TABLE appointment_add_ons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    add_on_id INT NOT NULL,
    price_applied DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (add_on_id) REFERENCES add_ons(id) ON DELETE CASCADE
);

-- ==========================================
-- DUMMY DATA FOR TESTING
-- ==========================================

-- Insert Users (Client, Doctor, Admin)
INSERT IGNORE INTO users (name, email, password_hash, role) VALUES 
('Shikhaa Prabhudesai', 'shikha@example.com', 'patient123', 'client'),
('Dr. Robert Smith', 'drsmith@example.com', 'doctor123', 'doctor'),
('Dr. Emily Chen', 'drchen@example.com', 'doctor123', 'doctor'),
('Admin User', 'admin@example.com', 'admin123', 'admin'),
('John Doe', 'johndoe@example.com', 'patient123', 'client'),
('Alice Walker', 'alice@example.com', 'patient123', 'client');

-- Insert Specialization Categories
INSERT INTO specializations (name) VALUES 
('General Medicine'),
('Cardiology'),
('Dermatology');

-- Insert Doctor Profiles with Seniority Tiers and Multipliers
INSERT INTO doctor_profiles (user_id, specialization_id, seniority_level, tier_multiplier, bio, consultation_fee) VALUES 
(2, 2, 'lead_specialist', 1.30, 'Board-certified chief cardiologist with 15+ years experience.', 150.00),
(3, 1, 'senior', 1.15, 'Experienced family physician specializing in preventative care.', 100.00);

-- Insert Services (Linked to Specializations)
INSERT INTO services (title, specialization_id, base_price, duration_minutes) VALUES 
('Full Body Checkup', 1, 100.00, 60),
('Cardiac Consultation', 2, 150.00, 45);

-- Insert Add-On Services
INSERT INTO add_ons (title, description, price, duration_minutes) VALUES 
('Advanced ECG Diagnostics', 'Specialized electrical heart diagnostic monitoring', 50.00, 15),
('Comprehensive Blood Panel', 'Complete blood count and metabolic panel laboratory analysis', 75.00, 10),
('Extended Session (+30 mins)', 'Additional 30 minutes extended consultation time', 40.00, 30);

-- Insert Pricing Rules
INSERT INTO pricing_rules (rule_type, adjustment_type, adjustment_value, priority) VALUES 
('tax', 'percentage', 10.00, 1);

-- Insert Sample Appointments (for today, tomorrow, and past history testing)
INSERT INTO appointments (client_id, doctor_id, service_id, start_time, end_time, base_amount, tax_amount, total_amount, status, cancellation_reason, clinical_notes, prescription) VALUES 
-- TODAY (2026-08-05)
(
    (SELECT id FROM users WHERE email = 'shikha@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Cardiac Consultation' LIMIT 1),
    '2026-08-05 09:00:00', '2026-08-05 10:00:00', 195.00, 19.50, 214.50, 'confirmed', NULL, NULL, NULL
),
(
    (SELECT id FROM users WHERE email = 'alice@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Cardiac Consultation' LIMIT 1),
    '2026-08-05 10:00:00', '2026-08-05 11:00:00', 195.00, 24.50, 269.50, 'completed', NULL, 
    'Patient reports mild chest tightness during physical exercise. ECG and heart rhythm evaluated.', 
    'Aspirin 81mg once daily, Metoprolol 25mg twice daily after meals.'
),
(
    (SELECT id FROM users WHERE email = 'johndoe@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Cardiac Consultation' LIMIT 1),
    '2026-08-05 11:00:00', '2026-08-05 12:00:00', 195.00, 19.50, 214.50, 'confirmed', NULL, NULL, NULL
),
(
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Cardiac Consultation' LIMIT 1),
    '2026-08-05 12:00:00', '2026-08-05 13:00:00', 0.00, 0.00, 0.00, 'blocked', 'Doctor Lunch Break & Clinical Staff Meeting', NULL, NULL
),
(
    (SELECT id FROM users WHERE email = 'alice@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Cardiac Consultation' LIMIT 1),
    '2026-08-05 14:00:00', '2026-08-05 15:00:00', 195.00, 19.50, 214.50, 'cancelled', 'Emergency surgery schedule overlap', NULL, NULL
),
(
    (SELECT id FROM users WHERE email = 'shikha@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Cardiac Consultation' LIMIT 1),
    '2026-08-05 15:00:00', '2026-08-05 16:00:00', 195.00, 19.50, 214.50, 'confirmed', NULL, NULL, NULL
),
-- Dr. Emily Chen Appointment Example: Shikhaa Prabhudesai (Full Body Checkup)
(
    (SELECT id FROM users WHERE email = 'shikha@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'drchen@example.com' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Full Body Checkup' LIMIT 1),
    '2026-08-05 13:00:00', '2026-08-05 14:00:00', 115.00, 11.50, 126.50, 'confirmed', NULL, NULL, NULL
),

-- TOMORROW (2026-08-06)
(
    (SELECT id FROM users WHERE email = 'johndoe@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Cardiac Consultation' LIMIT 1),
    '2026-08-06 09:00:00', '2026-08-06 10:00:00', 195.00, 19.50, 214.50, 'confirmed', NULL, NULL, NULL
),
(
    (SELECT id FROM users WHERE email = 'alice@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Cardiac Consultation' LIMIT 1),
    '2026-08-06 10:00:00', '2026-08-06 11:00:00', 195.00, 19.50, 214.50, 'confirmed', NULL, NULL, NULL
),
(
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Cardiac Consultation' LIMIT 1),
    '2026-08-06 13:00:00', '2026-08-06 14:00:00', 0.00, 0.00, 0.00, 'blocked', 'Hospital Ward Rounds & ICU Inspection', NULL, NULL
),

-- PAST HISTORY (2026-08-04 & 2026-08-01)
(
    (SELECT id FROM users WHERE email = 'johndoe@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Cardiac Consultation' LIMIT 1),
    '2026-08-04 10:00:00', '2026-08-04 11:00:00', 195.00, 19.50, 214.50, 'completed', NULL,
    'Annual routine wellness checkup. Blood pressure 120/80 mmHg, heart rate 72 bpm. Patient in good health.',
    'Daily Multivitamins 1 tab after breakfast.'
),
(
    (SELECT id FROM users WHERE email = 'johndoe@example.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'drsmith@example.com' LIMIT 1),
    (SELECT id FROM services WHERE title = 'Cardiac Consultation' LIMIT 1),
    '2026-08-01 14:00:00', '2026-08-01 15:00:00', 195.00, 19.50, 214.50, 'completed', NULL,
    'Initial cardiac baseline assessment. Normal sinus rhythm.',
    'Rest, hydration, and follow-up in 3 months.'
);

-- Insert Sample Add-On for Alice's completed appointment
INSERT INTO appointment_add_ons (appointment_id, add_on_id, price_applied) VALUES 
(2, 1, 50.00);