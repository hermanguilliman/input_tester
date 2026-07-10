window.TouchTest = (() => {
    var els = {};
    var touchCount = 0;
    var maxConcurrent = 0;
    var totalTouches = 0;
    var lastTapTime = 0;
    var lastTouchEnd = null;
    var activeTouches = new Map();
    var startX = 0, startY = 0;
    var canvas, ctx;
    var currentMode = "idle";
    var hapticEnabled = false;
    var drawMode = false;
    var drawPaths = new Map();
    var drawHistory = [];
    var overlay, drawCanvas, drawCtx;

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
        els.lastGesture.innerText = "\u2014";
        els.coordsList.innerHTML = "";
        els.touchLog.innerHTML = "";
        clearDrawings();
    }

    function clearDrawings() {
        drawPaths.clear();
        drawHistory = [];
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (drawCtx) drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    }

    function log(msg, type) {
        var entry = document.createElement("div");
        entry.className = "log-entry" + (type ? " " + type : "");
        var t = new Date();
        var ts = t.toLocaleTimeString("ru", { hour12: false }) + "." + String(t.getMilliseconds()).padStart(3, "0");
        entry.innerHTML = ts + " " + msg;
        els.touchLog.prepend(entry);
        while (els.touchLog.childNodes.length > 40) els.touchLog.lastChild.remove();
    }

    function updateCoords() {
        els.coordsList.innerHTML = "";
        if (activeTouches.size === 0) {
            els.coordsList.innerHTML = '<div class="mini-label" style="padding:8px;text-align:center">\u2014</div>';
            return;
        }
        activeTouches.forEach(function (t, id) {
            var row = document.createElement("div");
            row.className = "touch-coord-row";
            row.innerHTML = '<span class="touch-finger">#' + id + '</span> <span class="touch-xy">' + Math.round(t.x) + ", " + Math.round(t.y) + "</span>";
            els.coordsList.appendChild(row);
        });
    }

    function touchColor(id) {
        var hue = (id * 60) % 360;
        return "hsl(" + hue + ", 100%, 60%)";
    }

    function drawAll(c) {
        if (!c) return;
        var w = c.canvas.width, h = c.canvas.height;
        c.clearRect(0, 0, w, h);

        drawHistory.forEach(function (p) {
            drawPolyline(c, p.points, p.color);
        });
        drawPaths.forEach(function (points, id) {
            if (points.length < 2) return;
            drawPolyline(c, points, touchColor(id));
        });
        drawPaths.forEach(function (points, id) {
            if (points.length === 0) return;
            var p = points[points.length - 1];
            c.beginPath();
            c.arc(p.x, p.y, 4, 0, Math.PI * 2);
            c.fillStyle = touchColor(id);
            c.fill();
        });
    }

    function drawNormalTouches() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawHistory.forEach(function (p) {
            drawPolyline(ctx, p.points, p.color);
        });
        drawPaths.forEach(function (points, id) {
            if (points.length < 2) return;
            drawPolyline(ctx, points, touchColor(id));
        });
        activeTouches.forEach(function (t, id) {
            var color = touchColor(id);
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
            ctx.font = "12px JetBrains Mono, monospace";
            ctx.fillStyle = color;
            ctx.textAlign = "center";
            ctx.fillText("#" + id, t.x, t.y - 38);
        });
    }

    function drawPolyline(c, points, color) {
        if (points.length < 2) return;
        c.beginPath();
        c.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            c.lineTo(points[i].x, points[i].y);
        }
        c.strokeStyle = color;
        c.lineWidth = 4;
        c.lineCap = "round";
        c.lineJoin = "round";
        c.stroke();
    }

    function vibrate() {
        if (hapticEnabled && navigator.vibrate) {
            var ok = navigator.vibrate(40);
            if (els.hapticWarn) els.hapticWarn.style.display = ok ? "none" : "block";
        }
    }

    function testVibration() {
        if (!navigator.vibrate) return false;
        try {
            return navigator.vibrate(1);
        } catch (_) {
            return false;
        }
    }

    function showVibrationWarning() {
        if (testVibration()) {
            els.hapticWarn.style.display = "none";
            return true;
        }
        els.hapticWarn.style.display = "block";
        return false;
    }

    function onTouchStart(e) {
        e.preventDefault();
        vibrate();
        var target = drawMode ? drawCanvas : canvas;
        var rect = target.getBoundingClientRect();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            var id = t.identifier;
            var x = t.clientX - rect.left;
            var y = t.clientY - rect.top;
            activeTouches.set(id, { x: x, y: y, sx: x, sy: y, startTime: performance.now() });

            if (drawMode) {
                if (!drawPaths.has(id)) drawPaths.set(id, []);
                drawPaths.get(id).push({ x: x, y: y });
            }

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
        if (drawMode) drawAll(drawCtx);
        else drawNormalTouches();

        if (!drawMode) {
            var now = performance.now();
            if (lastTouchEnd && now - lastTouchEnd < 300) {
                log("Double tap", "dbl");
                els.lastGesture.innerText = "Double Tap";
            } else {
                log("Touch start (" + e.changedTouches.length + " finger" + (e.changedTouches.length > 1 ? "s" : "") + ")", "");
            }
        }
    }

    function onTouchMove(e) {
        e.preventDefault();
        var target = drawMode ? drawCanvas : canvas;
        var rect = target.getBoundingClientRect();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            var id = t.identifier;
            if (activeTouches.has(id)) {
                var x = t.clientX - rect.left;
                var y = t.clientY - rect.top;
                activeTouches.set(id, {
                    x: x, y: y,
                    sx: activeTouches.get(id).sx,
                    sy: activeTouches.get(id).sy,
                    startTime: activeTouches.get(id).startTime,
                });
                if (drawMode && drawPaths.has(id)) {
                    drawPaths.get(id).push({ x: x, y: y });
                }
            }
        }
        updateCoords();
        if (drawMode) drawAll(drawCtx);
        else drawNormalTouches();

        if (!drawMode && activeTouches.size === 1) {
            var t = activeTouches.values().next().value;
            var dx = t.x - startX;
            var dy = t.y - startY;
            var dist = Math.hypot(dx, dy);
            if (dist > 30) {
                var angle = Math.atan2(dy, dx) * (180 / Math.PI);
                var dir;
                if (angle > -45 && angle <= 45) dir = "Right";
                else if (angle > 45 && angle <= 135) dir = "Down";
                else if (angle > -135 && angle <= -45) dir = "Up";
                else dir = "Left";
                els.lastGesture.innerText = "Swipe " + dir;
            }
        } else if (!drawMode && activeTouches.size === 2) {
            var arr = Array.from(activeTouches.values());
            var d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
            if (d > 50) els.lastGesture.innerText = "Pinch (" + Math.round(d) + "px)";
        }
    }

    function onTouchEnd(e) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            var id = t.identifier;
            if (drawMode && drawPaths.has(id)) {
                drawHistory.push({ points: drawPaths.get(id).slice(), color: touchColor(id) });
                drawPaths.delete(id);
            }
            activeTouches.delete(id);
        }
        touchCount = activeTouches.size;
        els.touchCount.innerText = touchCount;
        if (touchCount === 0 && !drawMode) {
            els.lastGesture.innerText = "\u2014";
        }
        updateCoords();
        if (drawMode) drawAll(drawCtx);
        else drawNormalTouches();
        lastTouchEnd = performance.now();

        if (!drawMode) {
            var wasSingle = e.changedTouches.length === 1 && touchCount === 0;
            if (wasSingle) {
                var now = performance.now();
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
    }

    function onTouchCancel(e) {
        e.preventDefault();
        if (drawMode) drawPaths.clear();
        activeTouches.clear();
        touchCount = 0;
        els.touchCount.innerText = "0";
        updateCoords();
        if (drawMode) drawAll(drawCtx);
        else drawNormalTouches();
        log("Touch cancelled", "");
    }

    function resizeOverlay() {
        if (!drawCanvas) return;
        drawCanvas.width = window.innerWidth;
        drawCanvas.height = window.innerHeight;
        if (drawMode) drawAll(drawCtx);
    }

    function enterDrawMode() {
        drawMode = true;
        drawPaths.clear();
        drawHistory = [];
        overlay.classList.add("active");
        resizeOverlay();
        document.body.style.overflow = "hidden";
        els.lastGesture.innerText = "Draw Mode";
        log("Draw mode on", "");
    }

    function exitDrawMode() {
        drawMode = false;
        activeTouches.clear();
        overlay.classList.remove("active");
        document.body.style.overflow = "";
        els.lastGesture.innerText = "\u2014";
        drawNormalTouches();
        log("Draw mode off", "");
    }

    function resize() {
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        drawNormalTouches();
    }

    function init() {
        var map = {
            touchCount: "touchCount",
            maxConcurrent: "touchMaxConcurrent",
            totalTouches: "touchTotal",
            lastGesture: "touchLastGesture",
            coordsList: "touchCoords",
            touchLog: "touchLog",
            touchArea: "touchArea",
        };
        Object.keys(map).forEach(function (k) { els[k] = document.getElementById(map[k]); });

        canvas = document.getElementById("touchCanvas");
        ctx = canvas.getContext("2d");

        overlay = document.getElementById("drawOverlay");
        drawCanvas = document.getElementById("drawCanvas");
        drawCtx = drawCanvas.getContext("2d");

        els.hapticCheck = document.getElementById("hapticCheck");
        hapticEnabled = els.hapticCheck.checked;
        els.hapticCheck.addEventListener("change", function () {
            hapticEnabled = els.hapticCheck.checked;
            if (hapticEnabled) showVibrationWarning();
            else if (els.hapticWarn) els.hapticWarn.style.display = "none";
        });
        els.hapticWarn = document.getElementById("hapticWarn");

        els.drawModeCheck = document.getElementById("drawModeCheck");
        els.drawModeCheck.addEventListener("change", function () {
            if (els.drawModeCheck.checked) enterDrawMode();
            else exitDrawMode();
        });

        els.clearDrawBtn = document.getElementById("clearDrawBtn");
        els.clearDrawBtn.addEventListener("click", function () {
            clearDrawings();
            log("Drawings cleared", "");
        });

        document.getElementById("drawExitBtn").addEventListener("click", function () {
            els.drawModeCheck.checked = false;
            exitDrawMode();
        });

        els.touchArea.addEventListener("touchstart", onTouchStart, { passive: false });
        els.touchArea.addEventListener("touchmove", onTouchMove, { passive: false });
        els.touchArea.addEventListener("touchend", onTouchEnd, { passive: false });
        els.touchArea.addEventListener("touchcancel", onTouchCancel, { passive: false });

        drawCanvas.addEventListener("touchstart", onTouchStart, { passive: false });
        drawCanvas.addEventListener("touchmove", onTouchMove, { passive: false });
        drawCanvas.addEventListener("touchend", onTouchEnd, { passive: false });
        drawCanvas.addEventListener("touchcancel", onTouchCancel, { passive: false });

        window.addEventListener("resize", function () {
            resize();
            resizeOverlay();
        });
        resize();
        reset();
    }

    return { init: init, reset: reset };
})();
