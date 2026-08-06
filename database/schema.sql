CREATE DATABASE IF NOT EXISTS booking_system;
USE booking_system;

-- Drop tables in correct order to avoid foreign key conflicts during reset
DROP TABLE IF EXISTS appointment_add_ons;
DROP TABLE IF EXISTS add_ons;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS pricing_rules;
DROP TABLE IF EXISTS provider_profiles;
DROP TABLE IF EXISTS doctor_profiles;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS specializations;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- 1. Categories table (Top-level appointment types)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'event',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users table (Handles clients, providers/doctors, and admins)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('client', 'provider', 'doctor', 'admin') DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Specializations table (Optional detailed focus areas within categories)
CREATE TABLE specializations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 4. Provider Profiles table (Links providers/doctors to their category and professional details)
CREATE TABLE provider_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    specialization_id INT NULL,
    seniority_level ENUM('junior', 'senior', 'lead_specialist') DEFAULT 'senior',
    tier_multiplier DECIMAL(3,2) DEFAULT 1.00,
    bio TEXT,
    consultation_fee DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (specialization_id) REFERENCES specializations(id) ON DELETE SET NULL
);

-- 5. Services table (Services offered per Category)
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    specialization_id INT NULL,
    title VARCHAR(255) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    duration_minutes INT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (specialization_id) REFERENCES specializations(id) ON DELETE SET NULL
);

-- 6. Add-On Services table (Dynamic add-on options during booking)
CREATE TABLE add_ons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 7. Pricing Rules table (for dynamic pricing engine)
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

-- 8. Appointments table (Links clients, services, providers, and categories)
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    provider_id INT NOT NULL,
    doctor_id INT NOT NULL, -- kept for backward compatibility (matches provider_id)
    service_id INT NOT NULL,
    category_id INT NOT NULL,
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
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 9. Appointment Add-Ons junction table
CREATE TABLE appointment_add_ons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    add_on_id INT NOT NULL,
    price_applied DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (add_on_id) REFERENCES add_ons(id) ON DELETE CASCADE
);

-- ==========================================
-- DUMMY DATA FOR MULTI-CATEGORY SYSTEM
-- ==========================================

-- Insert Categories
INSERT INTO categories (id, name, description, icon) VALUES 
(1, 'Doctor / Healthcare', 'Medical consultations, health checkups, and specialist clinical care', 'medical_services'),
(2, 'Wellness & Fitness', 'Personal training sessions, massage therapy, and diet & nutrition planning', 'spa'),
(3, 'Consulting & Professional Services', 'Legal advisory, business strategy, and financial & tax planning', 'business_center');

-- Insert Specializations
INSERT INTO specializations (id, category_id, name) VALUES 
(1, 1, 'General Medicine'),
(2, 1, 'Cardiology'),
(3, 1, 'Dermatology'),
(4, 2, 'Personal Fitness & Workout'),
(5, 2, 'Massage & Physical Therapy'),
(6, 2, 'Diet & Nutrition Counseling'),
(7, 3, 'Legal Advisory & Contracts'),
(8, 3, 'Business Strategy & Growth'),
(9, 3, 'Tax & Financial Advisory');

-- Insert Users (Clients, Providers, Admin)
INSERT INTO users (id, name, email, password_hash, role) VALUES 
(1, 'Shikhaa Prabhudesai', 'shikha@example.com', 'hashed_pass_123', 'client'),
(2, 'Dr. Robert Smith', 'drsmith@example.com', 'hashed_pass_123', 'doctor'),
(3, 'Dr. Emily Chen', 'drchen@example.com', 'hashed_pass_123', 'doctor'),
(4, 'Marcus Vance (Fitness Coach)', 'marcus@example.com', 'hashed_pass_123', 'provider'),
(5, 'Elena Rostova (Wellness Therapist)', 'elena@example.com', 'hashed_pass_123', 'provider'),
(6, 'Sarah Jenkins (Legal Counsel)', 'sarah@example.com', 'hashed_pass_123', 'provider'),
(7, 'David Kim (Business Consultant)', 'david@example.com', 'hashed_pass_123', 'provider'),
(8, 'Admin User', 'admin@example.com', 'hashed_pass_123', 'admin'),
(9, 'John Doe', 'johndoe@example.com', 'hashed_pass_123', 'client'),
(10, 'Alice Walker', 'alice@example.com', 'hashed_pass_123', 'client');

