/* ================================================================
   KeyboardTest — полная раскладка, NKRO, счётчики
   Зависит от глобального `Router`.
   Публикует глобальный объект `KeyboardTest`.
   ================================================================ */
window.KeyboardTest = (() => {
    // Раскладка: массив рядов, каждая клавиша = { code, label, sub?, w? }
    const LAYOUT = [
        [
            { code: "Escape", label: "Esc" },
            { code: "F1", label: "F1" },
            { code: "F2", label: "F2" },
            { code: "F3", label: "F3" },
            { code: "F4", label: "F4" },
            { code: "F5", label: "F5" },
            { code: "F6", label: "F6" },
            { code: "F7", label: "F7" },
            { code: "F8", label: "F8" },
            { code: "F9", label: "F9" },
            { code: "F10", label: "F10" },
            { code: "F11", label: "F11" },
            { code: "F12", label: "F12" },
        ],
        [
            { code: "Backquote", label: "~", sub: "`" },
            { code: "Digit1", label: "1" },
            { code: "Digit2", label: "2" },
            { code: "Digit3", label: "3" },
            { code: "Digit4", label: "4" },
            { code: "Digit5", label: "5" },
            { code: "Digit6", label: "6" },
            { code: "Digit7", label: "7" },
            { code: "Digit8", label: "8" },
            { code: "Digit9", label: "9" },
            { code: "Digit0", label: "0" },
            { code: "Minus", label: "-" },
            { code: "Equal", label: "=" },
            { code: "Backspace", label: "⌫", w: "w-2" },
        ],
        [
            { code: "Tab", label: "Tab", w: "w-15" },
            { code: "KeyQ", label: "Q" },
            { code: "KeyW", label: "W" },
            { code: "KeyE", label: "E" },
            { code: "KeyR", label: "R" },
            { code: "KeyT", label: "T" },
            { code: "KeyY", label: "Y" },
            { code: "KeyU", label: "U" },
            { code: "KeyI", label: "I" },
            { code: "KeyO", label: "O" },
            { code: "KeyP", label: "P" },
            { code: "BracketLeft", label: "[" },
            { code: "BracketRight", label: "]" },
            { code: "Backslash", label: "\\", w: "w-15" },
        ],
        [
            { code: "CapsLock", label: "Caps", w: "w-175" },
            { code: "KeyA", label: "A" },
            { code: "KeyS", label: "S" },
            { code: "KeyD", label: "D" },
            { code: "KeyF", label: "F" },
            { code: "KeyG", label: "G" },
            { code: "KeyH", label: "H" },
            { code: "KeyJ", label: "J" },
            { code: "KeyK", label: "K" },
            { code: "KeyL", label: "L" },
            { code: "Semicolon", label: ";" },
            { code: "Quote", label: "'" },
            { code: "Enter", label: "Enter", w: "w-225" },
        ],
        [
            { code: "ShiftLeft", label: "Shift", w: "w-225" },
            { code: "KeyZ", label: "Z" },
            { code: "KeyX", label: "X" },
            { code: "KeyC", label: "C" },
            { code: "KeyV", label: "V" },
            { code: "KeyB", label: "B" },
            { code: "KeyN", label: "N" },
            { code: "KeyM", label: "M" },
            { code: "Comma", label: "," },
            { code: "Period", label: "." },
            { code: "Slash", label: "/" },
            { code: "ShiftRight", label: "Shift", w: "w-25" },
        ],
        [
            { code: "ControlLeft", label: "Ctrl", w: "w-15" },
            { code: "MetaLeft", label: "Win", w: "w-15" },
            { code: "AltLeft", label: "Alt", w: "w-15" },
            { code: "Space", label: "", w: "w-6" },
            { code: "AltRight", label: "Alt", w: "w-15" },
            { code: "MetaRight", label: "Win", w: "w-15" },
            { code: "ContextMenu", label: "☰", w: "w-15" },
            { code: "ControlRight", label: "Ctrl", w: "w-15" },
        ],
        [
            { code: "ArrowLeft", label: "←" },
            { code: "ArrowUp", label: "↑" },
            { code: "ArrowDown", label: "↓" },
            { code: "ArrowRight", label: "→" },
        ],
    ];

    const counts = {}; // code -> нажатий
    const pressed = new Set();
    let total = 0,
        maxRollover = 0;
    const els = {};
    const keyEls = {}; // code -> элемент

    function build() {
        const kb = document.getElementById("keyboard");
        kb.innerHTML = "";
        LAYOUT.forEach((row) => {
            const rowEl = document.createElement("div");
            rowEl.className = "kbd-row";
            row.forEach((k) => {
                const el = document.createElement("div");
                el.className = "key " + (k.w || "");
                el.dataset.code = k.code;
                el.innerHTML = k.sub
                    ? `<span>${k.label}</span><span class="sub">${k.sub}</span>`
                    : `<span>${k.label || "&nbsp;"}</span>`;
                rowEl.appendChild(el);
                keyEls[k.code] = el;
            });
            kb.appendChild(rowEl);
        });
    }

    function updateStats() {
        els.total.innerText = total;
        els.unique.innerText = Object.keys(counts).length;
        els.rollover.innerText = pressed.size;
        els.maxRollover.innerText = maxRollover;
    }

    function onKeyDown(e) {
        if (Router.current !== "keyboard") return;
        if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT")
            return;
        e.preventDefault();

        const code = e.code || "Key" + e.key.toUpperCase();
        if (!e.repeat) {
            total++;
            counts[code] = (counts[code] || 0) + 1;
            pressed.add(code);
            maxRollover = Math.max(maxRollover, pressed.size);

            const entry = document.createElement("div");
            entry.className = "log-entry";
            entry.innerHTML = `▼ ${code} <span style="float:right;color:var(--muted)">×${counts[code]}</span>`;
            els.log.prepend(entry);
            while (els.log.childNodes.length > 40) els.log.lastChild.remove();
        }

        const el = keyEls[code];
        if (el) el.classList.add("pressed", "tested");

        els.lkKey.innerText = e.key === " " ? "Space" : e.key;
        els.lkCode.innerText = `code: ${code}  ·  keyCode: ${e.keyCode}`;
        updateStats();
    }

    function onKeyUp(e) {
        if (Router.current !== "keyboard") return;
        const code = e.code || "Key" + e.key.toUpperCase();
        pressed.delete(code);
        const el = keyEls[code];
        if (el) el.classList.remove("pressed");
        updateStats();
    }

    function clearStuck() {
        // при потере фокуса снимаем «залипшие» клавиши
        pressed.forEach((code) => {
            const el = keyEls[code];
            if (el) el.classList.remove("pressed");
        });
        pressed.clear();
        updateStats();
    }

    function reset() {
        for (const k in counts) delete counts[k];
        pressed.clear();
        total = 0;
        maxRollover = 0;
        Object.values(keyEls).forEach((el) =>
            el.classList.remove("pressed", "tested"),
        );
        els.lkKey.innerText = "—";
        els.lkCode.innerText = "code: —  ·  keyCode: —";
        els.log.innerHTML = "";
        updateStats();
    }

    function init() {
        els.total = document.getElementById("kbdTotal");
        els.unique = document.getElementById("kbdUnique");
        els.rollover = document.getElementById("kbdRollover");
        els.maxRollover = document.getElementById("kbdMaxRollover");
        els.lkKey = document.getElementById("lkKey");
        els.lkCode = document.getElementById("lkCode");
        els.log = document.getElementById("kbdLog");
        build();
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("blur", clearStuck);
        updateStats();
    }

    return { init, reset };
})();
