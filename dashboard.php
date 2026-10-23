<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Dashboard — FlowState</title>
  <link rel="stylesheet" href="styles.css"/>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;700&display=swap" rel="stylesheet"/>
</head>
<body>

  <nav class="navbar">
    <div class="nav-brand">⚡ <span>FlowState</span></div>
    <div class="nav-links">
      <a href="index.html">Home</a>
      <a href="superpowers.html">Superpowers</a>
      <a href="resources.php">Resources</a>
      <a href="quiz.html">Quiz</a>
      <a href="logout.php" class="active">Log Out</a>
    </div>
  </nav>

  <main class="page-content">
    <?php
    session_start();
    if (!isset($_SESSION['user_id'])) {
        header("Location: login.html");
        exit();
    }

    require 'db.php';

    $userId = $_SESSION['user_id'];
    $name   = htmlspecialchars($_SESSION['name']);

    // Fetch user's flow profile and preferred sound
    $stmt = $conn->prepare("SELECT flow_profile, preferred_sound FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->bind_result($flowProfile, $preferredSound);
    $stmt->fetch();
    $stmt->close();

    // Count resources uploaded by this user
    $resCount = 0;
    $resResult = $conn->query("SELECT COUNT(*) AS total FROM resources WHERE uploader_id = $userId");
    if ($resResult) {
        $row = $resResult->fetch_assoc();
        $resCount = (int) $row['total'];
    }

    // Latest quiz result
    $latestProfile = null;
    $latestSound   = null;
    $qr = $conn->query("SELECT profile_name, sound FROM quiz_results WHERE user_id = $userId ORDER BY created_at DESC LIMIT 1");
    if ($qr && ($qrow = $qr->fetch_assoc())) {
        $latestProfile = $qrow['profile_name'];
        $latestSound   = $qrow['sound'];
    }

    $conn->close();
    ?>

    <div style="text-align:center; margin-bottom:40px;">
      <div style="font-size:64px; margin-bottom:16px;">⚡</div>
      <div class="page-label">YOU'RE IN FLOW</div>
      <h2 class="page-title">Welcome, <?php echo $name; ?></h2>
      <p class="page-sub">Your dashboard is ready.</p>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-item">
        <span class="dash-icon">🎧</span>
        <span class="dash-label">Sound Profile</span>
        <span class="dash-value"><?php echo htmlspecialchars($preferredSound ?: 'Not set — take the quiz'); ?></span>
      </div>
      <div class="dashboard-item">
        <span class="dash-icon">⚡</span>
        <span class="dash-label">Flow Profile</span>
        <span class="dash-value"><?php echo htmlspecialchars($flowProfile ?: $latestProfile ?: 'Not set — take the quiz'); ?></span>
      </div>
      <div class="dashboard-item">
        <span class="dash-icon">📚</span>
        <span class="dash-label">Resources Saved</span>
        <span class="dash-value"><?php echo $resCount; ?> items</span>
      </div>
      <div class="dashboard-item">
        <span class="dash-icon">🔥</span>
        <span class="dash-label">Quiz Taken</span>
        <span class="dash-value"><?php echo ($latestProfile ? 'Yes' : 'Not yet'); ?></span>
      </div>
    </div>

    <div style="text-align:center; margin-top:40px;">
      <a href="quiz.html" class="btn-primary">Take the Flow Quiz</a>
      <a href="logout.php" class="btn-secondary">Log Out</a>
    </div>
  </main>

  <script src="script.js"></script>
</body>
</html>
