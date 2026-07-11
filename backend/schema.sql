-- Shri Vaishno Enterprises — Product Enquiry System
-- Import this file once in phpMyAdmin (or `mysql -u root -p < schema.sql`)

CREATE DATABASE IF NOT EXISTS vaishno_enterprise
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE vaishno_enterprise;

CREATE TABLE IF NOT EXISTS enquiries (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(120)  NOT NULL,
  phone           VARCHAR(25)   NOT NULL,
  email           VARCHAR(150)  NULL,
  product_name    VARCHAR(200)  NULL,
  product_price   VARCHAR(60)   NULL,
  message         TEXT          NULL,
  source_page     VARCHAR(255)  NULL,
  ip_address      VARCHAR(64)   NULL,
  user_agent      VARCHAR(255)  NULL,
  status          ENUM('new','contacted','closed') NOT NULL DEFAULT 'new',
  admin_mail_sent TINYINT(1)    NOT NULL DEFAULT 0,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB;