-- Insert Provider Profiles
INSERT INTO provider_profiles (user_id, category_id, specialization_id, seniority_level, tier_multiplier, bio, consultation_fee) VALUES 
(2, 1, 2, 'lead_specialist', 1.30, 'Board-certified chief cardiologist with 15+ years experience.', 150.00),
(3, 1, 1, 'senior', 1.15, 'Experienced family physician specializing in preventative care.', 100.00),
(4, 2, 4, 'senior', 1.10, 'Certified master fitness trainer specializing in strength & athletic mobility.', 80.00),
(5, 2, 5, 'senior', 1.15, 'Licensed neuromuscular massage & recovery specialist.', 90.00),
(6, 3, 7, 'lead_specialist', 1.25, 'Senior corporate attorney specializing in business contracts & compliance.', 200.00),
(7, 3, 8, 'senior', 1.20, 'Executive strategy consultant advising growth-stage companies.', 250.00);

-- Insert Services
INSERT INTO services (id, category_id, specialization_id, title, base_price, duration_minutes) VALUES 
-- Doctor Services
(1, 1, 1, 'Full Body Checkup', 100.00, 60),
(2, 1, 2, 'Cardiac Consultation', 150.00, 45),
(3, 1, 3, 'Dermatology Skin Evaluation', 120.00, 30),
-- Wellness Services
(4, 2, 4, '1-on-1 Personal Fitness Training', 80.00, 60),
(5, 2, 5, 'Deep Tissue Massage & Physical Therapy', 90.00, 60),
(6, 2, 6, 'Custom Nutrition & Diet Plan', 75.00, 45),
-- Consulting Services
(7, 3, 7, 'Legal Contract & Agreement Review', 200.00, 60),
(8, 3, 8, 'Business Strategy Consultation', 250.00, 60),
(9, 3, 9, 'Tax & Financial Advisory Session', 180.00, 45);

-- Insert Category-Specific Add-On Services & Diagnostic Tests
INSERT INTO add_ons (id, category_id, title, description, price, duration_minutes) VALUES 
-- Doctor Category (1) Diagnostic Tests & Clinical Add-Ons
(1, 1, 'Advanced ECG Diagnostics', 'Specialized electrical heart diagnostic monitoring', 50.00, 15),
(2, 1, 'Comprehensive Blood Panel', 'Complete blood count and metabolic panel laboratory analysis', 75.00, 10),

-- Wellness Category (2) Fitness & Wellness Amenities
(4, 2, 'Post-Workout Protein & Recovery Pack', 'Custom recovery smoothie and electrolyte hydration kit', 25.00, 0),
(5, 2, 'Thermal Sauna & Hydro Therapy Pass', '30-minute post-workout infrared sauna and hydro bath pass', 35.00, 30),
(6, 2, 'Body Composition & Muscle Scan', '3D bio-impedance body fat & muscle composition diagnostic scan', 45.00, 15),

-- Consulting Category (3) Professional Deliverables & Priority
(7, 3, 'Express 24-hr Contract Redlining', '24-hour priority legal document markup and redline comments', 100.00, 0),
(8, 3, 'Executive Strategy Deck & Roadmap', 'Custom slide presentation summarizing strategy and financial roadmap', 120.00, 0),
(9, 3, 'Priority NDA & Compliance Audit', 'Standard NDA template draft and regulatory compliance checklist', 60.00, 0);

-- Insert Pricing Rules
INSERT INTO pricing_rules (rule_type, adjustment_type, adjustment_value, priority) VALUES 
('tax', 'percentage', 10.00, 1);

-- Insert Sample Appointments Across Categories
INSERT INTO appointments (id, client_id, provider_id, doctor_id, service_id, category_id, start_time, end_time, base_amount, tax_amount, total_amount, status, cancellation_reason, clinical_notes, prescription) VALUES 
-- ==========================================
-- CATEGORY 1: DOCTOR / HEALTHCARE DEMO APPOINTMENTS
-- ==========================================
(1, 1, 2, 2, 2, 1, '2026-08-03 10:00:00', '2026-08-03 11:00:00', 195.00, 19.50, 214.50, 'completed', NULL, 
 'Patient reports intermittent cardiac palpitations during treadmill cardio exercises. Resting 12-lead ECG and echocardiogram evaluated.', 
 'Metoprolol 25mg once daily after breakfast. Reduce high caffeine intake.'),

(2, 10, 2, 2, 2, 1, '2026-08-05 10:00:00', '2026-08-05 11:00:00', 195.00, 24.50, 269.50, 'completed', NULL, 
 'Patient reports mild chest tightness during physical exercise. ECG and heart rhythm evaluated.', 
 'Aspirin 81mg once daily, Metoprolol 25mg twice daily after meals.'),

