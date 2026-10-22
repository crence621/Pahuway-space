<?php

session_start();

require_once "db.php";
require_once "admin-auth.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$admin_id = require_admin($conn);

$target_id = isset($_POST["user_id"]) ? (int) $_POST["user_id"] : 0;
$new_type = $_POST["account_type"] ?? "";
$password = $_POST["current_password"] ?? "";

if ($target_id <= 0 || !in_array($new_type, ["user", "admin"], true)) {
    echo json_encode(["success" => false, "message" => "Invalid user or account type."]);
    exit;
}

/* An admin can't change their own role (also guarantees there is always
   at least one admin left after any change made through the panel). */
if ($target_id === $admin_id) {
    echo json_encode(["success" => false, "message" => "You can't change your own account type."]);
    exit;
}

/* Re-confirm the acting admin's password before changing anyone's access. */
$stmt = $conn->prepare("SELECT password FROM users WHERE user_id = ? LIMIT 1");
$stmt->bind_param("i", $admin_id);
$stmt->execute();
$admin = $stmt->get_result()->fetch_assoc();
$stmt->close();

if ($password === "" || !$admin || !password_verify($password, $admin["password"])) {
    echo json_encode(["success" => false, "message" => "Incorrect password."]);
    exit;
}

/* Make sure the target exists. */
$stmt = $conn->prepare("SELECT account_type FROM users WHERE user_id = ? LIMIT 1");
$stmt->bind_param("i", $target_id);
$stmt->execute();
$target = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$target) {
    echo json_encode(["success" => false, "message" => "User not found."]);
    exit;
}

if ($target["account_type"] === $new_type) {
    echo json_encode(["success" => false, "message" => "That account already has this type."]);
    exit;
}

$stmt = $conn->prepare("UPDATE users SET account_type = ? WHERE user_id = ?");
$stmt->bind_param("si", $new_type, $target_id);

if (!$stmt->execute()) {
    echo json_encode(["success" => false, "message" => "Failed to update account type."]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Account type updated.",
    "user_id" => $target_id,
    "account_type" => $new_type
]);

$stmt->close();
$conn->close();

?>
