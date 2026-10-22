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

/* Read the user fresh from the database so the account type is never stale
   (e.g. right after being promoted/demoted in the admin panel or the DB). */
$user_id = (int) $_SESSION["user_id"];

/* Older databases may not have the account_type column yet. Without this
   check the query throws, session.php returns a PHP error instead of JSON,
   and the front-end bounces the user straight back to the login page. */
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
    // Account no longer exists: end the session.
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
