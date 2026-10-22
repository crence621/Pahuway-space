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

$email = trim($_POST["email"] ?? "");
$password = $_POST["password"] ?? "";

if ($email === "" || $password === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please enter your email and password."
    ]);
    exit;
}

/* Find user */
$stmt = $conn->prepare(
    "SELECT user_id, full_name, email, password 
     FROM users 
     WHERE email = ?"
);

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$user = $result->fetch_assoc();

/* Verify password */
if (!password_verify($password, $user["password"])) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

/* Create session */
$_SESSION["user_id"] = $user["user_id"];
$_SESSION["full_name"] = $user["full_name"];
$_SESSION["email"] = $user["email"];

echo json_encode([
    "success" => true,
    "message" => "Login successful.",
    "user" => [
        "user_id" => $user["user_id"],
        "full_name" => $user["full_name"],
        "email" => $user["email"]
    ]
]);

$stmt->close();
$conn->close();

?>