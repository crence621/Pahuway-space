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

if (!isset($_SESSION["user_id"])) {
    echo json_encode([
        "success" => false,
        "message" => "You must be logged in to make a booking."
    ]);
    exit;
}

$user_id = $_SESSION["user_id"];

$property_id = $_POST["property_id"] ?? "";
$check_in = trim($_POST["check_in"] ?? "");
$check_out = trim($_POST["check_out"] ?? "");
$guests = $_POST["guests"] ?? "";

if ($property_id === "" || $check_in === "" || $check_out === "" || $guests === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please complete all booking fields."
    ]);
    exit;
}

if (!is_numeric($property_id) || !is_numeric($guests) || $guests < 1) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid booking information."
    ]);
    exit;
}

$property_id = (int) $property_id;
$guests = (int) $guests;

$stmt = $conn->prepare(
    "SELECT price, price_unit, status
     FROM properties
     WHERE property_id = ?
     LIMIT 1"
);

$stmt->bind_param("i", $property_id);
$stmt->execute();
$result = $stmt->get_result();
$property = $result->fetch_assoc();
$stmt->close();

if (!$property) {
    echo json_encode([
        "success" => false,
        "message" => "Property not found."
    ]);
    exit;
}

if ($property["status"] !== "available") {
    echo json_encode([
        "success" => false,
        "message" => "This property is not currently available."
    ]);
    exit;
}

$checkInDate = DateTime::createFromFormat("Y-m-d", $check_in);
$checkOutDate = DateTime::createFromFormat("Y-m-d", $check_out);

if (
    !$checkInDate ||
    !$checkOutDate ||
    $checkInDate->format("Y-m-d") !== $check_in ||
    $checkOutDate->format("Y-m-d") !== $check_out
) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid booking dates."
    ]);
    exit;
}

if ($checkOutDate <= $checkInDate) {
    echo json_encode([
        "success" => false,
        "message" => "Check-out must be after check-in."
    ]);
    exit;
}

$nights = $checkInDate->diff($checkOutDate)->days;

$price = (float) $property["price"];

if ($property["price_unit"] === "daily") {
    $total_amount = $price * $nights;
} else {
    $total_amount = ($price / 30) * $nights;
}

$overlap = $conn->prepare(
    "SELECT booking_id
     FROM bookings
     WHERE property_id = ?
       AND booking_status IN ('pending', 'confirmed')
       AND check_in < ?
       AND check_out > ?
     LIMIT 1"
);

$overlap->bind_param("iss", $property_id, $check_out, $check_in);
$overlap->execute();
$overlap->store_result();

if ($overlap->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "This property is already booked for those dates."
    ]);

    $overlap->close();
    $conn->close();
    exit;
}

$overlap->close();

$stmt = $conn->prepare(
    "INSERT INTO bookings (
        user_id,
        property_id,
        check_in,
        check_out,
        guests,
        nights,
        total_amount,
        booking_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')"
);

$stmt->bind_param(
    "iisssid",
    $user_id,
    $property_id,
    $check_in,
    $check_out,
    $guests,
    $nights,
    $total_amount
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Booking created successfully.",
        "booking_id" => $stmt->insert_id,
        "nights" => $nights,
        "total_amount" => round($total_amount, 2)
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to create booking."
    ]);
}

$stmt->close();
$conn->close();

?>