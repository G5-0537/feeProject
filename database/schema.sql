CREATE DATABASE IF NOT EXISTS queless_db;
USE queless_db;

DROP VIEW IF EXISTS active_queue_overview;
DROP VIEW IF EXISTS service_performance_summary;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS service_duration_history;
DROP TABLE IF EXISTS queue_entries;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS queues;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS businesses;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_email CHECK (email LIKE '%@%')
);

CREATE TABLE businesses (
  business_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  type ENUM('Clinic','Hospital','Restaurant','Government Office','Bank','Salon','Service Center','Other') NOT NULL,
  address VARCHAR(255) NOT NULL,
  contact VARCHAR(30) NOT NULL,
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_business_hours CHECK (opening_time < closing_time)
);

CREATE TABLE services (
  service_id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  service_name VARCHAR(120) NOT NULL,
  default_duration_minutes INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_services_business FOREIGN KEY (business_id) REFERENCES businesses(business_id) ON DELETE CASCADE,
  CONSTRAINT chk_service_duration CHECK (default_duration_minutes BETWEEN 1 AND 240),
  CONSTRAINT uq_business_service UNIQUE (business_id, service_name)
);

CREATE TABLE staff (
  staff_id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Receptionist','Doctor','Manager','Operator') NOT NULL DEFAULT 'Receptionist',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_staff_business FOREIGN KEY (business_id) REFERENCES businesses(business_id) ON DELETE CASCADE,
  CONSTRAINT chk_staff_email CHECK (email LIKE '%@%')
);

CREATE TABLE queues (
  queue_id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  service_id INT NOT NULL,
  queue_date DATE NOT NULL,
  current_token INT NOT NULL DEFAULT 0,
  status ENUM('Open','Paused','Closed') NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_queues_business FOREIGN KEY (business_id) REFERENCES businesses(business_id) ON DELETE CASCADE,
  CONSTRAINT fk_queues_service FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
  CONSTRAINT uq_daily_service_queue UNIQUE (business_id, service_id, queue_date)
);

CREATE TABLE appointments (
  appointment_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  service_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status ENUM('Booked','Waiting','Now Serving','Completed','Skipped','Cancelled') NOT NULL DEFAULT 'Booked',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_service FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
  CONSTRAINT uq_user_service_slot UNIQUE (user_id, service_id, appointment_date, appointment_time)
);

CREATE TABLE queue_entries (
  entry_id INT AUTO_INCREMENT PRIMARY KEY,
  queue_id INT NOT NULL,
  user_id INT NULL,
  appointment_id INT NULL,
  walk_in_name VARCHAR(100) NULL,
  walk_in_phone VARCHAR(20) NULL,
  token_number INT NOT NULL,
  source ENUM('Appointment','Live Queue','Walk-in') NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  called_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  status ENUM('Waiting','Approaching','Now Serving','Completed','Skipped','Cancelled') NOT NULL DEFAULT 'Waiting',
  CONSTRAINT fk_entries_queue FOREIGN KEY (queue_id) REFERENCES queues(queue_id) ON DELETE CASCADE,
  CONSTRAINT fk_entries_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_entries_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  CONSTRAINT uq_queue_token UNIQUE (queue_id, token_number),
  CONSTRAINT chk_entry_owner CHECK (
    user_id IS NOT NULL OR appointment_id IS NOT NULL OR walk_in_name IS NOT NULL
  )
);

CREATE TABLE service_duration_history (
  duration_id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  entry_id INT NOT NULL UNIQUE,
  duration_minutes INT NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_duration_service FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
  CONSTRAINT fk_duration_entry FOREIGN KEY (entry_id) REFERENCES queue_entries(entry_id) ON DELETE CASCADE,
  CONSTRAINT chk_actual_duration CHECK (duration_minutes BETWEEN 1 AND 240)
);

CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  type ENUM('Appointment','Queue','System') NOT NULL DEFAULT 'System',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_business_type_name ON businesses(type, name);
CREATE INDEX idx_services_business ON services(business_id);
CREATE INDEX idx_appointments_user_date ON appointments(user_id, appointment_date);
CREATE INDEX idx_queues_lookup ON queues(business_id, service_id, queue_date);
CREATE INDEX idx_entries_queue_status_token ON queue_entries(queue_id, status, token_number);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at);

DELIMITER //

CREATE TRIGGER trg_record_service_duration
AFTER UPDATE ON queue_entries
FOR EACH ROW
BEGIN
  IF NEW.status = 'Completed'
    AND OLD.status <> 'Completed'
    AND NEW.called_at IS NOT NULL
    AND NEW.completed_at IS NOT NULL THEN
      INSERT IGNORE INTO service_duration_history (service_id, entry_id, duration_minutes)
      SELECT q.service_id, NEW.entry_id, GREATEST(1, TIMESTAMPDIFF(MINUTE, NEW.called_at, NEW.completed_at))
      FROM queues q
      WHERE q.queue_id = NEW.queue_id;
  END IF;
END//

DELIMITER ;

CREATE VIEW active_queue_overview AS
SELECT
  qe.entry_id,
  qe.queue_id,
  q.business_id,
  b.name AS business_name,
  s.service_id,
  s.service_name,
  q.queue_date,
  q.current_token,
  qe.token_number,
  qe.source,
  qe.status,
  COALESCE(u.name, qe.walk_in_name) AS customer_name,
  COALESCE(u.phone, qe.walk_in_phone) AS customer_phone,
  qe.joined_at,
  qe.called_at,
  qe.completed_at
FROM queue_entries qe
JOIN queues q ON q.queue_id = qe.queue_id
JOIN businesses b ON b.business_id = q.business_id
JOIN services s ON s.service_id = q.service_id
LEFT JOIN users u ON u.user_id = qe.user_id;

CREATE VIEW service_performance_summary AS
SELECT
  s.service_id,
  s.business_id,
  s.service_name,
  s.default_duration_minutes,
  COUNT(sdh.duration_id) AS completed_count,
  ROUND(COALESCE(AVG(sdh.duration_minutes), s.default_duration_minutes), 2) AS calculated_average_minutes
FROM services s
LEFT JOIN service_duration_history sdh ON sdh.service_id = s.service_id
GROUP BY s.service_id, s.business_id, s.service_name, s.default_duration_minutes;
