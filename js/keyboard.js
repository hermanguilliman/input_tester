window.KeyboardTest = (() => {
    const MAIN_CLUSTER = [
        [
            { code: "Escape", label: "Esc", gapBottom: true },
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
            { code: "ShiftRight", label: "Shift", w: "w-275" },
        ],
        [
            { code: "ControlLeft", label: "Ctrl", w: "w-125" },
            { code: "MetaLeft", label: "Win", w: "w-125" },
            { code: "AltLeft", label: "Alt", w: "w-125" },
            { code: "Space", label: "", w: "w-625" },
            { code: "AltRight", label: "Alt", w: "w-125" },
            { code: "MetaRight", label: "Win", w: "w-125" },
            { code: "ContextMenu", label: "☰", w: "w-125" },
            { code: "ControlRight", label: "Ctrl", w: "w-125" },
        ],
    ];

    const NAV_CLUSTER = [
        [
            { code: "PrintScreen", label: "PrtSc", gapBottom: true },
            { code: "ScrollLock", label: "ScrLk" },
            { code: "Pause", label: "Pause" },
        ],
        [
            { code: "Insert", label: "Ins" },
            { code: "Home", label: "Home" },
            { code: "PageUp", label: "PgUp" },
        ],
        [
            { code: "Delete", label: "Del" },
            { code: "End", label: "End" },
            { code: "PageDown", label: "PgDn" },
        ],
        [{ spacer: true }],
        [{ spacer: true }, { code: "ArrowUp", label: "↑" }, { spacer: true }],
        [
            { code: "ArrowLeft", label: "←" },
            { code: "ArrowDown", label: "↓" },
            { code: "ArrowRight", label: "→" },
        ],
    ];

    const NUM_CLUSTER = [
        [
            { spacer: true, gapBottom: true },
            { spacer: true },
            { spacer: true },
            { spacer: true },
        ],
        [
            { code: "NumLock", label: "Num" },
            { code: "NumpadDivide", label: "/" },
            { code: "NumpadMultiply", label: "*" },
            { code: "NumpadSubtract", label: "-" },
        ],
        [
            { code: "Numpad7", label: "7" },
            { code: "Numpad8", label: "8" },
            { code: "Numpad9", label: "9" },
            { code: "NumpadAdd", label: "+" },
        ],
        [
            { code: "Numpad4", label: "4" },
            { code: "Numpad5", label: "5" },
            { code: "Numpad6", label: "6" },
            { code: "NumpadDecimal", label: "." },
        ],
        [
            { code: "Numpad1", label: "1" },
            { code: "Numpad2", label: "2" },
            { code: "Numpad3", label: "3" },
            { code: "NumpadEnter", label: "Ent" },
        ],
        [{ code: "Numpad0", label: "0", w: "w-2" }],
    ];

    const CHATTER_THRESHOLD_MS = 38;
    const counts = {};
    const lastReleaseTime = {};
    const pressed = new Set();
    let total = 0,
        maxRollover = 0,
        chatterCount = 0;
    const els = {};
    const keyEls = {};

    function buildCluster(rows, className) {
        const clusterEl = document.createElement("div");
        clusterEl.className = "kbd-cluster " + className;
        rows.forEach((row) => {
            const rowEl = document.createElement("div");
            rowEl.className =
                "kbd-row" + (row[0]?.gapBottom ? " row-gap-bottom" : "");
            row.forEach((k) => {
                if (k.spacer) {
                    const sp = document.createElement("div");
                    sp.className = "kbd-spacer";
                    rowEl.appendChild(sp);
                    return;
                }
                const el = document.createElement("div");
                el.className = "key " + (k.w || "");
                el.dataset.code = k.code;
                el.innerHTML = k.sub
                    ? `<span>${k.label}</span><span class="sub">${k.sub}</span>`
                    : `<span>${k.label || "&nbsp;"}</span>`;
                rowEl.appendChild(el);
                keyEls[k.code] = el;
            });
            clusterEl.appendChild(rowEl);
        });
        return clusterEl;
    }

    function build() {
        const kb = document.getElementById("keyboard");
        kb.innerHTML = "";
        kb.appendChild(buildCluster(MAIN_CLUSTER, "kbd-cluster-main"));
        kb.appendChild(buildCluster(NAV_CLUSTER, "kbd-cluster-nav"));
        kb.appendChild(buildCluster(NUM_CLUSTER, "kbd-cluster-num"));
    }

    function updateStats() {
        els.total.innerText = total;
        els.unique.innerText = Object.keys(counts).length;
        els.rollover.innerText = pressed.size;
        els.maxRollover.innerText = maxRollover;
        els.chatter.innerText = chatterCount;
        els.chatter.style.color = chatterCount > 0 ? "var(--danger)" : "";
    }

    function onKeyDown(e) {
        if (Router.current !== "keyboard") return;
        if (document.getElementById("hubDialog")?.open) return;
        if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT")
            return;
        e.preventDefault();

        const code = e.code || "Key" + e.key.toUpperCase();
        const el = keyEls[code];

        if (!e.repeat) {
            const now = performance.now();
            const gap = lastReleaseTime[code]
                ? now - lastReleaseTime[code]
                : Infinity;
            const isChatter = gap < CHATTER_THRESHOLD_MS;

            total++;
            counts[code] = (counts[code] || 0) + 1;
            pressed.add(code);
            maxRollover = Math.max(maxRollover, pressed.size);

            if (isChatter) {
                chatterCount++;
                if (el) el.classList.add("chatter");
            }

            const entry = document.createElement("div");
            entry.className = "log-entry" + (isChatter ? " dbl" : "");
            entry.innerHTML = isChatter
                ? `⚠ ${code} CHATTER (${Math.round(gap)}ms) <span style="float:right">×${counts[code]}</span>`
                : `▼ ${code} <span style="float:right;color:var(--muted)">×${counts[code]}</span>`;
            els.log.prepend(entry);
            while (els.log.childNodes.length > 40) els.log.lastChild.remove();
        }

        if (el) el.classList.add("pressed", "tested");

        els.lkKey.innerText = e.key === " " ? "Space" : e.key;
        els.lkCode.innerText = `code: ${code}  ·  keyCode: ${e.keyCode}`;
        updateStats();
    }

    function onKeyUp(e) {
        if (Router.current !== "keyboard") return;
        if (document.getElementById("hubDialog")?.open) return;
        const code = e.code || "Key" + e.key.toUpperCase();
        lastReleaseTime[code] = performance.now();
        pressed.delete(code);
        const el = keyEls[code];
        if (el) el.classList.remove("pressed");
        updateStats();
    }

    function clearStuck() {
        pressed.forEach((code) => {
            const el = keyEls[code];
            if (el) el.classList.remove("pressed");
        });
        pressed.clear();
        updateStats();
    }

    function reset() {
        for (const k in counts) delete counts[k];
        for (const k in lastReleaseTime) delete lastReleaseTime[k];
        pressed.clear();
        total = 0;
        maxRollover = 0;
        chatterCount = 0;
        Object.values(keyEls).forEach((el) =>
            el.classList.remove("pressed", "tested", "chatter"),
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
        els.chatter = document.getElementById("kbdChatter");
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
