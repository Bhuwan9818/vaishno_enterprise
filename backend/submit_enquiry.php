<?php
/**
 * submit_enquiry.php
 * Handles AJAX submissions from the product enquiry modal (and the main
 * contact form). Validates input, stores the lead in MySQL, then emails
 * a notification to the admin and a confirmation copy to the customer.
 *
 * Always responds with JSON: {"success": true|false, "message": "..."}
 */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

function respond($success, $message) {
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    respond(false, 'Invalid request method.');
}

// ---------- Honeypot spam trap (hidden "company" field must stay empty) ----------
if (!empty($_POST['company'])) {
    // Silently "succeed" to a bot so it doesn't retry, but do nothing.
    respond(true, 'Thank you.');
}

// ---------- Collect + sanitize input ----------
function clean($v) {
    $v = isset($v) ? trim($v) : '';
    $v = strip_tags($v);
    return $v;
}

$name          = clean($_POST['name'] ?? '');
$phone         = clean($_POST['phone'] ?? '');
$email         = clean($_POST['email'] ?? '');
$product_name  = clean($_POST['product_name'] ?? 'General Enquiry');
$product_price = clean($_POST['product_price'] ?? '');
$message       = clean($_POST['message'] ?? '');
$source_page   = clean($_POST['source_page'] ?? '');
$ip_address    = $_SERVER['REMOTE_ADDR'] ?? '';
$user_agent    = clean($_SERVER['HTTP_USER_AGENT'] ?? '');

// ---------- Validate ----------
$errors = [];
if ($name === '' || mb_strlen($name) < 2) {
    $errors[] = 'Please enter your full name.';
}
if ($phone === '' || !preg_match('/^[0-9+\-\s()]{7,20}$/', $phone)) {
    $errors[] = 'Please enter a valid phone number.';
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}
if ($product_name === '') {
    $product_name = 'General Enquiry';
}

if (!empty($errors)) {
    respond(false, implode(' ', $errors));
}

// ---------- Store in database ----------
$conn = get_db_connection();
$db_ok = false;

if ($conn) {
    $stmt = $conn->prepare(
        'INSERT INTO enquiries (name, phone, email, product_name, product_price, message, source_page, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    if ($stmt) {
        $stmt->bind_param('sssssssss', $name, $phone, $email, $product_name, $product_price, $message, $source_page, $ip_address, $user_agent);
        $db_ok = $stmt->execute();
        $insert_id = $stmt->insert_id;
        $stmt->close();
    }
    $conn->close();
}

if (!$db_ok) {
    // We still try to email the lead even if the DB insert failed, so it
    // isn't lost outright — but we report the real problem to the client.
    error_log('Vaishno Enterprises: enquiry DB insert failed for ' . $name . ' / ' . $phone);
}

// ---------- Email the admin ----------
$admin_sent = send_admin_notification($name, $phone, $email, $product_name, $product_price, $message, $source_page);

// ---------- Email the customer a confirmation copy ----------
if (SEND_CUSTOMER_COPY && $email !== '') {
    send_customer_confirmation($name, $email, $product_name);
}

if (!$db_ok && !$admin_sent) {
    respond(false, 'We could not save your enquiry right now. Please call us directly at ' . SITE_PHONE . '.');
}

respond(true, 'Enquiry received. Our team will contact you within 24 hours.');

// =========================================================
// Mail helpers
// =========================================================

function send_admin_notification($name, $phone, $email, $product_name, $product_price, $message, $source_page) {
    $subject = '[' . SITE_NAME . '] New Enquiry: ' . $product_name;

    $body  = "You have a new product enquiry from the website.\n\n";
    $body .= "Product:  " . $product_name . ($product_price ? ' (' . $product_price . ')' : '') . "\n";
    $body .= "Name:     " . $name . "\n";
    $body .= "Phone:    " . $phone . "\n";
    $body .= "Email:    " . ($email !== '' ? $email : 'Not provided') . "\n";
    $body .= "Message:  " . ($message !== '' ? $message : 'Not provided') . "\n";
    $body .= "Page:     " . $source_page . "\n";
    $body .= "Time:     " . date('d M Y, h:i A') . "\n";

    $headers  = 'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM_EMAIL . '>' . "\r\n";
    $headers .= $email !== '' ? 'Reply-To: ' . $email . "\r\n" : '';
    $headers .= 'X-Mailer: PHP/' . phpversion();

    return @mail(ADMIN_EMAIL, $subject, $body, $headers);
}

function send_customer_confirmation($name, $email, $product_name) {
    $subject = 'We received your enquiry — ' . SITE_NAME;

    $body  = "Hi " . $name . ",\n\n";
    $body .= "Thank you for your interest in our " . $product_name . ".\n";
    $body .= "Our team has received your enquiry and will contact you within 24 hours ";
    $body .= "with pricing, availability and next steps.\n\n";
    $body .= "If it's urgent, call or WhatsApp us directly at " . SITE_PHONE . ".\n\n";
    $body .= "Regards,\n" . SITE_NAME . "\nShahdara, New Delhi \xE2\x80\x93 110032, India\n";

    $headers  = 'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM_EMAIL . '>' . "\r\n";
    $headers .= 'X-Mailer: PHP/' . phpversion();

    return @mail($email, $subject, $body, $headers);
}
