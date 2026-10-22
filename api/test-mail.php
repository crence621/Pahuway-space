
<?php

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'POST requests only.'
    ]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$recipient = filter_var(
    $input['email'] ?? '',
    FILTER_VALIDATE_EMAIL
);

if (!$recipient) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Enter a valid recipient email.'
    ]);
    exit;
}

require_once __DIR__ . '/mail.php';

$sent = sendPahuwayEmail(
    $recipient,
    'Pahuway Space Test',
    'Pahuway Space Email Test',
    '<h2>Email test successful</h2>
     <p>Your Pahuway Space email configuration is working.</p>'
);

if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Email sent successfully.'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Email sending failed. Check the PHP error log.'
    ]);
}
