USE queless_db;

INSERT INTO users (name, email, phone, password_hash) VALUES
('Aarav Mehta', 'aarav@example.com', '9876543210', '$2b$10$HOz8Ods58DI27jdTyeGCfeaozObAHLiQG00phZsnZDoFbHnKz8/Su'),
('Diya Shah', 'diya@example.com', '9876501234', '$2b$10$HOz8Ods58DI27jdTyeGCfeaozObAHLiQG00phZsnZDoFbHnKz8/Su');

INSERT INTO businesses (name, type, address, contact, opening_time, closing_time) VALUES
('ABC Clinic', 'Clinic', 'MG Road, Ahmedabad', '079-40001122', '09:00:00', '18:00:00'),
('CityCare Diagnostics', 'Hospital', 'Ring Road, Surat', '0261-2345678', '08:00:00', '20:00:00'),
('FreshBite Bistro', 'Restaurant', 'C G Road, Ahmedabad', '079-55556666', '11:00:00', '23:00:00'),
('QuickFix Service Center', 'Service Center', 'Satellite, Ahmedabad', '079-22334455', '10:00:00', '19:00:00'),
('Metro Trust Bank', 'Bank', 'Navrangpura, Ahmedabad', '079-66442211', '10:00:00', '16:00:00'),
('GlowLine Salon', 'Salon', 'Vesu, Surat', '0261-4455667', '10:00:00', '21:00:00');

INSERT INTO services (business_id, service_name, default_duration_minutes) VALUES
(1, 'Doctor Consultation', 10),
(1, 'Follow-up Consultation', 7),
(2, 'Blood Test', 5),
(2, 'X-Ray', 15),
(3, 'Table Booking', 12),
(4, 'Device Diagnosis', 20),
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
