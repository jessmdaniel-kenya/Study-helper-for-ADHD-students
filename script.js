// script.js — FlowState interactivity

// ── SOUND SELECTOR ────────────────────────────────────────────────────────────
const SOUND_URLS = {
  chaos:   "https://www.soundsnap.com/tags/classroom",
  cafe:    "https://www.soundsnap.com/tags/cafe",
  rain:    "https://www.soundsnap.com/tags/rain",
  music:   "https://www.soundsnap.com/tags/lofi",
  silence: null
};

const SOUND_FEEDBACK = {
  chaos:   { msg: "🏫 Noisy Classroom selected — chatter and shuffling. Let the noise do its job.", color: "#ff6b35" },
  cafe:    { msg: "☕ Coffee Shop selected — low hum, ambient energy. Your brain will settle.", color: "#ffd166" },
  rain:    { msg: "🌧️ Heavy Rain selected — drumming, unpredictable. Deep focus mode.", color: "#06d6a0" },
  music:   { msg: "🎵 Lo-fi Beats selected — rhythm and flow. Let the music carry you.", color: "#7c3aed" },
  silence: { msg: "🔇 Silence selected — for the rare moment when quiet is what you need.", color: "#7c7a9e" },
};

let currentSound = null;
let audioEl = null;

function initSoundSelector() {
  const cards = document.querySelectorAll('.sound-card');
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.sound;

      // Deactivate all
      cards.forEach(c => {
        c.classList.remove('active', 'chaos', 'cafe', 'rain', 'music', 'silence');
        const playing = c.querySelector('.sound-playing');
        if (playing) playing.classList.add('hidden');
      });

      // If same card clicked again, turn off
      if (currentSound === id) {
        currentSound = null;
        hideFeedback();
        return;
      }

      // Activate selected
      card.classList.add('active', id);
      const playing = card.querySelector('.sound-playing');
      if (playing) playing.classList.remove('hidden');
      currentSound = id;
      showFeedback(id);
    });
  });
}

function showFeedback(id) {
  const fb = document.getElementById('sound-feedback');
  if (!fb) return;
  const data = SOUND_FEEDBACK[id];
  fb.textContent = data.msg;
  fb.style.background = `${data.color}22`;
  fb.style.borderColor = `${data.color}55`;
  fb.style.color = '#f0eeff';
  fb.classList.remove('hidden');
}

function hideFeedback() {
  const fb = document.getElementById('sound-feedback');
  if (fb) fb.classList.add('hidden');
}

// ── SUPERPOWER CARDS ──────────────────────────────────────────────────────────
function initSuperpowerCards() {
  const cards = document.querySelectorAll('.sp-card');
  if (!cards.length) return;

  const COLORS = {
    0: '#ff6b35', 1: '#ff6b35', 2: '#ff6b35',
    3: '#7c3aed', 4: '#7c3aed',
    5: '#06d6a0', 6: '#06d6a0'
  };

  cards.forEach((card, i) => {
    const color = card.dataset.color || COLORS[i] || '#ff6b35';
    card.addEventListener('click', () => {
      const isOpen = card.classList.contains('open');

      // Close all
      cards.forEach(c => {
        c.classList.remove('open');
        c.style.background = '#12121a';
        c.style.borderColor = '#1e1e2e';
        c.style.boxShadow = 'none';
        const title = c.querySelector('.sp-title');
        if (title) title.style.color = '#f0eeff';
      });

      if (!isOpen) {
        card.classList.add('open');
        card.style.background = `linear-gradient(135deg, ${color}22, #12121a)`;
        card.style.borderColor = color;
        card.style.boxShadow = `0 8px 40px ${color}33`;
        const title = card.querySelector('.sp-title');
        if (title) title.style.color = color;
        const push = card.querySelector('.sp-push');
        if (push) push.style.borderTopColor = `${color}44`;
      }
    });
  });
}

// ── RESOURCE FILTER ───────────────────────────────────────────────────────────
function initResourceFilter() {
  const btns  = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.resource-card');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.mood === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// ── LIKE BUTTONS ──────────────────────────────────────────────────────────────
function initLikeButtons() {
  const btns = document.querySelectorAll('.like-btn');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const liked = btn.classList.toggle('liked');
      const parts = btn.textContent.split(' ');
      const count = parseInt(parts[1]);
      btn.textContent = (liked ? '❤️' : '🤍') + ' ' + (liked ? count + 1 : count - 1);
    });
  });
}

// ── UPLOAD FORM TOGGLE ────────────────────────────────────────────────────────
function initUploadToggle() {
  const btn  = document.getElementById('toggle-upload');
  const form = document.getElementById('upload-form');
  if (!btn || !form) return;

  btn.addEventListener('click', () => {
    form.classList.toggle('hidden');
    btn.textContent = form.classList.contains('hidden') ? '+ Upload Resource' : '✕ Cancel';
  });
}

