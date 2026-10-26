USE queless_db;

INSERT INTO users (name, email, phone, password_hash) VALUES
('Aarav Mehta', 'aarav@example.com', '9876543210', '$2b$10$HOz8Ods58DI27jdTyeGCfeaozObAHLiQG00phZsnZDoFbHnKz8/Su'),
('Diya Shah', 'diya@example.com', '9876501234', '$2b$10$HOz8Ods58DI27jdTyeGCfeaozObAHLiQG00phZsnZDoFbHnKz8/Su');

INSERT INTO businesses (business_id, brand_name, branch_name, name, type, address, contact, latitude, longitude, opening_time, closing_time) VALUES
(1, 'ABC Clinic', 'Main Branch', 'ABC Clinic Main Branch', 'Clinic', 'MG Road, Ahmedabad', '079-40001122', 23.0225, 72.5714, '09:00:00', '18:00:00'),
(2, 'ABC Clinic', 'Sector 17', 'ABC Clinic Sector 17', 'Clinic', 'Sector 17 Plaza, Gandhinagar', '079-40001133', 23.2156, 72.6369, '09:00:00', '18:00:00'),
(3, 'CityCare Diagnostics', 'Ring Road', 'CityCare Diagnostics Ring Road', 'Hospital', 'Ring Road, Surat', '0261-2345678', 21.1702, 72.8311, '08:00:00', '20:00:00'),
(4, 'Metro Trust Bank', 'Navrangpura', 'Metro Trust Bank Navrangpura', 'Bank', 'Navrangpura, Ahmedabad', '079-66442211', 23.0365, 72.5611, '10:00:00', '16:00:00'),
(5, 'Metro Trust Bank', 'Tech Park', 'Metro Trust Bank Tech Park', 'Bank', 'Infocity, Gandhinagar', '079-66442299', 23.1900, 72.6200, '10:00:00', '17:00:00'),
(6, 'GlowLine Salon', 'Vesu', 'GlowLine Salon Vesu', 'Salon', 'Vesu, Surat', '0261-4455667', 21.1400, 72.7700, '10:00:00', '21:00:00');

INSERT INTO services (business_id, service_name, default_duration_minutes) VALUES
(1, 'Doctor Consultation', 10),
(1, 'Follow-up Consultation', 7),
(2, 'Doctor Consultation', 10),
(2, 'Follow-up Consultation', 7),
(3, 'Blood Test', 5),
(3, 'X-Ray', 15),
(4, 'Account Service', 12),
(4, 'Loan Enquiry', 18),
(5, 'Account Service', 12),
(5, 'Loan Enquiry', 18),
(6, 'Haircut', 25),
(6, 'Skin Consultation', 20);


INSERT INTO staff (business_id, name, email, password_hash, role) VALUES
(1, 'Receptionist 1', 'staff@abcclinic.com', '$2b$10$HOz8Ods58DI27jdTyeGCfeaozObAHLiQG00phZsnZDoFbHnKz8/Su', 'Receptionist'),
(1, 'Dr. Sharma', 'doctor@abcclinic.com', '$2b$10$HOz8Ods58DI27jdTyeGCfeaozObAHLiQG00phZsnZDoFbHnKz8/Su', 'Doctor'),
(2, 'Lab Manager', 'staff@citycare.com', '$2b$10$HOz8Ods58DI27jdTyeGCfeaozObAHLiQG00phZsnZDoFbHnKz8/Su', 'Manager');

INSERT INTO queues (business_id, service_id, queue_date, current_token, status) VALUES
(1, 1, CURDATE(), 25, 'Open'),
(2, 3, CURDATE(), 8, 'Open'),
(3, 5, CURDATE(), 14, 'Open');

INSERT INTO queue_entries (queue_id, user_id, token_number, source, status, joined_at) VALUES
(1, 1, 26, 'Live Queue', 'Waiting', DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
(1, 2, 27, 'Live Queue', 'Waiting', DATE_SUB(NOW(), INTERVAL 12 MINUTE));

INSERT INTO queue_entries (queue_id, walk_in_name, walk_in_phone, token_number, source, status, joined_at) VALUES
(1, 'Walk-in Patient', '9999990000', 28, 'Walk-in', 'Waiting', DATE_SUB(NOW(), INTERVAL 6 MINUTE));

INSERT INTO notifications (user_id, message, type) VALUES
(1, 'Your token #26 is active at ABC Clinic.', 'Queue'),
(2, 'Your token #27 was added to the live queue.', 'Queue');