(3, 1, 3, 3, 1, 1, '2026-08-04 09:00:00', '2026-08-04 10:00:00', 115.00, 11.50, 126.50, 'completed', NULL, 
 'Annual preventative medical wellness checkup. Vitals normal (BP 118/76 mmHg, Pulse 70 bpm, BMI 22.4). Baseline blood work ordered.', 
 'Daily Multivitamin 1 tab, Vitamin D3 2000 IU daily after lunch.'),

(4, 9, 3, 3, 1, 1, '2026-08-06 09:00:00', '2026-08-06 10:00:00', 115.00, 11.50, 126.50, 'confirmed', NULL, NULL, NULL),

(5, 10, 3, 3, 3, 1, '2026-08-07 11:00:00', '2026-08-07 11:30:00', 138.00, 13.80, 151.80, 'confirmed', NULL, NULL, NULL),

-- ==========================================
-- CATEGORY 2: WELLNESS & FITNESS DEMO APPOINTMENTS
-- ==========================================
(6, 1, 4, 4, 4, 2, '2026-08-02 09:00:00', '2026-08-02 10:00:00', 88.00, 8.80, 96.80, 'completed', NULL, 
 'Baseline functional movement and squat biomechanics assessment. High athletic mobility.', 
 '3x weekly progressive hypertrophy routine (Barbell Squats 4x10, Bulgarian Split Squats 3x12, Core Planks 60s). Consume 30g protein post-session.'),

(7, 9, 4, 4, 4, 2, '2026-08-04 11:00:00', '2026-08-04 12:00:00', 88.00, 8.80, 96.80, 'completed', NULL, 
 'Upper body strength and bench press technique session. Excellent shoulder stabilization.', 
 'Upper push workout focus. Hydrate 3.5 Liters daily and maintain 2000 kcal diet plan.'),

(8, 1, 5, 5, 5, 2, '2026-08-05 14:00:00', '2026-08-05 15:00:00', 103.50, 10.35, 113.85, 'completed', NULL, 
 'Targeted deep tissue myofascial release on upper back and trapezius. Muscular tension reduced.', 
 'Perform doorway chest stretches 3x daily. Apply thermal warm compress 15 minutes before sleep.'),

(9, 1, 4, 4, 4, 2, '2026-08-06 11:00:00', '2026-08-06 12:00:00', 88.00, 8.80, 96.80, 'confirmed', NULL, NULL, NULL),

(10, 10, 5, 5, 6, 2, '2026-08-07 14:00:00', '2026-08-07 14:45:00', 86.25, 8.63, 94.88, 'confirmed', NULL, NULL, NULL),

-- ==========================================
-- CATEGORY 3: CONSULTING & PROFESSIONAL SERVICES DEMO APPOINTMENTS
-- ==========================================
(11, 1, 7, 7, 8, 3, '2026-08-04 15:00:00', '2026-08-04 16:00:00', 300.00, 30.00, 330.00, 'completed', NULL, 
 'Reviewed quarterly SaaS business scaling roadmap and customer acquisition model. Optimized pricing tier structure.', 
 'Action Items: 1. Finalize SaaS pricing page structure. 2. Establish outbound enterprise sales pipeline.'),

(12, 1, 6, 6, 7, 3, '2026-08-01 11:00:00', '2026-08-01 12:00:00', 250.00, 25.00, 275.00, 'completed', NULL, 
 'Comprehensive legal audit of Master Services Agreement (MSA) and Independent Contractor agreements.', 
 'Key Takeaways: 1. Add 30-day mutual termination clause. 2. Update IP ownership assignment terms.'),

(13, 9, 6, 6, 7, 3, '2026-08-06 14:00:00', '2026-08-06 15:00:00', 250.00, 25.00, 275.00, 'confirmed', NULL, NULL, NULL),

(14, 10, 7, 7, 9, 3, '2026-08-07 10:00:00', '2026-08-07 10:45:00', 216.00, 21.60, 237.60, 'confirmed', NULL, NULL, NULL),

(15, 1, 6, 6, 7, 3, '2026-08-05 16:00:00', '2026-08-05 17:00:00', 250.00, 25.00, 275.00, 'cancelled', 'Rescheduled due to urgent business travel', NULL, NULL);

-- Add-ons for Alice's completed medical appointment
INSERT INTO appointment_add_ons (appointment_id, add_on_id, price_applied) VALUES 
(2, 1, 50.00);