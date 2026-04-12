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
      <a href="resources.html">Resources</a>
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
    $name = htmlspecialchars($_SESSION['name']);
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
        <span class="dash-value">Noisy Classroom</span>
      </div>
      <div class="dashboard-item">
        <span class="dash-icon">⚡</span>
        <span class="dash-label">Flow Profile</span>
        <span class="dash-value">Chaos Architect</span>
      </div>
      <div class="dashboard-item">
        <span class="dash-icon">📚</span>
        <span class="dash-label">Resources Saved</span>
        <span class="dash-value">3 items</span>
      </div>
      <div class="dashboard-item">
        <span class="dash-icon">🔥</span>
        <span class="dash-label">Streak</span>
        <span class="dash-value">4 days</span>
      </div>
    </div>

    <div style="text-align:center; margin-top:40px;">
      <a href="logout.php" class="btn-secondary">Log Out</a>
    </div>
  </main>

  <script src="script.js"></script>
</body>
</html>
