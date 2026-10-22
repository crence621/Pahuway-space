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
    "SELECT property_id, property_code, property_type, title, location, description,
            price, price_unit, bedrooms, bathrooms, area, status, image,
            pets_allowed, pet_conditions, parking_nearby, parking_fee,
            electricity_included, water_included, internet_included, amenities
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
        "image" => $row["image"],
        "property_type" => $row["property_type"],
        "description" => $row["description"],
        "price_unit" => $row["price_unit"],
        "bedrooms" => (int) $row["bedrooms"],
        "bathrooms" => (int) $row["bathrooms"],
        "area" => $row["area"],
        "pets_allowed" => (bool) $row["pets_allowed"],
        "pet_conditions" => $row["pet_conditions"],
        "parking_nearby" => (bool) $row["parking_nearby"],
        "parking_fee" => $row["parking_fee"],
        "electricity_included" => (int) $row["electricity_included"],
        "water_included" => (int) $row["water_included"],
        "internet_included" => (int) $row["internet_included"],
        "amenities" => $row["amenities"] === "" ? [] : explode(",", $row["amenities"])
    ];
}

echo json_encode([
    "success" => true,
    "properties" => $properties
]);

$stmt->close();
$conn->close();

?>
