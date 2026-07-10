window.MicTest = (() => {
    const els = {};
    let stream = null, audioCtx = null, analyser = null, source = null;
    let dataArray = null, rafId = null;
    let running = false, autoMute = true;
    let peakLevel = 0, clipCount = 0, startTime = 0;
    let smoothPct = 0, smoothPeak = 0;

    function reset() {
        stop();
        peakLevel = 0;
        clipCount = 0;
        startTime = 0;
        smoothPct = 0;
        smoothPeak = 0;
        els.peakDb.innerText = "-∞ dB";
        els.currentDb.innerText = "-∞ dB";
        els.clipCount.innerText = "0";
        els.duration.innerText = "0.0s";
        els.meterFill.style.width = "0%";
        els.meterFill.style.background = "linear-gradient(90deg, var(--ok), #6abf40 50%, var(--warn) 75%, var(--danger))";
        els.meterPeak.style.left = "0%";
        els.deviceInfo.innerHTML = "";
        log("Reset", "");
    }

    function log(msg, type) {
        const entry = document.createElement("div");
        entry.className = "log-entry" + (type ? " " + type : "");
        const t = new Date();
        const ts = t.toLocaleTimeString("ru", { hour12: false }) + "." + String(t.getMilliseconds()).padStart(3, "0");
        entry.innerHTML = `${ts} ${msg}`;
        els.micLog.prepend(entry);
        while (els.micLog.childNodes.length > 40) els.micLog.lastChild.remove();
    }

    async function start() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 1024;
            source.connect(analyser);

            if (!autoMute) {
                source.connect(audioCtx.destination);
            }

            dataArray = new Uint8Array(analyser.frequencyBinCount);

            const track = stream.getAudioTracks()[0];
            const settings = track.getSettings();
            const nameDiv = document.createElement("div");
            nameDiv.className = "mic-device-name";
            nameDiv.textContent = track.label || "Microphone";
            const specDiv = document.createElement("div");
            specDiv.className = "mic-device-specs";
            specDiv.textContent = (settings.sampleRate || "?") + " Hz \u00B7 " + (settings.channelCount || "?") + " ch";
            els.deviceInfo.append(nameDiv, specDiv);

            running = true;
            startTime = performance.now();
            updateBtn(true);
            els.statusMsg.textContent = I18n.t("micConnected") || "Connected";
            log("Mic started: " + (track.label || "unknown"), "");
            tick();
        } catch (err) {
            log("Error: " + err.message, "error");
            els.statusMsg.textContent = "Error";
        }
    }

    function stop() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        running = false;
        if (source) { source.disconnect(); source = null; }
        if (audioCtx) { audioCtx.close(); audioCtx = null; }
        if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
        analyser = null;
        dataArray = null;
        updateBtn(false);
        els.statusMsg.textContent = I18n.t("micIdle") || "Idle";
        log("Mic stopped", "");
    }

    function tick() {
        if (!running) return;
        analyser.getByteTimeDomainData(dataArray);

        var max = 0;
        for (var i = 0; i < dataArray.length; i++) {
            var v = Math.abs(dataArray[i] - 128) / 128;
            if (v > max) max = v;
        }

        var rawPct = Math.min(max * 100, 100);
        var alpha = 0.18;
        smoothPct = smoothPct + alpha * (rawPct - smoothPct);
        var pct = Math.min(Math.max(smoothPct, 0), 100);

        if (pct > 90) els.meterFill.style.background = "linear-gradient(90deg, var(--danger), #ff4444)";
        else if (pct > 70) els.meterFill.style.background = "linear-gradient(90deg, var(--warn), #e8c35c 70%, var(--danger))";
        else els.meterFill.style.background = "linear-gradient(90deg, var(--ok), #6abf40 50%, var(--warn) 75%, var(--danger))";

        els.meterFill.style.width = pct + "%";

        var currentDb = smoothPct > 0.05 ? Math.round(20 * Math.log10(smoothPct / 100)) : -Infinity;
        els.currentDb.innerText = currentDb === -Infinity ? "-∞ dB" : currentDb + " dB";

        var peakAlpha = 0.06;
        if (rawPct / 100 > smoothPeak) {
            smoothPeak = rawPct / 100;
        } else {
            smoothPeak = smoothPeak - peakAlpha * (smoothPeak - rawPct / 100);
            if (smoothPeak < 0.001) smoothPeak = 0;
        }
        var peakPct = Math.min(smoothPeak * 100, 100);
        els.meterPeak.style.left = peakPct + "%";

        var peakDbVal = smoothPeak > 0.003 ? Math.round(20 * Math.log10(smoothPeak)) : -Infinity;
        els.peakDb.innerText = peakDbVal === -Infinity ? "-∞ dB" : peakDbVal + " dB";

        if (max >= 0.99) clipCount++;

        var dur = ((performance.now() - startTime) / 1000).toFixed(1);
        els.duration.innerText = dur + "s";
        els.clipCount.innerText = clipCount;

        rafId = requestAnimationFrame(tick);
    }

    function updateBtn(on) {
        var icon = els.toggleBtn.querySelector("i");
        var text = els.toggleBtn.querySelector("span");
        if (on) {
            icon.className = "fas fa-stop";
            text.textContent = I18n.t("micStop") || "Stop";
            els.toggleBtn.style.borderColor = "var(--danger)";
            els.toggleBtn.style.color = "var(--danger)";
        } else {
            icon.className = "fas fa-microphone";
            text.textContent = I18n.t("micStart") || "Start";
            els.toggleBtn.style.borderColor = "";
            els.toggleBtn.style.color = "";
        }
    }

    function init() {
        var idMap = {
            toggleBtn: "micToggleBtn",
            autoMuteChk: "micAutoMute",
            statusMsg: "micStatusMsg",
            meterFill: "micMeterFill",
            meterPeak: "micMeterPeak",
            currentDb: "micCurrentDb",
            peakDb: "micPeakDb",
            clipCount: "micClipCount",
            duration: "micDuration",
            deviceInfo: "micDeviceInfo",
            micLog: "micLog",
        };
        Object.keys(idMap).forEach(function (k) { els[k] = document.getElementById(idMap[k]); });

        els.toggleBtn.addEventListener("click", function () {
            if (running) stop();
            else start();
        });
        els.autoMuteChk.addEventListener("change", function () {
            autoMute = els.autoMuteChk.checked;
            if (running) {
                log("Auto-mute " + (autoMute ? "on" : "off") + " (restart to apply)", "");
            }
        });

        I18n.onChange(function () {
            if (running) els.statusMsg.textContent = I18n.t("micConnected") || "Connected";
            else els.statusMsg.textContent = I18n.t("micIdle") || "Idle";
            updateBtn(running);
        });

        reset();
    }

    return { init: init, reset: reset };
})();
