<?php
// save_quiz.php — saves the user's flow-profile quiz result

require 'db.php';
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POST only']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

$profileName  = $data['profile_name']  ?? null;
$profileIcon  = $data['profile_icon']  ?? null;
$sound        = $data['sound']         ?? null;
$score        = $data['score']         ?? null;
$userId       = $_SESSION['user_id']   ?? null;

if (!$profileName || $sound === null || $score === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Save quiz result
$stmt = $conn->prepare(
    "INSERT INTO quiz_results (user_id, profile_name, profile_icon, sound, score) 
     VALUES (?, ?, ?, ?, ?)"
);
$stmt->bind_param("isssi", $userId, $profileName, $profileIcon, $sound, $score);
$stmt->execute();
$stmt->close();

// Update user's preferred profile and sound if logged in
if ($userId) {
    $update = $conn->prepare(
        "UPDATE users SET flow_profile = ?, preferred_sound = ? WHERE id = ?"
    );
    $update->bind_param("ssi", $profileName, $sound, $userId);
    $update->execute();
    $update->close();
}

$conn->close();

echo json_encode(['success' => true, 'message' => 'Quiz result saved']);
exit;
