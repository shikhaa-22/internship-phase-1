CREATE DATABASE IF NOT EXISTS booking_system;
USE booking_system;

-- Drop tables in correct order to avoid foreign key conflicts during reset
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
    bio TEXT,
    consultation_fee DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (specialization_id) REFERENCES specializations(id) ON DELETE CASCADE
);

-- 4. Services table
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    duration_minutes INT NOT NULL
);

-- 5. Pricing Rules table (for your dynamic pricing engine)
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

-- 6. Appointments table (Links clients, services, and doctors)
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
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- ==========================================
-- DUMMY DATA FOR TESTING
-- ==========================================

-- Insert Users (Client, Doctor, Admin)
INSERT INTO users (name, email, password_hash, role) VALUES 
('Shikhaa Prabhudesai', 'shikha@example.com', 'hashed_pass_123', 'client'),
('Dr. Robert Smith', 'drsmith@example.com', 'hashed_pass_123', 'doctor'),
('Dr. Emily Chen', 'drchen@example.com', 'hashed_pass_123', 'doctor'),
('Admin User', 'admin@example.com', 'hashed_pass_123', 'admin');

-- Insert Specialization Categories
INSERT INTO specializations (name) VALUES 
('General Medicine'),
('Cardiology'),
('Dermatology');

-- Insert Doctor Profiles (Linking doctor users to specializations)
-- Note: user_id 2 and 3 correspond to Dr. Smith and Dr. Chen above
INSERT INTO doctor_profiles (user_id, specialization_id, bio, consultation_fee) VALUES 
(2, 1, 'Experienced family physician specializing in preventative care.', 100.00),
(3, 2, 'Board-certified cardiologist focused on heart health and diagnostics.', 150.00);

-- Insert Services
INSERT INTO services (title, base_price, duration_minutes) VALUES 
('Full Body Checkup', 100.00, 60),
('Cardiac Consultation', 150.00, 45);

-- Insert Pricing Rules
INSERT INTO pricing_rules (rule_type, adjustment_type, adjustment_value, priority) VALUES 
('tax', 'percentage', 10.00, 1);

-- Insert Sample Appointment (Client booking Dr. Smith for a Full Body Checkup)
INSERT INTO appointments (client_id, doctor_id, service_id, start_time, end_time, base_amount, tax_amount, total_amount, status) VALUES 
(1, 2, 1, '2026-06-10 10:00:00', '2026-06-10 11:00:00', 100.00, 10.00, 110.00, 'confirmed');