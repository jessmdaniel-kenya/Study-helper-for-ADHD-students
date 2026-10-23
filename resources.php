<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Resources — FlowState</title>
  <link rel="stylesheet" href="styles.css"/>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;700&display=swap" rel="stylesheet"/>
</head>
<body>

  <nav class="navbar">
    <div class="nav-brand">⚡ <span>FlowState</span></div>
    <div class="nav-links">
      <a href="index.html">Home</a>
      <a href="superpowers.html">Superpowers</a>
      <a href="resources.php" class="active">Resources</a>
      <a href="quiz.html">Quiz</a>
      <a href="login.html">Login</a>
    </div>
  </nav>

  <main class="page-content">
    <div class="page-label">STUDY YOUR WAY</div>
    <div class="resources-header">
      <h2 class="page-title" style="margin-bottom:0">RESOURCE HUB</h2>
      <button class="btn-primary" id="toggle-upload">+ Upload Resource</button>
    </div>
    <p class="page-sub">Filter by the mood you're in right now — not by subject. Find what works for the brain you have today.</p>

    <?php
    // DB connection + session
    require 'db.php';
    session_start();

    // Fetch resources with uploader name
    $resources = [];
    $result = $conn->query("
      SELECT r.*, u.name AS uploader_name 
      FROM resources r 
      LEFT JOIN users u ON r.uploader_id = u.id 
      ORDER BY r.created_at DESC
    ");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $resources[] = $row;
        }
    }
    $conn->close();
    ?>

    <!-- UPLOAD FORM — handled by upload.php -->
    <div id="upload-form" class="upload-form hidden">
      <form action="upload.php" method="POST" enctype="multipart/form-data">
        <div class="form-row">
          <input type="text" name="title" placeholder="Resource title..." required/>
          <input type="text" name="subject" placeholder="Subject..." required/>
          <select name="mood">
            <option value="chaos">🏫 Noisy Classroom</option>
            <option value="cafe">☕ Coffee Shop</option>
            <option value="rain">🌧️ Heavy Rain</option>
            <option value="music">🎵 Lo-fi Beats</option>
            <option value="silence">🔇 Silence</option>
          </select>
          <input type="file" name="file" accept=".pdf,.doc,.docx,.ppt,.pptx"/>
          <button type="submit" class="btn-accent">Upload</button>
        </div>
      </form>
    </div>

    <!-- MOOD FILTERS -->
    <div class="filter-bar">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="chaos">🏫 Noisy Classroom</button>
      <button class="filter-btn" data-filter="cafe">☕ Coffee Shop</button>
      <button class="filter-btn" data-filter="rain">🌧️ Heavy Rain</button>
      <button class="filter-btn" data-filter="music">🎵 Lo-fi Beats</button>
      <button class="filter-btn" data-filter="silence">🔇 Silence</button>
    </div>

    <!-- RESOURCE CARDS (loaded from database) -->
    <div class="resource-grid" id="resource-grid">
      <?php if (empty($resources)): ?>
        <p style="grid-column:1/-1; text-align:center; color:#7c7a9e;">No resources yet. Be the first to upload one!</p>
      <?php else: ?>
        <?php foreach ($resources as $res): ?>
          <div class="resource-card" data-mood="<?php echo htmlspecialchars($res['mood']); ?>">
            <div class="resource-tags">
              <span class="mood-tag <?php echo htmlspecialchars($res['mood']); ?>">
                <?php
                  $moodLabels = [
                    'chaos'   => '🏫 Noisy Classroom',
                    'cafe'    => '☕ Coffee Shop',
                    'rain'    => '🌧️ Heavy Rain',
                    'music'   => '🎵 Lo-fi Beats',
                    'silence' => '🔇 Silence',
                  ];
                  echo htmlspecialchars($moodLabels[$res['mood']] ?? $res['mood']);
                ?>
              </span>
              <span class="subject-tag"><?php echo htmlspecialchars($res['subject'] ?? 'General'); ?></span>
            </div>
            <div class="resource-title"><?php echo htmlspecialchars($res['title']); ?></div>
            <div class="resource-uploader">by <?php echo htmlspecialchars($res['uploader_name'] ?? 'Anonymous'); ?></div>
            <div class="resource-meta-tags"><span>#shared</span></div>
            <div class="resource-footer">
              <button class="like-btn" data-id="<?php echo $res['id']; ?>">🤍 0</button>
              <?php if ($res['filename']): ?>
                <a href="uploads/<?php echo htmlspecialchars($res['filename']); ?>" download class="download-btn">Download</a>
              <?php else: ?>
                <button class="download-btn" disabled>No file</button>
              <?php endif; ?>
            </div>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
  </main>

  <script src="script.js"></script>
</body>
</html>
