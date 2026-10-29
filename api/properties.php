<?php

require_once "db.php";

header("Content-Type: application/json");

$sql = "SELECT 
            properties.property_id,
            properties.owner_id,
            users.full_name AS owner_name,
            properties.property_code,
            properties.property_type,
            properties.title,
            properties.location,
            properties.description,
            properties.price,
            properties.price_unit,
            properties.bedrooms,
            properties.bathrooms,
            properties.area,
            properties.image,
            properties.verified,
            properties.status,
            properties.pets_allowed,
            properties.pet_conditions,
            properties.parking_nearby,
            properties.parking_fee,
            properties.electricity_included,
            properties.water_included,
            properties.internet_included,
            properties.amenities,
            properties.created_at
        FROM properties
        INNER JOIN users ON properties.owner_id = users.user_id
        WHERE properties.status != 'inactive'
        ORDER BY properties.property_id ASC";

$result = $conn->query($sql);

if (!$result) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve properties."
    ]);
    $conn->close();
    exit;
}

$properties = [];

while ($row = $result->fetch_assoc()) {

    $row["property_id"] = (int) $row["property_id"];
    $row["owner_id"] = (int) $row["owner_id"];
    $row["price"] = (float) $row["price"];
    $row["bedrooms"] = (int) $row["bedrooms"];
    $row["bathrooms"] = (int) $row["bathrooms"];
    $row["verified"] = (bool) $row["verified"];
    $row["pets_allowed"] = (bool) $row["pets_allowed"];
    $row["parking_nearby"] = (bool) $row["parking_nearby"];
    $row["electricity_included"] = (int) $row["electricity_included"];
    $row["water_included"] = (int) $row["water_included"];
    $row["internet_included"] = (int) $row["internet_included"];
    $row["amenities"] = $row["amenities"] === "" ? [] : explode(",", $row["amenities"]);

    $properties[] = $row;
}

echo json_encode([
    "success" => true,
    "properties" => $properties
]);

$conn->close();

?>
