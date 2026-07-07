/* ================================================================
   MouseTest — улучшенное тестирование мыши
   Зависит от глобальных `I18n`, `Theme`, `Router`.
   Публикует глобальный объект `MouseTest`.
   ================================================================ */
window.MouseTest = (() => {
    const BUTTONS = [
        { id: 0, name: "LMB", color: "var(--accent)" },
        { id: 1, name: "MMB", color: "var(--accent2)" },
        { id: 2, name: "RMB", color: "var(--warn)" },
        { id: 3, name: "Back", color: "var(--violet)" },
        { id: 4, name: "Forward", color: "var(--pink)" },
    ];
    let threshold = 100;
    const state = {};
    const els = {};
    let scrollAcc = 0;
    let clickTimestamps = []; // для CPS
    let points = []; // трекер движения
    let canvas, ctx;

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
        clickTimestamps = [];
        points = [];
        els.scrollTotal.innerText = "0";
        els.cpsVal.innerText = "0.0";
        els.logList.innerHTML = "";
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

    function onDown(e) {
        if (e.target.closest(".controls-bar") || e.target.closest("header"))
            return;
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

        // CPS: клики за последнюю секунду
        clickTimestamps.push(now);
        clickTimestamps = clickTimestamps.filter((t) => now - t <= 1000);
        els.cpsVal.innerText = clickTimestamps.length.toFixed(1);

        document.getElementById(`cnt-${id}`).innerText = s.count;
        document.getElementById(`dbl-${id}`).innerText = s.dbl;
        if (s.minGap !== Infinity)
            document.getElementById(`gap-${id}`).innerText =
                `${Math.round(s.minGap)}/${Math.round(s.maxGap)}`;

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
        entry.innerHTML = `[${id}] ${isDouble ? "DOUBLE! " : "Click "}<span style="float:right">${isDouble ? Math.round(gap) + "ms" : ""}</span>`;
        els.logList.prepend(entry);
        while (els.logList.childNodes.length > 40)
            els.logList.lastChild.remove();

        if (e.target.closest("#clickZone")) spawnRipple(e, isDouble);
    }

    function onUp(e) {
        const id = e.button;
        if (state[id]) {
            const svg = document.getElementById("btn" + id);
            if (svg) svg.style.fill = "var(--border)";
            document.getElementById("card-" + id)?.classList.remove("active");
        }
    }

    function spawnRipple(e, isDbl) {
        const rect = els.clickZone.getBoundingClientRect();
        const r = document.createElement("div");
        r.className = "click-ripple";
        if (isDbl) r.style.borderColor = "var(--danger)";
        r.style.left = e.clientX - rect.left + "px";
        r.style.top = e.clientY - rect.top + "px";
        els.clickZone.appendChild(r);
        setTimeout(() => r.remove(), 400);
    }

    function onWheel(e) {
        if (Router.current !== "mouse") return;
        scrollAcc += Math.abs(e.deltaY);
        els.scrollTotal.innerText = Math.floor(scrollAcc / 100);
        const down = e.deltaY > 0;
        els.scrollDir.innerText = down ? I18n.t("down") : I18n.t("up");
        els.scrollDir.style.color = down ? "var(--warn)" : "var(--accent)";
        let h = parseFloat(els.scrollFill.style.height);
        h = Math.max(0, Math.min(100, h + (down ? -5 : 5)));
        els.scrollFill.style.height = h + "%";
    }

    function onMove(e) {
        if (Router.current !== "mouse") return;
        const rect = canvas.getBoundingClientRect();
        const now = performance.now();
        const pt = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            t: now,
        };
        points.push(pt);
        if (points.length > 80) points.shift();

        // Корректная скорость: px за реальный Δt (px/s)
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
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    function draw() {
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (points.length >= 2) {
                const accent = Theme.cssVar("--accent") || "#00ffaa";
                const now = performance.now();
                ctx.lineWidth = 2;
                ctx.lineJoin = "round";
                ctx.lineCap = "round";
                for (let i = 1; i < points.length; i++) {
                    const age = now - points[i].t;
                    const alpha = Math.max(0, 1 - age / 1200);
                    if (alpha <= 0) continue;
                    ctx.globalAlpha = alpha;
                    ctx.strokeStyle = accent;
                    ctx.beginPath();
                    ctx.moveTo(points[i - 1].x, points[i - 1].y);
                    ctx.lineTo(points[i].x, points[i].y);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }
        }
        requestAnimationFrame(draw);
    }

    function init() {
        [
            "statsList",
            "logList",
            "scrollFill",
            "scrollTotal",
            "scrollDir",
            "clickZone",
            "cpsVal",
            "trackSpeed",
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
        I18n.onChange(refreshCardLabels);

        resize();
        draw();
    }

    return { init, reset };
})();
