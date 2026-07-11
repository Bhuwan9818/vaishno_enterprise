<?php
/**
 * config.php
 * Central configuration for the enquiry system.
 * Update the values below to match your hosting / XAMPP setup.
 */

// ---------- Database (MySQL / MariaDB — works with XAMPP defaults) ----------
define('DB_HOST', 'localhost');
define('DB_NAME', 'vaishno_enterprise');
define('DB_USER', 'root');
define('DB_PASS', '');      // set your MySQL password here if you have one
define('DB_CHARSET', 'utf8mb4');

// ---------- Mail ----------
// Address that receives every new enquiry.
define('ADMIN_EMAIL', 'info@shrivaishnoenterprises.com'); // <-- change to the real admin inbox
define('MAIL_FROM_EMAIL', 'no-reply@shrivaishnoenterprises.com'); // <-- must be a domain you control for deliverability
define('MAIL_FROM_NAME', 'Shri Vaishno Enterprises Website');
define('SITE_NAME', 'Shri Vaishno Enterprises');
define('SITE_PHONE', '+91 98990 57451');

// Send the customer an automatic confirmation copy as well as the admin alert.
define('SEND_CUSTOMER_COPY', true);

/**
 * NOTE ON LOCAL (XAMPP) TESTING:
 * PHP's built-in mail() function needs a configured SMTP relay to actually
 * deliver email. On XAMPP/Windows this normally means either:
 *   1. Editing php.ini [mail function] SMTP + smtp_port and sendmail_path, or
 *   2. Using a tool like Mercury Mail (bundled with XAMPP) or a local
 *      SMTP debugging tool (e.g. Mailhog, Papercut), or
 *   3. Swapping mail() in send_mail() below for PHPMailer configured with
 *      a real SMTP account (Gmail, SendGrid, etc.) — recommended for
 *      production/live hosting.
 * Every enquiry is stored in the database regardless of whether the
 * email actually sends, so no lead is ever lost.
 */

function get_db_connection() {
    $conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        return null;
    }
    $conn->set_charset(DB_CHARSET);
    return $conn;
}
