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

$owner_id = $_SESSION["user_id"];

$stmt = $conn->prepare(
    "SELECT
        bookings.booking_id,
        bookings.property_id,
        properties.property_code,
        properties.title,
        properties.location,
        properties.image,
        bookings.user_id AS guest_id,
        guests.full_name AS guest_name,
        guests.email AS guest_email,
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
     INNER JOIN users AS guests
        ON bookings.user_id = guests.user_id
     WHERE properties.owner_id = ?
     ORDER BY bookings.created_at DESC"
);

$stmt->bind_param("i", $owner_id);
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
        "guest_id" => (int) $row["guest_id"],
        "guest_name" => $row["guest_name"],
        "guest_email" => $row["guest_email"],
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