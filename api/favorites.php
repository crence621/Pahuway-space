<?php

session_start();
require_once "db.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "You must be logged in."]);
    exit;
}

$user_id = (int) $_SESSION["user_id"];

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $stmt = $conn->prepare(
        "SELECT favorites.property_id
         FROM favorites
         WHERE favorites.user_id = ?"
    );

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $result = $stmt->get_result();
    $favorites = [];

    while ($row = $result->fetch_assoc()) {
        $favorites[] = (int) $row["property_id"];
    }

    echo json_encode([
        "success" => true,
        "favorites" => $favorites
    ]);

    $stmt->close();
    $conn->close();
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $property_id = isset($_POST["property_id"]) ? (int) $_POST["property_id"] : 0;
    $action = $_POST["action"] ?? "";

    if ($property_id <= 0 || !in_array($action, ["add", "remove"], true)) {
        echo json_encode(["success" => false, "message" => "Invalid request."]);
        exit;
    }

    if ($action === "add") {
        $stmt = $conn->prepare(
            "INSERT IGNORE INTO favorites (user_id, property_id)
             VALUES (?, ?)"
        );
    } else {
        $stmt = $conn->prepare(
            "DELETE FROM favorites
             WHERE user_id = ? AND property_id = ?"
        );
    }

    $stmt->bind_param("ii", $user_id, $property_id);

    if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "message" => $stmt->error
    ]);
    exit;
}

    echo json_encode([
        "success" => true,
        "action" => $action
    ]);

    $stmt->close();
    $conn->close();
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid request method."]);

?>