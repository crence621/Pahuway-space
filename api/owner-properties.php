<?php

session_start();
require_once "db.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "You must be logged in."]);
    exit;
}

$owner_id = (int) $_SESSION["user_id"];

$stmt = $conn->prepare(
    "SELECT property_id, property_code, title, location, price, status, image
     FROM properties
     WHERE owner_id = ?
     ORDER BY property_id DESC"
);

$stmt->bind_param("i", $owner_id);
$stmt->execute();

$result = $stmt->get_result();
$properties = [];

while ($row = $result->fetch_assoc()) {
    $properties[] = [
        "property_id" => (int) $row["property_id"],
        "property_code" => $row["property_code"],
        "title" => $row["title"],
        "location" => $row["location"],
        "price" => (float) $row["price"],
        "status" => $row["status"],
        "image" => $row["image"]
    ];
}

echo json_encode([
    "success" => true,
    "properties" => $properties
]);

$stmt->close();
$conn->close();

?>