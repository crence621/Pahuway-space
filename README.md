# Pahuway-space


====================FOR LIVE SERVER DB.PHP (INFINITY FREE CREDS)============================

<?php

// InfinityFree MySQL credentials
$host = "sql304.infinityfree.com";
$username = "if0_43236778";
$password = "raritymlp12345";
$database = "if0_43236778_pahuway_space";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

?>

====================FOR LOCALHOST DB.PHP (XAMPP)============================



<?php

$host = "localhost";
$username = "root";
$password = "";
$database = "pahuway_space";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

?>


