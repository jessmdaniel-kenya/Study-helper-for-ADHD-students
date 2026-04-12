<?php
// signup.php — creates a new user account

require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name     = trim($_POST['name']);
    $email    = trim($_POST['email']);
    $password = $_POST['password'];

    // Check if email already exists
    $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        header("Location: login.html?exists=1");
        exit();
    }

    // Hash password before storing
    $hashed = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $email, $hashed);

    if ($stmt->execute()) {
        // Log them in immediately after signup
        session_start();
        $_SESSION['user_id'] = $stmt->insert_id;
        $_SESSION['name']    = $name;
        header("Location: dashboard.php");
        exit();
    } else {
        echo "Something went wrong. Please try again.";
    }

    $stmt->close();
    $conn->close();
}
?>
