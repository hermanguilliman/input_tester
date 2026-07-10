window.CameraTest = (() => {
    const els = {};
    let stream = null, video = null;
    let rafId = null;
    let running = false, gridOn = false;
    let frameCount = 0, fpsStartTime = 0, currentFps = 0;
    let gridCtx = null;

    function reset() {
        stop();
        currentFps = 0;
        els.fps.innerText = "0";
        els.resolution.innerText = "—";
        els.deviceInfo.innerHTML = "";
        if (gridCtx) {
            gridCtx.canvas.width = 0;
            gridCtx.canvas.height = 0;
        }
        log("Reset", "");
    }

    function log(msg, type) {
        var entry = document.createElement("div");
        entry.className = "log-entry" + (type ? " " + type : "");
        var t = new Date();
        var ts = t.toLocaleTimeString("ru", { hour12: false }) + "." + String(t.getMilliseconds()).padStart(3, "0");
        entry.innerHTML = ts + " " + msg;
        els.camLog.prepend(entry);
        while (els.camLog.childNodes.length > 40) els.camLog.lastChild.remove();
    }

    async function start() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            video.srcObject = stream;
            await video.play();

            var track = stream.getVideoTracks()[0];
            var settings = track.getSettings();

            var nameDiv = document.createElement("div");
            nameDiv.className = "mic-device-name";
            nameDiv.textContent = track.label || "Camera";
            var specDiv = document.createElement("div");
            specDiv.className = "mic-device-specs";
            specDiv.textContent = (settings.width || "?") + " \u00D7 " + (settings.height || "?")
                + " \u00B7 " + (settings.frameRate || "?") + " fps";
            els.deviceInfo.append(nameDiv, specDiv);

            els.resolution.innerText = video.videoWidth + "\u00D7" + video.videoHeight;
            els.hint.style.display = "none";

            running = true;
            frameCount = 0;
            fpsStartTime = performance.now();
            updateBtn(true);
            els.statusMsg.textContent = I18n.t("camConnected") || "Connected";
            log("Camera started: " + (track.label || "unknown"), "");
            tick();
        } catch (err) {
            log("Error: " + err.message, "error");
            els.statusMsg.textContent = "Error";
        }
    }

    function stop() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        running = false;
        if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
        if (video) { video.srcObject = null; video.load(); }
        els.hint.style.display = "";
        els.resolution.innerText = "—";
        els.fps.innerText = "0";
        if (gridCtx) {
            gridCtx.clearRect(0, 0, gridCtx.canvas.width, gridCtx.canvas.height);
        }
        updateBtn(false);
        els.statusMsg.textContent = I18n.t("camIdle") || "Idle";
        log("Camera stopped", "");
    }

    function tick() {
        if (!running) return;

        frameCount++;
        var elapsed = (performance.now() - fpsStartTime) / 1000;
        if (elapsed >= 0.5) {
            currentFps = Math.round(frameCount / elapsed);
            els.fps.innerText = currentFps;
            frameCount = 0;
            fpsStartTime = performance.now();
        }

        if (gridOn) drawGrid();

        rafId = requestAnimationFrame(tick);
    }

    function drawGrid() {
        var c = gridCtx.canvas;
        var w = c.width, h = c.height;
        if (!w || !h) return;
        gridCtx.clearRect(0, 0, w, h);
        gridCtx.strokeStyle = "rgba(255,255,255,0.35)";
        gridCtx.lineWidth = 1;

        var x1 = w / 3, x2 = w * 2 / 3;
        var y1 = h / 3, y2 = h * 2 / 3;

        gridCtx.beginPath();
        gridCtx.moveTo(x1, 0); gridCtx.lineTo(x1, h);
        gridCtx.moveTo(x2, 0); gridCtx.lineTo(x2, h);
        gridCtx.moveTo(0, y1); gridCtx.lineTo(w, y1);
        gridCtx.moveTo(0, y2); gridCtx.lineTo(w, y2);
        gridCtx.stroke();

        gridCtx.fillStyle = "rgba(255,255,255,0.25)";
        gridCtx.font = "10px JetBrains Mono";
        gridCtx.textAlign = "center";
        gridCtx.fillText("Rule of thirds", w / 2, 14);
    }

    function resizeGrid() {
        if (!video) return;
        var wrap = els.previewWrap;
        var rect = wrap.getBoundingClientRect();
        if (gridCtx) {
            gridCtx.canvas.width = rect.width;
            gridCtx.canvas.height = rect.height;
            if (gridOn && running) drawGrid();
        }
    }

    function captureScreenshot() {
        if (!running) return;
        var c = document.createElement("canvas");
        c.width = video.videoWidth;
        c.height = video.videoHeight;
        c.getContext("2d").drawImage(video, 0, 0);
        var link = document.createElement("a");
        link.download = "camera-" + Date.now() + ".png";
        link.href = c.toDataURL("image/png");
        link.click();
        log("Screenshot saved (" + c.width + "\u00D7" + c.height + ")", "");
    }

    function updateBtn(on) {
        var icon = els.toggleBtn.querySelector("i");
        var text = els.toggleBtn.querySelector("span");
        if (on) {
            icon.className = "fas fa-stop";
            text.textContent = I18n.t("camStop") || "Stop";
            els.toggleBtn.style.borderColor = "var(--danger)";
            els.toggleBtn.style.color = "var(--danger)";
        } else {
            icon.className = "fas fa-video";
            text.textContent = I18n.t("camStart") || "Start";
            els.toggleBtn.style.borderColor = "";
            els.toggleBtn.style.color = "";
        }
    }

    function init() {
        var idMap = {
            toggleBtn: "camToggleBtn",
            statusMsg: "camStatusMsg",
            fps: "camFps",
            resolution: "camResolution",
            deviceInfo: "camDeviceInfo",
            camLog: "camLog",
            hint: "camHint",
            previewWrap: "camPreviewWrap",
            screenshotBtn: "camScreenshotBtn",
            gridChk: "camGridToggle",
        };
        Object.keys(idMap).forEach(function (k) { els[k] = document.getElementById(idMap[k]); });

        video = document.getElementById("camVideo");
        var gridCanvas = document.getElementById("camGridCanvas");
        gridCtx = gridCanvas.getContext("2d");

        els.toggleBtn.addEventListener("click", function () {
            if (running) stop();
            else start();
        });

        els.screenshotBtn.addEventListener("click", captureScreenshot);

        els.gridChk.addEventListener("change", function () {
            gridOn = els.gridChk.checked;
            if (!gridOn && gridCtx) {
                gridCtx.clearRect(0, 0, gridCtx.canvas.width, gridCtx.canvas.height);
            } else if (gridOn && running) {
                resizeGrid();
            }
            log("Grid " + (gridOn ? "on" : "off"), "");
        });

        window.addEventListener("resize", resizeGrid);

        I18n.onChange(function () {
            if (running) els.statusMsg.textContent = I18n.t("camConnected") || "Connected";
            else els.statusMsg.textContent = I18n.t("camIdle") || "Idle";
            updateBtn(running);
        });

        reset();
    }

    return { init: init, reset: reset };
})();
