<?php

session_start();
require_once "db.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "You must be logged in."]);
    exit;
}

$owner_id = (int) $_SESSION["user_id"];
$property_id = isset($_POST["property_id"]) ? (int) $_POST["property_id"] : 0;
$status = $_POST["status"] ?? "";

if ($property_id <= 0 || !in_array($status, ["available", "rented"], true)) {
    echo json_encode(["success" => false, "message" => "Invalid property or status."]);
    exit;
}

$stmt = $conn->prepare(
    "UPDATE properties
     SET status = ?
     WHERE property_id = ?
       AND owner_id = ?"
);

$stmt->bind_param("sii", $status, $property_id, $owner_id);

if (!$stmt->execute() || $stmt->affected_rows === 0) {
    echo json_encode(["success" => false, "message" => "Property not found or you do not own it."]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Property status updated.",
    "status" => $status
]);

$stmt->close();
$conn->close();

?>