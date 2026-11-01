window.MouseTest = (() => {
    const BUTTONS = [
        { id: 0, name: "LMB", color: "var(--fg)" },
        { id: 1, name: "MMB", color: "var(--fg)" },
        { id: 2, name: "RMB", color: "var(--fg)" },
        { id: 3, name: "Back", color: "var(--fg)" },
        { id: 4, name: "Forward", color: "var(--fg)" },
    ];
    let threshold = 65;
    const state = {};
    const els = {};
    let scrollAcc = 0;
    let scrollBounceCount = 0;
    let lastScrollTime = 0;
    let lastScrollDir = 0;
    let clickTimestamps = [];
    let moveTimestamps = [];
    let peakHz = 0;
    let points = [];
    let canvas, ctx;
    let rippleHue = 0;
    let rafId = null;

    function reset() {
        BUTTONS.forEach((b) => {
            state[b.id] = {
                count: 0,
                dbl: 0,
                lastTime: 0,
                minGap: Infinity,
                maxGap: 0,
            };
            const c = document.getElementById(`cnt-${b.id}`);
            if (c) c.innerText = "0";
            const d = document.getElementById(`dbl-${b.id}`);
            if (d) d.innerText = "0";
            const g = document.getElementById(`gap-${b.id}`);
            if (g) g.innerText = "—";
        });
        scrollAcc = 0;
        scrollBounceCount = 0;
        lastScrollTime = 0;
        lastScrollDir = 0;
        clickTimestamps = [];
        moveTimestamps = [];
        peakHz = 0;
        points = [];
        els.scrollTotal.innerText = "0";
        els.scrollBounce.innerText = "0";
        els.scrollBounce.style.color = "var(--fg)";
        els.scrollDir.innerText = I18n.t("idle");
        els.scrollDir.style.color = "var(--accent)";
        els.cpsVal.innerText = "0.0";
        els.trackSpeed.innerText = "0";
        els.mouseHz.innerText = "0 Hz";
        els.logList.innerHTML = "";
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    function initCards() {
        els.statsList.innerHTML = BUTTONS.map(
            (b) => `
      <div class="btn-mini-card" id="card-${b.id}">
        <div class="mini-name" style="color:${b.color}">${b.name}</div>
        <div><div class="mini-label" data-cardlabel="clicks">${I18n.t("clicks")}</div><div class="mini-stat" id="cnt-${b.id}">0</div></div>
        <div><div class="mini-label" data-cardlabel="double">${I18n.t("double")}</div><div class="mini-stat" id="dbl-${b.id}">0</div></div>
        <div><div class="mini-label">min/max</div><div class="mini-stat" id="gap-${b.id}" style="font-size:11px">—</div></div>
      </div>`,
        ).join("");
    }

    function refreshCardLabels() {
        document.querySelectorAll("[data-cardlabel]").forEach((el) => {
            el.innerText = I18n.t(el.dataset.cardlabel);
        });
    }

    function isIgnoredTarget(target) {
        return (
            target.closest(".controls-bar") ||
            target.closest("header") ||
            target.closest("#hubDialog")
        );
    }

    function onDown(e) {
        if (Router.current !== "mouse") return;
        if (isIgnoredTarget(e.target)) return;
        const id = e.button;
        if (state[id] === undefined) return;
        e.preventDefault();

        const now = performance.now();
        const s = state[id];
        const gap = now - s.lastTime;
        const isDouble = s.lastTime !== 0 && gap < threshold;

        s.count++;
        if (isDouble) s.dbl++;
        if (s.lastTime !== 0) {
            s.minGap = Math.min(s.minGap, gap);
            s.maxGap = Math.max(s.maxGap, gap);
        }
        s.lastTime = now;

        clickTimestamps.push(now);
        clickTimestamps = clickTimestamps.filter((t) => now - t <= 1000);
        els.cpsVal.innerText = clickTimestamps.length.toFixed(1);

        document.getElementById(`cnt-${id}`).innerText = s.count;
        document.getElementById(`dbl-${id}`).innerText = s.dbl;
        if (s.minGap !== Infinity) {
            document.getElementById(`gap-${id}`).innerText =
                `${Math.round(s.minGap)}/${Math.round(s.maxGap)}`;
        }

        const card = document.getElementById(`card-${id}`);
        card.classList.add("active");
        if (isDouble) {
            card.classList.add("dbl-err");
            setTimeout(() => card.classList.remove("dbl-err"), 200);
        }

        const svg = document.getElementById("btn" + id);
        if (svg) svg.style.fill = isDouble ? "var(--danger)" : "var(--accent)";

        const entry = document.createElement("div");
        entry.className = `log-entry ${isDouble ? "dbl" : ""}`;
        entry.innerHTML = `[${BUTTONS[id]?.name || id}] ${isDouble ? "DOUBLE! " : "Click "}<span style="float:right">${s.count > 1 ? Math.round(gap) + "ms" : ""}</span>`;
        els.logList.prepend(entry);
        while (els.logList.childNodes.length > 40)
            els.logList.lastChild.remove();

        if (e.target.closest("#clickZone")) spawnRipple(e, isDouble);
    }

    function onUp(e) {
        if (Router.current !== "mouse") return;
        const id = e.button;
        if (state[id]) {
            if (!isIgnoredTarget(e.target)) e.preventDefault();
            const svg = document.getElementById("btn" + id);
            if (svg) svg.style.fill = "var(--border-strong)";
            document.getElementById("card-" + id)?.classList.remove("active");
        }
    }

    function spawnRipple(e, isDbl) {
        const rect = els.clickZone.getBoundingClientRect();
        const r = document.createElement("div");
        r.className = "click-ripple";
        rippleHue = (rippleHue + 47) % 360;
        const color = isDbl ? "var(--danger)" : `hsl(${rippleHue}, 100%, 55%)`;
        r.style.borderColor = color;
        r.style.boxShadow = `0 0 14px ${color}`;
        r.style.left = e.clientX - rect.left + "px";
        r.style.top = e.clientY - rect.top + "px";
        els.clickZone.appendChild(r);
        setTimeout(() => r.remove(), 400);
    }

    function onWheel(e) {
        if (Router.current !== "mouse") return;
        if (e.target.closest("#hubDialog")) return;

        const now = performance.now();
        const down = e.deltaY > 0;
        const dir = down ? 1 : -1;
        const gap = now - lastScrollTime;
        const isBounce =
            lastScrollDir !== 0 && dir !== lastScrollDir && gap < 55;

        lastScrollTime = now;
        lastScrollDir = dir;

        scrollAcc += Math.abs(e.deltaY);
        els.scrollTotal.innerText = Math.floor(scrollAcc / 100);

        if (isBounce) {
            scrollBounceCount++;
            els.scrollBounce.innerText = scrollBounceCount;
            els.scrollBounce.style.color = "var(--danger)";
            const entry = document.createElement("div");
            entry.className = "log-entry dbl";
            entry.innerHTML = `[Scroll] BOUNCE! <span style="float:right">${Math.round(gap)}ms</span>`;
            els.logList.prepend(entry);
            while (els.logList.childNodes.length > 40)
                els.logList.lastChild.remove();
        }

        els.scrollDir.innerText = down ? I18n.t("down") : I18n.t("up");
        els.scrollDir.style.color = isBounce
            ? "var(--danger)"
            : down
              ? "var(--warn)"
              : "var(--accent)";
        let h = parseFloat(els.scrollFill.style.height) || 50;
        h = Math.max(0, Math.min(100, h + (down ? -5 : 5)));
        els.scrollFill.style.height = h + "%";
    }

    function onMove(e) {
        if (Router.current !== "mouse") return;
        const now = performance.now();

        moveTimestamps.push(now);
        while (moveTimestamps.length > 0 && now - moveTimestamps[0] > 500) {
            moveTimestamps.shift();
        }
        if (moveTimestamps.length >= 4) {
            const span = (now - moveTimestamps[0]) / 1000;
            if (span > 0.05) {
                const hz = Math.round((moveTimestamps.length - 1) / span);
                peakHz = Math.max(peakHz, hz);
                els.mouseHz.innerText = `${hz} Hz (max ${peakHz})`;
            }
        }

        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const pt = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            t: now,
        };
        points.push(pt);
        if (points.length > 80) points.shift();

        if (points.length >= 2) {
            const p1 = points[points.length - 1];
            const p0 = points[points.length - 2];
            const dt = (p1.t - p0.t) / 1000;
            if (dt > 0) {
                const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
                els.trackSpeed.innerText = Math.round(dist / dt);
            }
        }
    }

    function resize() {
        if (!canvas || !canvas.offsetWidth) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    function draw() {
        if (Router.current !== "mouse") {
            rafId = null;
            return;
        }
        if (ctx && canvas.width > 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (points.length >= 2) {
                const now = performance.now();
                const baseHue = (now / 16) % 360;
                ctx.lineWidth = 3;
                ctx.lineJoin = "round";
                ctx.lineCap = "round";
                for (let i = 1; i < points.length; i++) {
                    const age = now - points[i].t;
                    const alpha = Math.max(0, 1 - age / 1200);
                    if (alpha <= 0) continue;
                    const hue = (baseHue + i * 6) % 360;
                    const stroke = `hsl(${hue}, 100%, 60%)`;
                    ctx.globalAlpha = alpha;
                    ctx.strokeStyle = stroke;
                    ctx.shadowColor = stroke;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.moveTo(points[i - 1].x, points[i - 1].y);
                    ctx.lineTo(points[i].x, points[i].y);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
            }
        }
        rafId = requestAnimationFrame(draw);
    }

    function startLoop() {
        if (!rafId) rafId = requestAnimationFrame(draw);
    }

    function init() {
        [
            "statsList",
            "logList",
            "scrollFill",
            "scrollTotal",
            "scrollDir",
            "scrollBounce",
            "clickZone",
            "cpsVal",
            "trackSpeed",
            "mouseHz",
        ].forEach((id) => (els[id] = document.getElementById(id)));
        els.thresholdSlider = document.getElementById("thresholdSlider");
        els.thresholdVal = document.getElementById("thresholdVal");
        canvas = document.getElementById("trackerCanvas");
        ctx = canvas.getContext("2d");

        initCards();
        reset();

        els.thresholdSlider.oninput = (e) => {
            threshold = +e.target.value;
            els.thresholdVal.innerText = threshold + "ms";
        };
        window.addEventListener("mousedown", onDown);
        window.addEventListener("mouseup", onUp);
        window.addEventListener("wheel", onWheel, { passive: true });
        window.addEventListener("mousemove", onMove);
        window.addEventListener("resize", resize);
        window.addEventListener("auxclick", (e) => {
            if (
                Router.current === "mouse" &&
                state[e.button] !== undefined &&
                !isIgnoredTarget(e.target)
            ) {
                e.preventDefault();
            }
        });
        I18n.onChange(() => {
            refreshCardLabels();
            if (lastScrollDir === 0) els.scrollDir.innerText = I18n.t("idle");
        });

        Router.onChange((tab) => {
            if (tab === "mouse") {
                resize();
                startLoop();
            }
        });

        resize();
        if (Router.current === "mouse") startLoop();
    }

    return { init, reset };
})();
