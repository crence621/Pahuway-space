<?php

session_start();

require_once "db.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode([
        "success" => false,
        "message" => "You must be logged in."
    ]);
    exit;
}

$user_id = $_SESSION["user_id"];

$stmt = $conn->prepare(
    "SELECT
        bookings.booking_id,
        bookings.property_id,
        bookings.total_amount,
        properties.property_code,
        properties.title,
        properties.location,
        properties.image,
        bookings.check_in,
        bookings.check_out,
        bookings.guests,
        bookings.nights,
        bookings.total_amount,
        bookings.booking_status,
        bookings.created_at
     FROM bookings
     INNER JOIN properties
        ON bookings.property_id = properties.property_id
     WHERE bookings.user_id = ?
     ORDER BY bookings.created_at DESC"
);

$stmt->bind_param("i", $user_id);
$stmt->execute();

$result = $stmt->get_result();

$bookings = [];

while ($row = $result->fetch_assoc()) {
    $bookings[] = [
        "booking_id" => (int) $row["booking_id"],
        "property_id" => (int) $row["property_id"],
        "property_code" => $row["property_code"],
        "title" => $row["title"],
        "location" => $row["location"],
        "image" => $row["image"],
        "check_in" => $row["check_in"],
        "check_out" => $row["check_out"],
        "guests" => (int) $row["guests"],
        "nights" => (int) $row["nights"],
        "total_amount" => (float) $row["total_amount"],
        "booking_status" => $row["booking_status"],
        "created_at" => $row["created_at"]
    ];
}

echo json_encode([
    "success" => true,
    "bookings" => $bookings
]);

$stmt->close();
$conn->close();

?>