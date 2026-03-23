// sidepanel.js — StudyBuddy logic

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let currentMode = 'notes';
let cards = [];
let cardIndex = 0;
let scoreKnow = 0;
let scoreDontKnow = 0;
let cardFlipped = false;

// ─────────────────────────────────────────────
// DOM refs
// ─────────────────────────────────────────────
const $ = id => document.getElementById(id);

const settingsBtn     = $('settings-btn');
const settingsPanel   = $('settings-panel');
const apiKeyInput     = $('api-key-input');
const modelSelect     = $('model-select');
const saveSettingsBtn = $('save-settings-btn');
const savedBadge      = $('saved-badge');
const nokeyBanner     = $('nokey-banner');

const modeTabs        = document.querySelectorAll('.mode-tab');
const notesMode       = $('notes-mode');
const flashcardsMode  = $('flashcards-mode');

// Notes
const notesTopic      = $('notes-topic');
const notesDepth      = $('notes-depth');
const generateNotesBtn= $('generate-notes-btn');
const notesLoader     = $('notes-loader');
const notesError      = $('notes-error');
const notesOutput     = $('notes-output');
const notesBody       = $('notes-body');
const copyNotesBtn    = $('copy-notes-btn');

// Flashcards
const fcTopic         = $('fc-topic');
const fcCount         = $('fc-count');
const generateFcBtn   = $('generate-fc-btn');
const fcLoader        = $('fc-loader');
const fcError         = $('fc-error');
const flashcardArea   = $('flashcard-area');
const flashcard       = $('flashcard');
const fcQuestion      = $('fc-question');
const fcAnswer        = $('fc-answer');
const fcCounter       = $('fc-counter');
const fcScoreDisplay  = $('fc-score-display');
const fcProgressFill  = $('fc-progress-fill');
const fcKnowBtn       = $('fc-know-btn');
const fcDontknowBtn   = $('fc-dontknow-btn');
const fcRestartBtn    = $('fc-restart-btn');
const fcSummary       = $('fc-summary');
const fcSummaryScore  = $('fc-summary-score');
const fcSummaryMsg    = $('fc-summary-msg');
const fcRetryBtn      = $('fc-retry-btn');

// ─────────────────────────────────────────────
// Init — load saved settings
// ─────────────────────────────────────────────
chrome.storage.local.get(['groqApiKey', 'groqModel'], (data) => {
  if (data.groqApiKey) {
    apiKeyInput.value = data.groqApiKey;
  } else {
    nokeyBanner.classList.add('visible');
  }
  if (data.groqModel) {
    modelSelect.value = data.groqModel;
  }
});

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────
settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.toggle('open');
});

saveSettingsBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  const model = modelSelect.value;
  chrome.storage.local.set({ groqApiKey: key, groqModel: model }, () => {
    savedBadge.classList.add('show');
    setTimeout(() => savedBadge.classList.remove('show'), 2000);
    if (key) {
      nokeyBanner.classList.remove('visible');
    } else {
      nokeyBanner.classList.add('visible');
    }
    settingsPanel.classList.remove('open');
  });
});

// ─────────────────────────────────────────────
// Mode switching
// ─────────────────────────────────────────────
modeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    modeTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentMode = tab.dataset.mode;
    if (currentMode === 'notes') {
      notesMode.style.display = 'flex';
      notesMode.style.flexDirection = 'column';
      notesMode.style.gap = '12px';
      flashcardsMode.style.display = 'none';
    } else {
      notesMode.style.display = 'none';
      flashcardsMode.style.display = 'flex';
      flashcardsMode.style.flexDirection = 'column';
    }
  });
});

// ─────────────────────────────────────────────
// Groq API call
// ─────────────────────────────────────────────
async function callGroq(systemPrompt, userPrompt, maxTokens = 2048) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['groqApiKey', 'groqModel'], async (data) => {
      const apiKey = data.groqApiKey;
      const model  = data.groqModel || 'llama-3.3-70b-versatile';

      if (!apiKey) {
        reject(new Error('No API key. Click ⚙️ to add your Groq key.'));
        return;
      }

      try {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content: userPrompt   },
            ],
            max_tokens: maxTokens,
            temperature: 0.4,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err?.error?.message || `API error ${resp.status}`);
        }

        const data2 = await resp.json();
        resolve(data2.choices[0].message.content);
      } catch (e) {
        reject(e);
      }
    });
  });
}

