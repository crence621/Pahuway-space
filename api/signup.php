<?php

require_once "db.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method."
    ]);
    exit;
}

$full_name = trim($_POST["full_name"] ?? "");
$email = trim($_POST["email"] ?? "");
$password = $_POST["password"] ?? "";

if ($full_name === "" || $email === "" || $password === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please fill in all required fields."
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email address."
    ]);
    exit;
}

if (strlen($password) < 8) {
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 8 characters."
    ]);
    exit;
}

/* Check if email already exists */
$check = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "An account with this email already exists."
    ]);
    $check->close();
    $conn->close();
    exit;
}

$check->close();

/* Hash the password */
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

/* Insert new user */
$stmt = $conn->prepare(
    "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)"
);

$stmt->bind_param("sss", $full_name, $email, $hashed_password);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Account created successfully."
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to create account."
    ]);
}

$stmt->close();
$conn->close();

?>