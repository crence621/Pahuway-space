<?php

session_start();

require_once "db.php";
require_once "admin-auth.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

require_admin($conn);

$q = trim($_GET["q"] ?? "");

if ($q !== "") {
    $like = "%" . addcslashes($q, "%_\\") . "%";

    $stmt = $conn->prepare(
        "SELECT user_id, full_name, email, account_type
         FROM users
         WHERE full_name LIKE ? OR email LIKE ?
         ORDER BY (account_type = 'admin') DESC, full_name ASC
         LIMIT 200"
    );
    $stmt->bind_param("ss", $like, $like);
} else {
    $stmt = $conn->prepare(
        "SELECT user_id, full_name, email, account_type
         FROM users
         ORDER BY (account_type = 'admin') DESC, full_name ASC
         LIMIT 200"
    );
}

$stmt->execute();
$result = $stmt->get_result();

$users = [];

while ($row = $result->fetch_assoc()) {
    // Never include the password hash.
    $users[] = [
        "user_id" => (int) $row["user_id"],
        "full_name" => $row["full_name"],
        "email" => $row["email"],
        "account_type" => $row["account_type"]
    ];
}

echo json_encode([
    "success" => true,
    "users" => $users
]);

$stmt->close();
$conn->close();

?>
