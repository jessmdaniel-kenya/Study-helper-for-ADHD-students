# FlowState — Study Your Way

A study environment website built for ADHD brains. FlowState helps you find the sound, mood, and flow profile where your brain thrives — not just copes.

## What it is

FlowState is a front-end study hub with a PHP/MySQL back-end for user accounts and resource sharing. It is built around the idea that ADHD brains aren't broken — they run different software. The site lets users pick ambient sound profiles, take a quiz to discover their flow type, browse and upload study resources, and log into a personal dashboard.

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | Landing page — hero section, sound selector, philosophy pills |
| `superpowers.html` | ADHD "superpower" cards with expandable details |
| `resources.php` | Community resource library with mood/subject filters and upload form |
| `quiz.html` | Flow-profile quiz (3 questions) that recommends a sound and study style |
| `login.html` | Login / signup authentication page |
| `dashboard.php` | Logged-in user dashboard (session-protected) |
| `login.php` | PHP: verifies credentials, starts session, redirects to dashboard |
| `signup.php` | PHP: creates a new account (passwords hashed), logs user in automatically |
| `logout.php` | PHP: destroys session and returns home |
| `upload.php` | PHP: saves an uploaded resource (PDF/DOC/PPT) to the database |
| `db.php` | PHP: MySQL connection configuration |
| `script.js` | Front-end interactivity (sounds, quiz, filters, likes, auth tabs) |
| `styles.css` | All styling (dark theme, Bebas Neue + DM Sans fonts) |

## How it works

### 1. Front end (HTML/CSS/JS)
- **Sound Selector** (`index.html`): Choose an ambient background — Noisy Classroom, Coffee Shop, Heavy Rain, Lo-fi Beats, or Silence. Each gives on-screen feedback about why it suits different ADHD focus styles.
- **Superpowers** (`superpowers.html`): Clickable cards that reframe ADHD traits as strengths.
- **Quiz** (`quiz.html`): Three questions about when you feel most alive, your ideal study spot, and what triggers hyperfocus. Results map to one of four profiles:
  - 🌪️ The Chaos Architect — Noisy Classroom
  - 🌊 The Deep Diver — Heavy Rain
  - 🎵 The Beat Rider — Lo-fi Beats
  - ⚡ The Social Spark — Coffee Shop
- **Resources** (`resources.php`): Browse uploaded study materials, filter by mood/subject, like items, and upload your own.
- **Auth** (`login.html`): Tabbed login/signup forms that POST to `login.php` and `signup.php`.

### 2. Back end (PHP + MySQL)
- `db.php` connects to a MySQL database (configured for InfinityFree hosting by default). You must update the credentials in this file before the PHP features work.
- `users` table stores accounts (`id`, `name`, `email`, `password`). Passwords are hashed with `password_hash()` and verified with `password_verify()`.
- `resources` table stores uploaded materials (`title`, `subject`, `mood`, `filename`, `uploader_id`). Files are saved to an `uploads/` folder.
- Sessions track logged-in users; `dashboard.php` redirects to `login.html` if no session exists.

## Setup & deployment

1. **Clone / copy** all files into the same folder on your web server.
2. **Configure the database**:
   - Create a MySQL database and a `users` table and a `resources` table.
   - Edit `db.php` and replace the placeholder host, user, password, and database name with your own credentials.
3. **Create an `uploads/` folder** in the project root and make it writable by the web server (needed for file uploads).
4. **Serve with PHP** — the `.php` files will not work if you just open `index.html` in a browser. Use a local PHP server (e.g. XAMPP, MAMP, Laragon) or deploy to a PHP host such as InfinityFree.

## Default credentials

`db.php` ships with placeholder values:

```php
define('DB_HOST', 'sql.infinityfree.com');
define('DB_USER', 'your_db_username');
define('DB_PASS', 'your_db_password');
define('DB_NAME', 'your_db_name');
```

Update these before testing login, signup, or uploads.

## Tech stack

- HTML5, CSS3, vanilla JavaScript
- PHP 7+, MySQLi
- Google Fonts (Bebas Neue, DM Sans)

## License

This project is open for use and modification.
