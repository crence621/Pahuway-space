<?php
/*
 * Shared bootstrap + admin gate for everything under /admin/api.
 * The account type is ALWAYS read from the database on every request,
 * never from the session or the browser.
 */
session_start();
require_once __DIR__ . "/../../api/db.php";

mysqli_report(MYSQLI_REPORT_OFF);
header("Content-Type: application/json");

function json_out(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function require_admin(mysqli $conn): int
{
    if (!isset($_SESSION["user_id"])) {
        json_out(["success" => false, "message" => "You must be logged in."], 401);
    }

    $id = (int) $_SESSION["user_id"];
    $stmt = $conn->prepare("SELECT account_type FROM users WHERE user_id = ? LIMIT 1");
    if (!$stmt) {
        json_out(["success" => false, "message" => "The users table has no account_type column. Run fix-account-type.sql."], 500);
    }
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row || $row["account_type"] !== "admin") {
        json_out(["success" => false, "message" => "Admin access required."], 403);
    }
    return $id;
}

$admin_id = require_admin($conn);
