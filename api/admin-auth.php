<?php

/*
 * Shared admin gate.
 *
 * Usage (after session_start() and require_once "db.php"):
 *     $admin_id = require_admin($conn);
 *
 * The account type is ALWAYS read from the database on every request,
 * never from the session. That way a promotion/demotion made in the admin
 * panel or directly in the database takes effect immediately, and nothing
 * the browser sends can make someone an admin.
 */
function require_admin(mysqli $conn): int
{
    if (!isset($_SESSION["user_id"])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "You must be logged in."
        ]);
        exit;
    }

    $user_id = (int) $_SESSION["user_id"];

    $stmt = $conn->prepare(
        "SELECT account_type FROM users WHERE user_id = ? LIMIT 1"
    );
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row || $row["account_type"] !== "admin") {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Admin access required."
        ]);
        exit;
    }

    return $user_id;
}

?>
