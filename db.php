<?php
// db.php — database connection
// Replace these values with your InfinityFree MySQL details from your control panel

define('DB_HOST', 'sql.infinityfree.com');
define('DB_USER', 'your_db_username');
define('DB_PASS', 'your_db_password');
define('DB_NAME', 'your_db_name');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
