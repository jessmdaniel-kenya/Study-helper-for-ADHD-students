<?php
// upload.php — saves a resource to the database

require 'db.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title   = trim($_POST['title']);
    $subject = trim($_POST['subject']);
    $mood    = trim($_POST['mood']);
    $uploader_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $filename = null;

    // Handle file upload if one was provided
    if (isset($_FILES['file']) && $_FILES['file']['error'] === 0) {
        $allowed = ['pdf','doc','docx','ppt','pptx'];
        $ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
        if (in_array($ext, $allowed)) {
            $filename = time() . '_' . basename($_FILES['file']['name']);
            move_uploaded_file($_FILES['file']['tmp_name'], 'uploads/' . $filename);
        }
    }

    $stmt = $conn->prepare("INSERT INTO resources (title, subject, mood, filename, uploader_id) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssi", $title, $subject, $mood, $filename, $uploader_id);
    $stmt->execute();
    $stmt->close();
    $conn->close();

    header("Location: resources.php?uploaded=1");
    exit();
}
?>
