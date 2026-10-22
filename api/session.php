
<?php

session_start();

require_once "db.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode([
        "loggedIn" => false
    ]);
    exit;
}

$user_id = (int) $_SESSION["user_id"];

$has_account_type = false;
$col = $conn->query("SHOW COLUMNS FROM users LIKE 'account_type'");

if ($col && $col->num_rows > 0) {
    $has_account_type = true;
}

$select = $has_account_type
    ? "SELECT user_id, full_name, email, account_type FROM users WHERE user_id = ? LIMIT 1"
    : "SELECT user_id, full_name, email, 'user' AS account_type FROM users WHERE user_id = ? LIMIT 1";

$stmt = $conn->prepare($select);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user) {
    $_SESSION = [];
    session_destroy();

    echo json_encode([
        "loggedIn" => false
    ]);
    exit;
}

echo json_encode([
    "loggedIn" => true,
    "user" => [
        "user_id" => (int) $user["user_id"],
        "full_name" => $user["full_name"],
        "email" => $user["email"],
        "account_type" => $user["account_type"]
    ]
]);

$conn->close();

?>
