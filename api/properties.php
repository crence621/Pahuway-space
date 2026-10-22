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

    $properties[] = $row;
}

echo json_encode([
    "success" => true,
    "properties" => $properties
]);

$conn->close();

?>