// ── AUTH TABS ─────────────────────────────────────────────────────────────────
function showTab(tab) {
  const loginForm   = document.getElementById('form-login');
  const signupForm  = document.getElementById('form-signup');
  const tabLogin    = document.getElementById('tab-login');
  const tabSignup   = document.getElementById('tab-signup');
  if (!loginForm) return;

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
  }
}

// Auto-switch to signup tab if ?signup=1
if (window.location.search.includes('signup=1')) {
  showTab('signup');
}

// ── QUIZ ──────────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    q: "When do you feel most alive mentally?",
    options: [
      "When there's noise and movement around me",
      "When I'm solving a puzzle or challenge",
      "When I'm creating or making something",
      "When I'm helping someone figure things out"
    ]
  },
  {
    q: "Your ideal study spot is...",
    options: [
      "A busy café or library with buzz",
      "Outdoors with fresh air and movement",
      "My room with music playing",
      "Anywhere — I bring my own vibe"
    ]
  },
  {
    q: "When you hit hyperfocus, what triggered it?",
    options: [
      "The topic felt genuinely fascinating",
      "There was a deadline creating urgency",
      "Someone challenged me on it",
      "I made it into a game or competition"
    ]
  }
];

const PROFILES = [
  {
    name: "The Chaos Architect", icon: "🌪️", color: "#ff6b35",
    sound: "Noisy Classroom",
    tip: "You thrive in controlled chaos. Sit near windows, keep ambient noise on, use colour-coded notes. Your brain isn't scattered — it's scanning. Give it something to scan."
  },
  {
    name: "The Deep Diver", icon: "🌊", color: "#06d6a0",
    sound: "Heavy Rain",
    tip: "You hyperfocus hard. Block time in 90-minute sprints, use rain sounds, reward yourself after. When you lock in, you go far — protect that state."
  },
  {
    name: "The Beat Rider", icon: "🎵", color: "#7c3aed",
    sound: "Lo-fi Beats",
    tip: "Rhythm regulates you. Lo-fi or instrumental playlists help your brain settle into flow. You don't need silence — you need the right soundtrack."
  },
  {
    name: "The Social Spark", icon: "⚡", color: "#ffd166",
    sound: "Coffee Shop",
    tip: "You need ambient human energy. Study in spaces where life is happening around you. Isolation kills your focus — proximity to people fuels it."
  }
];

let step = 0;
let answers = [];

function initQuiz() {
  if (!document.getElementById('quiz-container')) return;
  renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[step];
  document.getElementById('quiz-label').textContent = `FIND YOUR FLOW — QUESTION ${step + 1} OF ${QUESTIONS.length}`;
  document.getElementById('quiz-question').textContent = q.q;
  document.getElementById('progress-fill').style.width = `${(step / QUESTIONS.length) * 100}%`;

  const opts = document.getElementById('quiz-options');
  opts.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.innerHTML = `<span class="opt-letter">${String.fromCharCode(65 + i)}.</span>${opt}`;
    btn.addEventListener('click', () => pickAnswer(i));
    opts.appendChild(btn);
  });
}

function pickAnswer(i) {
  answers.push(i);
  if (step < QUESTIONS.length - 1) {
    step++;
    renderQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  const score = answers.reduce((a, b) => a + b, 0);
  const profile = PROFILES[score % PROFILES.length];

  document.getElementById('quiz-container').classList.add('hidden');
  const resultEl = document.getElementById('quiz-result');
  resultEl.classList.remove('hidden');

  document.getElementById('result-icon').textContent = profile.icon;
  document.getElementById('quiz-label').textContent = 'YOUR FLOW PROFILE';
  document.getElementById('result-name').textContent = profile.name;
  document.getElementById('result-name').style.color = profile.color;
  document.getElementById('result-tip').textContent = profile.tip;
  document.getElementById('result-sound').textContent = `🎵 Ideal sound: ${profile.sound}`;
  document.getElementById('result-sound').style.color = profile.color;

  const card = document.getElementById('result-card');
  card.style.background = `linear-gradient(135deg, ${profile.color}22, #12121a)`;
  card.style.borderColor = `${profile.color}55`;

  // Save quiz result to the backend
  fetch('save_quiz.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile_name: profile.name,
      profile_icon: profile.icon,
      sound: profile.sound,
      score: score
    })
  }).then(res => res.json())
    .then(data => {
      if (!data.success) {
        console.warn('Quiz save failed:', data.message);
      }
    })
    .catch(err => console.warn('Quiz save error:', err));

  document.getElementById('retake-btn').addEventListener('click', () => {
    step = 0; answers = [];
    resultEl.classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    renderQuestion();
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSoundSelector();
  initSuperpowerCards();
  initResourceFilter();
  initLikeButtons();
  initUploadToggle();
  initQuiz();
});
