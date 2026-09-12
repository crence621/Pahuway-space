<?php

session_start();

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode([
        "loggedIn" => false
    ]);
    exit;
}

echo json_encode([
    "loggedIn" => true,
    "user" => [
        "user_id" => $_SESSION["user_id"],
        "full_name" => $_SESSION["full_name"],
        "email" => $_SESSION["email"]
    ]
]);

?>