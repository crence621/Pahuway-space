<?php

session_start();

require_once "db.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method."
    ]);
    exit;
}

/*
| Check if user is logged in
*/

if (!isset($_SESSION["user_id"])) {
    echo json_encode([
        "success" => false,
        "message" => "You must be logged in to list a property."
    ]);
    exit;
}

$owner_id = $_SESSION["user_id"];

/*
| Get form data
*/

$property_code = trim($_POST["property_code"] ?? "");
$property_type = trim($_POST["property_type"] ?? "");
$title = trim($_POST["title"] ?? "");
$location = trim($_POST["location"] ?? "");
$description = trim($_POST["description"] ?? "");
$price = $_POST["price"] ?? "";
$price_unit = $_POST["price_unit"] ?? "monthly";
$bedrooms = $_POST["bedrooms"] ?? 0;
$bathrooms = $_POST["bathrooms"] ?? 0;
$area = trim($_POST["area"] ?? "");
$image = trim($_POST["image"] ?? "");

/*
| Validate required fields
*/

if (
    $property_code === "" ||
    $property_type === "" ||
    $title === "" ||
    $location === "" ||
    $price === ""
) {
    echo json_encode([
        "success" => false,
        "message" => "Please fill in all required fields."
    ]);
    exit;
}

/*
| Validate price
*/

if (!is_numeric($price) || $price <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid price."
    ]);
    exit;
}

$price = (float) $price;

/*
| Validate price unit
*/

if (!in_array($price_unit, ["daily", "monthly"])) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid price unit."
    ]);
    exit;
}

/*
| Validate bedrooms and bathrooms
*/

if (!is_numeric($bedrooms) || $bedrooms < 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid number of bedrooms."
    ]);
    exit;
}

if (!is_numeric($bathrooms) || $bathrooms < 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid number of bathrooms."
    ]);
    exit;
}

$bedrooms = (int) $bedrooms;
$bathrooms = (int) $bathrooms;

/*
| Check if property code already exists
*/

$check = $conn->prepare(
    "SELECT property_id FROM properties WHERE property_code = ?"
);

$check->bind_param("s", $property_code);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "That property code already exists."
    ]);

    $check->close();
    $conn->close();
    exit;
}

$check->close();

/*
| Insert property
*/

$stmt = $conn->prepare(
    "INSERT INTO properties (
        owner_id,
        property_code,
        property_type,
        title,
        location,
        description,
        price,
        price_unit,
        bedrooms,
        bathrooms,
        area,
        image,
        verified,
        status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, 'available')"
);

$stmt->bind_param(
    "isssssdsiiss",
    $owner_id,
    $property_code,
    $property_type,
    $title,
    $location,
    $description,
    $price,
    $price_unit,
    $bedrooms,
    $bathrooms,
    $area,
    $image
);

if ($stmt->execute()) {

    echo json_encode([
        "success" => true,
        "message" => "Property listed successfully.",
        "property_id" => $stmt->insert_id
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Failed to list property."
    ]);
}

$stmt->close();
$conn->close();

?>