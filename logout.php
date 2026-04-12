<?php
// logout.php — destroys session and redirects home
session_start();
session_destroy();
header("Location: index.html");
exit();
?>
