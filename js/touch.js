window.TouchTest = (() => {
    const els = {};
    let touchCount = 0;
    let maxConcurrent = 0;
    let totalTouches = 0;
    let lastTapTime = 0;
    let lastTouchEnd = null;
    let activeTouches = new Map();
    let startX = 0, startY = 0;
    let canvas, ctx;
    let currentMode = "idle";

    function reset() {
        touchCount = 0;
        maxConcurrent = 0;
        totalTouches = 0;
        lastTapTime = 0;
        lastTouchEnd = null;
        activeTouches.clear();
        currentMode = "idle";
        els.touchCount.innerText = "0";
        els.maxConcurrent.innerText = "0";
        els.totalTouches.innerText = "0";
        els.lastGesture.innerText = "—";
        els.coordsList.innerHTML = "";
        els.touchLog.innerHTML = "";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function log(msg, type) {
        const entry = document.createElement("div");
        entry.className = "log-entry" + (type ? " " + type : "");
        const t = new Date();
        const ts = t.toLocaleTimeString("ru", { hour12: false }) + "." + String(t.getMilliseconds()).padStart(3, "0");
        entry.innerHTML = `${ts} ${msg}`;
        els.touchLog.prepend(entry);
        while (els.touchLog.childNodes.length > 40) els.touchLog.lastChild.remove();
    }

    function updateCoords() {
        els.coordsList.innerHTML = "";
        if (activeTouches.size === 0) {
            els.coordsList.innerHTML = '<div class="mini-label" style="padding:8px;text-align:center">—</div>';
            return;
        }
        activeTouches.forEach((t, id) => {
            const row = document.createElement("div");
            row.className = "touch-coord-row";
            row.innerHTML = `<span class="touch-finger">#${id}</span> <span class="touch-xy">${Math.round(t.x)}, ${Math.round(t.y)}</span>`;
            els.coordsList.appendChild(row);
        });
    }

    function drawTouches() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        activeTouches.forEach((t, id) => {
            const hue = (id * 60) % 360;
            const color = `hsl(${hue}, 100%, 60%)`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 30, 0, Math.PI * 2);
            ctx.fillStyle = color + "30";
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.font = "12px Space Mono, monospace";
            ctx.fillStyle = color;
            ctx.textAlign = "center";
            ctx.fillText("#" + id, t.x, t.y - 38);
        });
    }

    function onTouchStart(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            const id = t.identifier;
            const x = t.clientX - rect.left;
            const y = t.clientY - rect.top;
            activeTouches.set(id, { x, y, sx: x, sy: y, startTime: performance.now() });

            if (activeTouches.size === 1) {
                startX = x;
                startY = y;
            }
        }
        touchCount = activeTouches.size;
        maxConcurrent = Math.max(maxConcurrent, touchCount);
        totalTouches += e.changedTouches.length;
        els.touchCount.innerText = touchCount;
        els.maxConcurrent.innerText = maxConcurrent;
        els.totalTouches.innerText = totalTouches;
        updateCoords();
        drawTouches();

        const now = performance.now();
        if (lastTouchEnd && now - lastTouchEnd < 300) {
            log("Double tap", "dbl");
            els.lastGesture.innerText = "Double Tap";
        } else {
            log("Touch start (" + e.changedTouches.length + " finger" + (e.changedTouches.length > 1 ? "s" : "") + ")", "");
        }
    }

    function onTouchMove(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            const id = t.identifier;
            if (activeTouches.has(id)) {
                activeTouches.set(id, {
                    x: t.clientX - rect.left,
                    y: t.clientY - rect.top,
                    sx: activeTouches.get(id).sx,
                    sy: activeTouches.get(id).sy,
                    startTime: activeTouches.get(id).startTime,
                });
            }
        }
        updateCoords();
        drawTouches();

        if (activeTouches.size === 1) {
            const t = activeTouches.values().next().value;
            const dx = t.x - startX;
            const dy = t.y - startY;
            const dist = Math.hypot(dx, dy);
            if (dist > 30) {
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                let dir;
                if (angle > -45 && angle <= 45) dir = "Right";
                else if (angle > 45 && angle <= 135) dir = "Down";
                else if (angle > -135 && angle <= -45) dir = "Up";
                else dir = "Left";
                els.lastGesture.innerText = "Swipe " + dir;
            }
        } else if (activeTouches.size === 2) {
            const arr = Array.from(activeTouches.values());
            const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
            if (d > 50) els.lastGesture.innerText = "Pinch (" + Math.round(d) + "px)";
        }
    }

    function onTouchEnd(e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            activeTouches.delete(t.identifier);
        }
        touchCount = activeTouches.size;
        els.touchCount.innerText = touchCount;
        if (touchCount === 0) {
            els.lastGesture.innerText = "—";
        }
        updateCoords();
        drawTouches();
        lastTouchEnd = performance.now();

        const wasSingle = e.changedTouches.length === 1 && touchCount === 0;
        if (wasSingle) {
            const now = performance.now();
            if (lastTapTime && now - lastTapTime < 300) {
                log("Double tap", "dbl");
                els.lastGesture.innerText = "Double Tap";
                lastTapTime = 0;
            } else {
                log("Tap", "");
                els.lastGesture.innerText = "Tap";
                lastTapTime = now;
            }
        } else {
            log("Touch end (" + e.changedTouches.length + ")", "");
        }
    }

    function onTouchCancel(e) {
        e.preventDefault();
        activeTouches.clear();
        touchCount = 0;
        els.touchCount.innerText = "0";
        updateCoords();
        drawTouches();
        log("Touch cancelled", "");
    }

    function resize() {
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        drawTouches();
    }

    function init() {
        const map = {
            touchCount: "touchCount",
            maxConcurrent: "touchMaxConcurrent",
            totalTouches: "touchTotal",
            lastGesture: "touchLastGesture",
            coordsList: "touchCoords",
            touchLog: "touchLog",
            touchArea: "touchArea",
        };
        Object.keys(map).forEach((k) => (els[k] = document.getElementById(map[k])));

        canvas = document.getElementById("touchCanvas");
        ctx = canvas.getContext("2d");

        els.touchArea.addEventListener("touchstart", onTouchStart, { passive: false });
        els.touchArea.addEventListener("touchmove", onTouchMove, { passive: false });
        els.touchArea.addEventListener("touchend", onTouchEnd, { passive: false });
        els.touchArea.addEventListener("touchcancel", onTouchCancel, { passive: false });

        window.addEventListener("resize", resize);
        resize();
        reset();
    }

    return { init, reset };
})();
