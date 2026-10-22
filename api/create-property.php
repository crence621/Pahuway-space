<?php

session_start();

require_once "db.php";

/*
| Bills: 1 = covered by rent, 0 = paid separately.
| Internet only: 2 = not available (the owner unticked "Has internet",
| so the field is not sent).
*/

function bill_value($value, $allow_none = false)
{
    if ($value === "1") return 1;
    if ($value === "0") return 0;
    return $allow_none ? 2 : 0;
}

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
| Pets and parking
*/

$pets_allowed = isset($_POST["pets_allowed"]) ? 1 : 0;
$pet_conditions = trim($_POST["pet_conditions"] ?? "");
$parking_nearby = isset($_POST["parking_nearby"]) ? 1 : 0;
$parking_fee = $_POST["parking_fee"] ?? "";

if ($pets_allowed === 0 || $pet_conditions === "") {
    $pet_conditions = null;
} else {
    $pet_conditions = mb_substr($pet_conditions, 0, 255);
}

if ($parking_nearby === 1) {
    if (!in_array($parking_fee, ["free", "paid"])) {
        echo json_encode([
            "success" => false,
            "message" => "Please say if the nearby parking is free or paid."
        ]);
        exit;
    }
} else {
    $parking_fee = null;
}

/*
| Bills
*/

$electricity_included = bill_value($_POST["electricity_included"] ?? null);
$water_included = bill_value($_POST["water_included"] ?? null);
$internet_included = bill_value($_POST["internet_included"] ?? null, true);

/*
| Amenities & facilities
*/

$allowed_amenities = [
    "aircon", "heating", "refrigerator",
    "microwave", "washing_machine", "tv"
];

$posted_amenities = $_POST["amenities"] ?? [];

if (!is_array($posted_amenities)) {
    $posted_amenities = [];
}

$amenities = implode(",", array_values(array_intersect($allowed_amenities, $posted_amenities)));

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
        status,
        pets_allowed,
        pet_conditions,
        parking_nearby,
        parking_fee,
        electricity_included,
        water_included,
        internet_included,
        amenities
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, 'available', ?, ?, ?, ?, ?, ?, ?, ?)"
);

$stmt->bind_param(
    "isssssdsiissisisiiis",
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
    $image,
    $pets_allowed,
    $pet_conditions,
    $parking_nearby,
    $parking_fee,
    $electricity_included,
    $water_included,
    $internet_included,
    $amenities
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
