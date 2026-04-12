<?php
// login.php — checks credentials and starts session

require 'db.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email']);
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT id, name, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->bind_result($id, $name, $hashed);
    $stmt->fetch();

    if ($id && password_verify($password, $hashed)) {
        $_SESSION['user_id'] = $id;
        $_SESSION['name']    = $name;
        header("Location: dashboard.php");
        exit();
    } else {
        header("Location: login.html?error=1");
        exit();
    }

    $stmt->close();
    $conn->close();
}
?>