// ─────────────────────────────────────────────
// Markdown → HTML (lightweight)
// ─────────────────────────────────────────────
function mdToHtml(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em>$1</em>')
    .replace(/`(.+?)`/g,      '<code>$1</code>')
    .replace(/^---$/gm,       '<hr/>')
    .replace(/^\* (.+)$/gm,   '<li>$1</li>')
    .replace(/^- (.+)$/gm,    '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[a-z])(.+)$/gm, (m) => m.trim() ? m : '')
    .replace(/<p><\/p>/g, '')
    .replace(/^(.+)$/gm, (line) => {
      if (line.match(/^<(h[1-3]|ul|li|hr|p)/)) return line;
      return line;
    });
}

// ─────────────────────────────────────────────
// NOTES — Generate
// ─────────────────────────────────────────────
const NOTES_SYSTEM = `You are an expert tutor creating study notes for a student.
Format your response in clean Markdown with:
- A clear title (# heading)
- Key Concepts section (## heading) with bullet points
- Detailed Explanation (## heading) with subsections if needed
- Key Takeaways (## heading) with the 3-5 most important points to remember
- A Quick Quiz (## heading) with 2-3 short questions to test understanding (no answers)

Use **bold** for important terms. Keep language clear and student-friendly.`;

generateNotesBtn.addEventListener('click', async () => {
  const topic = notesTopic.value.trim();
  if (!topic) { notesTopic.focus(); return; }

  const depth = notesDepth.value;
  const depthMap = {
    brief: 'Give a brief overview in ~300 words.',
    standard: 'Give a thorough explanation in ~600 words.',
    detailed: 'Give a comprehensive deep-dive in ~1000 words with examples.',
  };

  setNotesLoading(true);
  hideNotesError();
  notesOutput.classList.remove('visible');

  try {
    const result = await callGroq(
      NOTES_SYSTEM,
      `Topic: ${topic}\n\nInstruction: ${depthMap[depth]}`,
      1500
    );
    notesBody.innerHTML = mdToHtml(result);
    notesOutput.classList.add('visible');
  } catch (e) {
    showNotesError(e.message);
  } finally {
    setNotesLoading(false);
  }
});

function setNotesLoading(on) {
  generateNotesBtn.disabled = on;
  notesLoader.classList.toggle('visible', on);
}
function showNotesError(msg) {
  notesError.textContent = msg;
  notesError.classList.add('visible');
}
function hideNotesError() {
  notesError.classList.remove('visible');
}

// Copy notes
copyNotesBtn.addEventListener('click', () => {
  const text = notesBody.innerText;
  navigator.clipboard.writeText(text).then(() => {
    copyNotesBtn.textContent = 'Copied!';
    setTimeout(() => (copyNotesBtn.textContent = 'Copy'), 1500);
  });
});

// ─────────────────────────────────────────────
// FLASHCARDS — Generate
// ─────────────────────────────────────────────
const FC_SYSTEM = `You are a teacher creating flashcards for a student.
Return ONLY a valid JSON array (no explanation, no markdown fences) in this exact format:
[
  {"q": "Question here?", "a": "Answer here."},
  ...
]
Questions should test key concepts. Answers should be concise but complete (1-3 sentences).`;

generateFcBtn.addEventListener('click', async () => {
  const topic = fcTopic.value.trim();
  if (!topic) { fcTopic.focus(); return; }
  const count = parseInt(fcCount.value);

  setFcLoading(true);
  hideFcError();
  flashcardArea.classList.remove('visible');
  fcSummary.classList.remove('visible');

  try {
    const raw = await callGroq(
      FC_SYSTEM,
      `Create exactly ${count} flashcards about: ${topic}`,
      2000
    );

    // Extract JSON array from response
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Could not parse flashcards. Please try again.');
    cards = JSON.parse(match[0]);
    if (!cards.length) throw new Error('No flashcards returned. Try a different topic.');

    startDeck();
  } catch (e) {
    showFcError(e.message);
  } finally {
    setFcLoading(false);
  }
});

function setFcLoading(on) {
  generateFcBtn.disabled = on;
  fcLoader.classList.toggle('visible', on);
}
function showFcError(msg) {
  fcError.textContent = msg;
  fcError.classList.add('visible');
}
function hideFcError() {
  fcError.classList.remove('visible');
}

// ─────────────────────────────────────────────
// FLASHCARDS — Deck logic
// ─────────────────────────────────────────────
function startDeck() {
  cardIndex    = 0;
  scoreKnow    = 0;
  scoreDontKnow = 0;
  cardFlipped  = false;
  flashcardArea.classList.add('visible');
  fcSummary.classList.remove('visible');
  showCard(cardIndex);
}

function showCard(idx) {
  // reset flip
  flashcard.classList.remove('flipped');
  cardFlipped = false;

  const card = cards[idx];
  fcQuestion.textContent = card.q;
  fcAnswer.textContent   = card.a;

  // update progress
  fcCounter.textContent = `Card ${idx + 1} of ${cards.length}`;
  fcScoreDisplay.innerHTML = `✅ ${scoreKnow} &nbsp; ❌ ${scoreDontKnow}`;
  const pct = (idx / cards.length) * 100;
  fcProgressFill.style.width = pct + '%';
}

flashcard.addEventListener('click', () => {
  flashcard.classList.toggle('flipped');
  cardFlipped = !cardFlipped;
});

fcKnowBtn.addEventListener('click', () => {
  scoreKnow++;
  nextCard();
});

fcDontknowBtn.addEventListener('click', () => {
  scoreDontKnow++;
  nextCard();
});

function nextCard() {
  cardIndex++;
  if (cardIndex >= cards.length) {
    showSummary();
  } else {
    showCard(cardIndex);
  }
}

function showSummary() {
  flashcardArea.classList.remove('visible');
  fcSummary.classList.add('visible');
  fcProgressFill.style.width = '100%';

  const total = cards.length;
  const pct   = Math.round((scoreKnow / total) * 100);
  fcSummaryScore.textContent = `${scoreKnow}/${total}`;

  let msg = '';
  if (pct === 100)     msg = '🎉 Perfect score! You nailed it!';
  else if (pct >= 80)  msg = '🌟 Great job! Almost there.';
  else if (pct >= 60)  msg = '📖 Good effort — keep reviewing!';
  else                 msg = '💪 Keep studying — you\'ll get there!';
  fcSummaryMsg.textContent = msg;
}

fcRetryBtn.addEventListener('click', startDeck);
fcRestartBtn.addEventListener('click', startDeck);
