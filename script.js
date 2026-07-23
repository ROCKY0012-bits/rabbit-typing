(function() {
    'use strict';

    // ─── DOM REFS ────────────────────────────────────────────
    const textDisplay = document.getElementById('textDisplay');
    const hiddenInput = document.getElementById('hiddenInput');
    const timerDisplay = document.getElementById('timerDisplay');
    const timerFill = document.getElementById('timerFill');
    const wpmDisplay = document.getElementById('wpmDisplay');
    const accDisplay = document.getElementById('accDisplay');
    const rawDisplay = document.getElementById('rawDisplay');
    const charCount = document.getElementById('charCount');
    const totalChars = document.getElementById('totalChars');
    const restartBtn = document.getElementById('restartBtn');
    const restartHeader = document.getElementById('restartHeader');
    const soundToggle = document.getElementById('soundToggle');
    const resultsOverlay = document.getElementById('resultsOverlay');
    const resultRetry = document.getElementById('resultRetry');
    const resultClose = document.getElementById('resultClose');
    const startOverlay = document.getElementById('startOverlay');

    const rWpm = document.getElementById('rWpm');
    const rAcc = document.getElementById('rAcc');
    const rRaw = document.getElementById('rRaw');
    const rChars = document.getElementById('rChars');
    const rCorrect = document.getElementById('rCorrect');
    const rIncorrect = document.getElementById('rIncorrect');
    const resultTitle = document.getElementById('resultTitle');
    const resultSub = document.getElementById('resultSub');

    const modeBtns = document.querySelectorAll('[data-mode]');
    const durationBtns = document.querySelectorAll('[data-duration]');
    const wordBtns = document.querySelectorAll('[data-wordCount]');
    const quoteBtns = document.querySelectorAll('[data-quoteLength]');
    const difficultyBtns = document.querySelectorAll('[data-difficulty]');

    const timeOptions = document.getElementById('timeOptions');
    const wordOptions = document.getElementById('wordOptions');
    const quoteOptions = document.getElementById('quoteOptions');

    // ─── STATE ────────────────────────────────────────────────
    const state = {
        mode: 'time',
        duration: 30,
        wordCount: 25,
        quoteLength: 'medium',
        difficulty: 'easy',

        text: '',
        chars: [],
        currentIndex: 0,
        startTime: null,
        endTime: null,
        isActive: false,
        isFinished: false,
        isStarted: false,
        timer: null,
        timeLeft: 0,
        totalTyped: 0,
        correctCount: 0,
        incorrectCount: 0,
        wpm: 0,
        raw: 0,
        accuracy: 100,

        soundEnabled: true,
        audioCtx: null,
    };

    // ─── WORD LISTS ──────────────────────────────────────────
    const WORD_LISTS = {
        easy: [
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
            'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
            'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
            'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
            'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
            'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
            'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
        ],
        hard: [
            'analysis', 'necessary', 'particularly', 'development', 'government',
            'organization', 'experience', 'individual', 'relationship', 'management',
            'responsibility', 'communication', 'opportunity', 'performance', 'understanding',
            'significant', 'environment', 'technology', 'community', 'contribute',
            'establish', 'recognize', 'consider', 'maintain', 'influence',
            'approach', 'capacity', 'challenge', 'creative', 'diverse',
            'effective', 'financial', 'generate', 'identify', 'implement',
            'initiative', 'knowledge', 'leadership', 'objective', 'potential',
            'practical', 'priority', 'quality', 'resource', 'strategy',
            'sustainable', 'transform', 'ultimate', 'valuable', 'widespread'
        ]
    };

    // ─── QUOTES ──────────────────────────────────────────────
    const QUOTES = {
        short: [
            "The only way to do great work is to love what you do.",
            "In the middle of difficulty lies opportunity.",
            "Life is what happens when you're busy making other plans.",
            "Get busy living or get busy dying.",
            "You only live once, but if you do it right, once is enough.",
        ],
        medium: [
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "The future belongs to those who believe in the beauty of their dreams.",
            "It does not matter how slowly you go as long as you do not stop.",
            "The only impossible journey is the one you never begin.",
            "Your time is limited, so don't waste it living someone else's life.",
            "The best way to predict the future is to create it.",
        ],
        long: [
            "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do. So throw off the bowlines. Sail away from the safe harbor. Catch the trade winds in your sails. Explore. Dream. Discover.",
            "It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better. The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood.",
            "The greatest glory in living lies not in never falling, but in rising every time we fall. We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
        ]
    };

    // ─── AUDIO ──────────────────────────────────────────────────
    function getAudioCtx() {
        if (!state.audioCtx) {
            state.audioCtx = new(window.AudioContext || window.webkitAudioContext)();
        }
        return state.audioCtx;
    }

    function playKeySound(freq = 800, duration = 0.025, volume = 0.15) {
        if (!state.soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (_) { /* ignore */ }
    }

    function playCorrectSound() {
        playKeySound(880, 0.02, 0.10);
    }

    function playIncorrectSound() {
        playKeySound(320, 0.06, 0.12);
    }

    function playFinishSound() {
        try {
            const ctx = getAudioCtx();
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
                gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.08);
                osc.stop(ctx.currentTime + i * 0.08 + 0.12);
            });
        } catch (_) {}
    }

    // ─── KEYBOARD LAYOUT ────────────────────────────────────
    const KB_LAYOUT = [
        ['esc', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'],
        ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'backspace'],
        ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
        ['caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'enter'],
        ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift'],
        ['ctrl', 'alt', 'meta', 'space', 'meta', 'alt', 'ctrl']
    ];

    const KB_SPECIAL = new Set(['esc', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
        'backspace', 'tab', 'caps', 'enter', 'shift', 'ctrl', 'alt', 'meta', 'space'
    ]);

    function buildKeyboard() {
        const container = document.getElementById('keyboard');
        if (!container) return;
        container.innerHTML = '';
        KB_LAYOUT.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'kb-row';
            row.forEach(key => {
                const el = document.createElement('div');
                el.className = 'kb-key';
                if (KB_SPECIAL.has(key)) {
                    el.classList.add('special');
                    if (key === 'space') el.classList.add('space');
                }
                el.dataset.key = key;
                el.textContent = key === 'space' ? '' : key;
                if (key === 'backspace') el.textContent = '⌫';
                if (key === 'caps') el.textContent = '⇪';
                if (key === 'enter') el.textContent = '↵';
                if (key === 'shift') el.textContent = '⇧';
                if (key === 'ctrl') el.textContent = '⌃';
                if (key === 'alt') el.textContent = '⌥';
                if (key === 'meta') el.textContent = '⌘';
                if (key === 'tab') el.textContent = '⇥';
                rowDiv.appendChild(el);
            });
            container.appendChild(rowDiv);
        });
    }
    buildKeyboard();

    function getKeyElement(key) {
        const keyLower = key.toLowerCase();
        for (const el of document.querySelectorAll('.kb-key')) {
            if (el.dataset.key === keyLower) return el;
        }
        const specialMap = {
            'backspace': '⌫',
            'caps': '⇪',
            'enter': '↵',
            'shift': '⇧',
            'ctrl': '⌃',
            'alt': '⌥',
            'meta': '⌘',
            'tab': '⇥',
        };
        if (specialMap[keyLower]) {
            for (const el of document.querySelectorAll('.kb-key')) {
                if (el.textContent === specialMap[keyLower]) return el;
            }
        }
        return null;
    }

    function pressKey(key) {
        const el = getKeyElement(key);
        if (el) {
            el.classList.add('pressed');
            setTimeout(() => el.classList.remove('pressed'), 120);
        }
    }

    // ─── TEXT GENERATION ────────────────────────────────────
    function generateWords(count, difficulty) {
        const list = WORD_LISTS[difficulty] || WORD_LISTS.easy;
        const words = [];
        for (let i = 0; i < count; i++) {
            words.push(list[Math.floor(Math.random() * list.length)]);
        }
        return words.join(' ');
    }

    function getQuote(length) {
        const list = QUOTES[length] || QUOTES.medium;
        return list[Math.floor(Math.random() * list.length)];
    }

    function generateText() {
        const mode = state.mode;
        let text = '';
        if (mode === 'time' || mode === 'zen') {
            const count = mode === 'zen' ? 50 : 30;
            text = generateWords(count, state.difficulty);
        } else if (mode === 'words') {
            text = generateWords(state.wordCount, state.difficulty);
        } else if (mode === 'quote') {
            text = getQuote(state.quoteLength);
        }
        return text;
    }

    // ─── RENDER TEXT ────────────────────────────────────────
    function renderText() {
        const container = textDisplay;
        const chars = state.chars;
        // Clear only the text content, keep the overlay
        const existingChars = container.querySelectorAll('.char');
        existingChars.forEach(el => el.remove());

        chars.forEach((ch, idx) => {
            const span = document.createElement('span');
            span.className = 'char';
            if (ch.char === ' ') span.classList.add('space');
            span.dataset.idx = idx;
            span.textContent = ch.char === ' ' ? '\u00A0' : ch.char;

            if (idx < state.currentIndex) {
                if (ch.correct === true) {
                    span.classList.add('correct');
                } else if (ch.correct === false) {
                    span.classList.add('incorrect');
                }
            } else if (idx === state.currentIndex && state.isActive) {
                span.classList.add('current');
                if (ch.correct === false) span.classList.add('incorrect');
            }
            container.appendChild(span);
        });
        updateStats();
        const currentEl = container.querySelector('.char.current');
        if (currentEl) {
            const rect = currentEl.getBoundingClientRect();
            const parentRect = container.getBoundingClientRect();
            if (rect.left > parentRect.right - 40 || rect.left < parentRect.left + 20) {
                currentEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }
    }

    // ─── STATS ──────────────────────────────────────────────
    function updateStats() {
        const total = state.chars.length;
        const typed = state.currentIndex;
        const correct = state.correctCount;
        const incorrect = state.incorrectCount;
        const totalTyped = correct + incorrect;

        charCount.textContent = typed;
        totalChars.textContent = total;

        const acc = totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 100;
        state.accuracy = acc;
        accDisplay.textContent = acc;

        const now = Date.now();
        if (state.startTime && state.correctCount > 0) {
            const elapsed = (now - state.startTime) / 1000 / 60;
            const words = state.correctCount / 5;
            const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
            state.wpm = wpm;
            wpmDisplay.textContent = wpm;
        }

        if (state.startTime && totalTyped > 0) {
            const elapsed = (now - state.startTime) / 1000 / 60;
            const rawWords = totalTyped / 5;
            const raw = elapsed > 0 ? Math.round(rawWords / elapsed) : 0;
            state.raw = raw;
            rawDisplay.textContent = raw;
        }

        if (state.mode === 'time' && state.isStarted) {
            const left = Math.max(0, state.timeLeft);
            timerDisplay.textContent = Math.ceil(left);
            const pct = state.duration > 0 ? (left / state.duration) * 100 : 0;
            timerFill.style.width = pct + '%';
            if (pct < 20) {
                timerFill.className = 'timer-fill danger';
            } else if (pct < 40) {
                timerFill.className = 'timer-fill warning';
            } else {
                timerFill.className = 'timer-fill';
            }
        } else if (state.isStarted) {
            timerDisplay.textContent = '∞';
            timerFill.style.width = '100%';
            timerFill.className = 'timer-fill';
        }
    }

    // ─── TIMER ──────────────────────────────────────────────
    function startTimer() {
        if (state.timer) clearInterval(state.timer);
        state.timeLeft = state.duration;
        state.timer = setInterval(() => {
            if (!state.isActive) return;
            state.timeLeft -= 0.1;
            if (state.timeLeft <= 0) {
                state.timeLeft = 0;
                finishTest();
            }
            updateStats();
        }, 100);
    }

    // ─── FINISH ─────────────────────────────────────────────
    function finishTest() {
        if (state.isFinished) return;
        state.isFinished = true;
        state.isActive = false;
        if (state.timer) clearInterval(state.timer);
        state.endTime = Date.now();
        playFinishSound();
        showResults();
    }

    function showResults() {
        const total = state.correctCount + state.incorrectCount;
        const acc = total > 0 ? Math.round((state.correctCount / total) * 100) : 0;
        const elapsed = state.startTime ? (state.endTime || Date.now()) - state.startTime : 0;
        const minutes = elapsed / 1000 / 60;
        const wpm = minutes > 0 ? Math.round((state.correctCount / 5) / minutes) : 0;
        const raw = minutes > 0 ? Math.round((total / 5) / minutes) : 0;

        rWpm.textContent = wpm;
        rAcc.textContent = acc + '%';
        rRaw.textContent = raw;
        rChars.textContent = total;
        rCorrect.textContent = state.correctCount;
        rIncorrect.textContent = state.incorrectCount;

        const modeName = state.mode.charAt(0).toUpperCase() + state.mode.slice(1);
        resultTitle.textContent = `🏁 ${modeName} Test Complete!`;
        resultSub.textContent = wpm >= 80 ? '⚡ Blazing fast! Amazing work.' :
            wpm >= 50 ? '🔥 Great speed! Keep it up.' :
            wpm >= 30 ? '💪 Solid pace. Practice makes perfect.' :
            '🌱 Keep typing, you\'ll get faster!';

        resultsOverlay.classList.add('visible');
    }

    // ─── START TEST ─────────────────────────────────────────
    function startTest() {
        if (state.isStarted) return;

        state.isStarted = true;
        state.isActive = true;
        state.isFinished = false;
        state.currentIndex = 0;
        state.correctCount = 0;
        state.incorrectCount = 0;
        state.startTime = Date.now();
        state.endTime = null;
        state.wpm = 0;
        state.raw = 0;
        state.accuracy = 100;

        // Hide start overlay
        startOverlay.classList.add('hidden');

        const text = generateText();
        state.text = text;
        state.chars = text.split('').map(ch => ({
            char: ch,
            typed: false,
            correct: null
        }));

        renderText();
        updateStats();

        if (state.mode === 'time') {
            startTimer();
        } else {
            timerDisplay.textContent = '∞';
            timerFill.style.width = '100%';
            timerFill.className = 'timer-fill';
        }

        hiddenInput.focus();
        resultsOverlay.classList.remove('visible');
    }

    // ─── RESET TO IDLE ──────────────────────────────────────
    function resetToIdle() {
        if (state.timer) clearInterval(state.timer);
        state.isActive = false;
        state.isFinished = false;
        state.isStarted = false;
        state.currentIndex = 0;
        state.correctCount = 0;
        state.incorrectCount = 0;
        state.startTime = null;
        state.endTime = null;
        state.wpm = 0;
        state.raw = 0;
        state.accuracy = 100;
        state.timeLeft = state.duration;
        state.chars = [];
        state.text = '';

        // Show start overlay
        startOverlay.classList.remove('hidden');

        // Clear text
        const chars = textDisplay.querySelectorAll('.char');
        chars.forEach(el => el.remove());

        // Reset stats
        timerDisplay.textContent = state.duration;
        timerFill.style.width = '100%';
        timerFill.className = 'timer-fill';
        wpmDisplay.textContent = '0';
        accDisplay.textContent = '100';
        rawDisplay.textContent = '0';
        charCount.textContent = '0';
        totalChars.textContent = '0';

        resultsOverlay.classList.remove('visible');
        hiddenInput.blur();
    }

    // ─── HANDLE INPUT ───────────────────────────────────────
    function handleKeyDown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            return;
        }

        if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
            e.preventDefault();
            resetToIdle();
            return;
        }

        // Start the test with Space or Enter
        if (!state.isStarted) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                startTest();
            }
            return;
        }

        if (state.isFinished) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                resetToIdle();
            }
            return;
        }

        if (!state.isActive) return;

        const key = e.key;

        if (key === 'Backspace') {
            e.preventDefault();
            if (state.currentIndex > 0) {
                state.currentIndex--;
                const ch = state.chars[state.currentIndex];
                ch.typed = false;
                if (ch.correct === true) {
                    state.correctCount--;
                } else if (ch.correct === false) {
                    state.incorrectCount--;
                }
                ch.correct = null;
                pressKey('backspace');
                renderText();
                updateStats();
            }
            return;
        }

        if (key.length !== 1) return;
        e.preventDefault();

        const expected = state.chars[state.currentIndex];
        if (!expected) {
            if (state.mode !== 'zen') {
                finishTest();
            } else {
                const more = generateWords(20, state.difficulty);
                const newChars = more.split('').map(ch => ({ char: ch, typed: false, correct: null }));
                state.chars.push(...newChars);
                state.text += more;
                renderText();
                const ev = new KeyboardEvent('keydown', { key });
                document.dispatchEvent(ev);
            }
            return;
        }

        const isCorrect = key === expected.char;
        expected.typed = true;
        expected.correct = isCorrect;

        if (isCorrect) {
            state.correctCount++;
            playCorrectSound();
            pressKey(key);
        } else {
            state.incorrectCount++;
            playIncorrectSound();
            pressKey(key);
        }

        state.currentIndex++;

        if (state.currentIndex >= state.chars.length) {
            if (state.mode !== 'zen') {
                finishTest();
            } else {
                const more = generateWords(15, state.difficulty);
                const newChars = more.split('').map(ch => ({ char: ch, typed: false, correct: null }));
                state.chars.push(...newChars);
                state.text += more;
                renderText();
            }
        }

        renderText();
        updateStats();

        if (state.mode === 'words' || state.mode === 'quote') {
            if (state.currentIndex >= state.chars.length) {
                finishTest();
            }
        }
    }

    // ─── MODE SWITCHING ─────────────────────────────────────
    function setMode(mode) {
        state.mode = mode;
        modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        timeOptions.style.display = mode === 'time' ? 'flex' : 'none';
        wordOptions.style.display = mode === 'words' ? 'flex' : 'none';
        quoteOptions.style.display = mode === 'quote' ? 'flex' : 'none';

        if (mode === 'time') {
            timerDisplay.textContent = state.duration;
        } else {
            timerDisplay.textContent = '∞';
            timerFill.style.width = '100%';
            timerFill.className = 'timer-fill';
        }

        resetToIdle();
    }

    function setDuration(dur) {
        state.duration = parseInt(dur);
        durationBtns.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.duration) === state.duration);
        });
        if (state.mode === 'time') {
            timerDisplay.textContent = state.duration;
            resetToIdle();
        }
    }

    function setWordCount(count) {
        state.wordCount = parseInt(count);
        wordBtns.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.wordCount) === state.wordCount);
        });
        if (state.mode === 'words') resetToIdle();
    }

    function setQuoteLength(len) {
        state.quoteLength = len;
        quoteBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.quoteLength === len);
        });
        if (state.mode === 'quote') resetToIdle();
    }

    function setDifficulty(diff) {
        state.difficulty = diff;
        difficultyBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === diff);
        });
        resetToIdle();
    }

    // ─── SOUND TOGGLE ──────────────────────────────────────
    function toggleSound() {
        state.soundEnabled = !state.soundEnabled;
        soundToggle.innerHTML = state.soundEnabled ?
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg><span>Sound</span>` :
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg><span>Muted</span>`;
    }

    // ─── INIT ──────────────────────────────────────────────
    function init() {
        document.addEventListener('keydown', handleKeyDown);
        hiddenInput.addEventListener('blur', () => {
            if (state.isStarted) {
                setTimeout(() => hiddenInput.focus(), 10);
            }
        });

        // Click on text display focuses input
        textDisplay.addEventListener('click', () => {
            if (state.isStarted) {
                hiddenInput.focus();
            }
        });

        // Restart
        restartBtn.addEventListener('click', resetToIdle);
        restartHeader.addEventListener('click', resetToIdle);
        soundToggle.addEventListener('click', toggleSound);

        // Results
        resultRetry.addEventListener('click', () => {
            resultsOverlay.classList.remove('visible');
            resetToIdle();
        });
        resultClose.addEventListener('click', () => {
            resultsOverlay.classList.remove('visible');
        });

        // Mode buttons
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => setMode(btn.dataset.mode));
        });
        durationBtns.forEach(btn => {
            btn.addEventListener('click', () => setDuration(btn.dataset.duration));
        });
        wordBtns.forEach(btn => {
            btn.addEventListener('click', () => setWordCount(btn.dataset.wordCount));
        });
        quoteBtns.forEach(btn => {
            btn.addEventListener('click', () => setQuoteLength(btn.dataset.quoteLength));
        });
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty));
        });

        // Initial state
        setMode('time');
        setDuration(30);
        setDifficulty('easy');

        console.log('⌨️ Keythm ready — press Space or Enter to start!');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    setMode('time');
    setDuration(30);
    setDifficulty('easy');

    console.log('🐇 Rabbit ready — press Space or Enter to start!');
})();