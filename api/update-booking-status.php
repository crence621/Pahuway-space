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
$booking_id = isset($_POST["booking_id"]) ? (int) $_POST["booking_id"] : 0;
$status = $_POST["status"] ?? "";

if ($booking_id <= 0 || !in_array($status, ["confirmed", "cancelled"], true)) {
    echo json_encode(["success" => false, "message" => "Invalid booking or status."]);
    exit;
}

$stmt = $conn->prepare(
    "SELECT bookings.booking_id, bookings.booking_status, bookings.total_amount
     FROM bookings
     INNER JOIN properties
        ON bookings.property_id = properties.property_id
     WHERE bookings.booking_id = ?
       AND properties.owner_id = ?
     LIMIT 1"
);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
    exit;
}

$stmt->bind_param("ii", $booking_id, $owner_id);
$stmt->execute();

$result = $stmt->get_result();
$booking = $result->fetch_assoc();
$stmt->close();

if (!$booking) {
    echo json_encode(["success" => false, "message" => "Booking not found or you do not own this property."]);
    exit;
}

if ($booking["booking_status"] !== "pending") {
    echo json_encode(["success" => false, "message" => "Only pending bookings can be updated."]);
    exit;
}

$update = $conn->prepare(
    "UPDATE bookings
     SET booking_status = ?
     WHERE booking_id = ?"
);

if (!$update) {
    echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
    exit;
}

$update->bind_param("si", $status, $booking_id);

if (!$update->execute()) {
    echo json_encode(["success" => false, "message" => "Failed to update booking: " . $update->error]);
    exit;
}

$update->close();

if ($status === "confirmed") {
    $payment_method = "Pending";
    $payment_status = "pending";
    $amount = (float) $booking["total_amount"];

    $payment = $conn->prepare(
        "INSERT INTO payments
        (booking_id, payment_method, amount, payment_status, payment_date)
        VALUES (?, ?, ?, ?, NOW())"
    );

    if (!$payment) {
        echo json_encode(["success" => false, "message" => "Booking updated, but payment record failed: " . $conn->error]);
        exit;
    }

    $payment->bind_param(
        "isds",
        $booking_id,
        $payment_method,
        $amount,
        $payment_status
    );

    if (!$payment->execute()) {
        echo json_encode(["success" => false, "message" => "Booking updated, but payment record failed: " . $payment->error]);
        exit;
    }

    $payment->close();
}

echo json_encode([
    "success" => true,
    "message" => "Booking status updated successfully.",
    "booking_id" => $booking_id,
    "booking_status" => $status
]);

$conn->close();

?>