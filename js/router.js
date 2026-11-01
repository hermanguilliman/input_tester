window.Router = (() => {
    const VALID_TABS = [
        "mouse",
        "keyboard",
        "touch",
        "gamepad",
        "mic",
        "camera",
    ];
    const listeners = [];
    let current = "mouse";
    let hasInitialHash = false;

    function go(tab, updateHash = true) {
        if (!VALID_TABS.includes(tab)) return;
        current = tab;
        document.querySelectorAll(".tab").forEach((t) => {
            const isActive = t.dataset.tab === tab;
            t.classList.toggle("active", isActive);
            t.setAttribute("aria-selected", isActive ? "true" : "false");
        });
        document.querySelectorAll(".view").forEach((v) => {
            v.classList.toggle("active", v.id === "view-" + tab);
        });
        if (updateHash && history.replaceState) {
            history.replaceState(null, "", "#" + tab);
        }
        listeners.forEach((fn) => fn(tab));
    }

    function onChange(fn) {
        listeners.push(fn);
    }

    function init() {
        document.querySelectorAll(".tab").forEach((t) => {
            t.addEventListener("click", () => go(t.dataset.tab));
        });

        const hash = location.hash.replace("#", "").toLowerCase();
        if (VALID_TABS.includes(hash)) {
            hasInitialHash = true;
            go(hash, false);
        }

        window.addEventListener("hashchange", () => {
            const h = location.hash.replace("#", "").toLowerCase();
            if (VALID_TABS.includes(h) && h !== current) {
                go(h, false);
            }
        });
    }

    return {
        go,
        onChange,
        init,
        get current() {
            return current;
        },
        get hasInitialHash() {
            return hasInitialHash;
        },
    };
})();
