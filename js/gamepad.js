window.GamepadTest = (() => {
    const els = {};
    let activeIndex = null;
    let rafId = null;
    let btnEls = [];
    const SECTORS = 36;
    let stickData = {
        L: new Float32Array(SECTORS),
        R: new Float32Array(SECTORS),
    };
    const STD_BUTTONS = [
        "A",
        "B",
        "X",
        "Y",
        "LB",
        "RB",
        "LT",
        "RT",
        "Back",
        "Start",
        "LS",
        "RS",
        "Up",
        "Down",
        "Left",
        "Right",
        "Home",
    ];

    function getPads() {
        return navigator.getGamepads ? navigator.getGamepads() : [];
    }

    function pickActive() {
        const pads = getPads();
        for (let i = 0; i < pads.length; i++) if (pads[i]) return i;
        return null;
    }

    function updateSelector() {
        const pads = getPads();
        const connected = [];
        for (let i = 0; i < pads.length; i++) {
            if (pads[i]) connected.push(pads[i]);
        }
        if (connected.length > 1) {
            els.select.style.display = "";
            els.select.innerHTML = connected
                .map(
                    (p) =>
                        `<option value="${p.index}" ${p.index === activeIndex ? "selected" : ""}>#${p.index}: ${p.id.slice(0, 22)}</option>`,
                )
                .join("");
        } else {
            els.select.style.display = "none";
        }
    }

    function buildButtons(pad) {
        els.buttons.innerHTML = "";
        btnEls = [];
        pad.buttons.forEach((b, i) => {
            const el = document.createElement("div");
            el.className = "gp-btn";
            el.innerHTML = `
        <div class="gp-btn-name">${STD_BUTTONS[i] || "B" + i}</div>
        <div class="gp-btn-val">0.00</div>
        <div class="gp-fill" style="width:0%"></div>`;
            els.buttons.appendChild(el);
            btnEls.push(el);
        });
    }

    function setActive(index) {
        const pad = getPads()[index];
        if (!pad) return;
        activeIndex = index;
        els.empty.style.display = "none";
        els.content.classList.add("active");
        els.id.innerText = pad.id;
        els.meta.innerText = `index: ${pad.index} · buttons: ${pad.buttons.length} · axes: ${pad.axes.length} · mapping: ${pad.mapping || "n/a"}`;
        buildButtons(pad);
        updateSelector();
        reset();
        startLoop();
    }

    function clearActive() {
        activeIndex = null;
        els.content.classList.remove("active");
        els.empty.style.display = "flex";
        els.select.style.display = "none";
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function updateStick(key, dot, labelEl, canvasEl, x, y) {
        dot.style.left = 50 + x * 42 + "%";
        dot.style.top = 50 + y * 42 + "%";

        const mag = Math.hypot(x, y);
        const isDrift = mag > 0.04 && mag < 0.15;
        dot.style.background = isDrift ? "var(--warn)" : "var(--accent)";

        const bins = stickData[key];
        if (mag > 0.3) {
            const angle = Math.atan2(y, x);
            const idx =
                Math.floor(((angle + Math.PI) / (2 * Math.PI)) * SECTORS) %
                SECTORS;
            if (mag > bins[idx]) {
                bins[idx] = Math.min(mag, 1.25);
                drawCircularity(canvasEl, bins);
            }
        }

        let filled = 0;
        let sumErr = 0;
        for (let i = 0; i < SECTORS; i++) {
            if (bins[i] > 0.5) {
                filled++;
                sumErr += Math.abs(1 - bins[i]);
            }
        }
        const errStr =
            filled >= 12
                ? ` · err: ${((sumErr / filled) * 100).toFixed(1)}%`
                : "";
        labelEl.innerText = `${key}: ${x.toFixed(2)}, ${y.toFixed(2)}${errStr}`;
        labelEl.style.color = isDrift ? "var(--warn)" : "var(--muted)";
    }

    function drawCircularity(canvas, bins) {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const maxR = w * 0.42;

        ctx.clearRect(0, 0, w, h);
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < SECTORS; i++) {
            const r = (bins[i] || 0) * maxR;
            const a = (i / SECTORS) * Math.PI * 2 - Math.PI;
            const px = cx + Math.cos(a) * r;
            const py = cy + Math.sin(a) * r;
            if (!started) {
                ctx.moveTo(px, py);
                started = true;
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(74, 158, 92, 0.18)";
        ctx.fill();
        ctx.strokeStyle = "rgba(74, 158, 92, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    function loop() {
        if (activeIndex === null) {
            rafId = null;
            return;
        }
        const pad = getPads()[activeIndex];
        if (pad) {
            pad.buttons.forEach((b, i) => {
                const el = btnEls[i];
                if (!el) return;
                const v = b.value;
                el.classList.toggle("on", b.pressed);
                el.querySelector(".gp-btn-val").innerText = v.toFixed(2);
                el.querySelector(".gp-fill").style.width = v * 100 + "%";
            });
            const ax = pad.axes;
            if (ax.length >= 2) {
                updateStick(
                    "L",
                    els.stickL,
                    els.stickLLabel,
                    els.stickLCanvas,
                    ax[0],
                    ax[1],
                );
            }
            if (ax.length >= 4) {
                updateStick(
                    "R",
                    els.stickR,
                    els.stickRLabel,
                    els.stickRCanvas,
                    ax[2],
                    ax[3],
                );
            }
        } else {
            const next = pickActive();
            if (next === null) {
                clearActive();
                return;
            }
            setActive(next);
        }
        rafId = requestAnimationFrame(loop);
    }

    function startLoop() {
        if (!rafId && activeIndex !== null) {
            rafId = requestAnimationFrame(loop);
        }
    }

    function vibrate() {
        if (activeIndex === null) return;
        const pad = getPads()[activeIndex];
        const act = pad && pad.vibrationActuator;
        if (act && act.playEffect) {
            act.playEffect("dual-rumble", {
                duration: 400,
                strongMagnitude: 1.0,
                weakMagnitude: 1.0,
            });
        }
    }

    function reset() {
        stickData.L.fill(0);
        stickData.R.fill(0);
        if (els.stickLCanvas) {
            els.stickLCanvas
                .getContext("2d")
                .clearRect(
                    0,
                    0,
                    els.stickLCanvas.width,
                    els.stickLCanvas.height,
                );
        }
        if (els.stickRCanvas) {
            els.stickRCanvas
                .getContext("2d")
                .clearRect(
                    0,
                    0,
                    els.stickRCanvas.width,
                    els.stickRCanvas.height,
                );
        }
    }

    function init() {
        const map = {
            empty: "gpEmpty",
            content: "gpContent",
            id: "gpId",
            meta: "gpMeta",
            select: "gpSelect",
            buttons: "gpButtons",
            stickL: "stickL",
            stickR: "stickR",
            stickLLabel: "stickLLabel",
            stickRLabel: "stickRLabel",
            stickLCanvas: "stickLCanvas",
            stickRCanvas: "stickRCanvas",
        };
        Object.keys(map).forEach(
            (k) => (els[k] = document.getElementById(map[k])),
        );
        document
            .getElementById("gpVibrateBtn")
            .addEventListener("click", vibrate);

        els.select.addEventListener("change", (e) => {
            setActive(Number(e.target.value));
        });

        window.addEventListener("gamepadconnected", (e) => {
            updateSelector();
            if (activeIndex === null) setActive(e.gamepad.index);
        });
        window.addEventListener("gamepaddisconnected", (e) => {
            updateSelector();
            if (e.gamepad.index === activeIndex) {
                const next = pickActive();
                if (next === null) clearActive();
                else setActive(next);
            }
        });

        const existing = pickActive();
        if (existing !== null) setActive(existing);
    }

    return { init, reset };
})();
