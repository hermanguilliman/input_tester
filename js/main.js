(function bootstrap() {
    window.addEventListener("contextmenu", (e) => {
        if (!e.target.closest("header") && !e.target.closest(".controls-bar"))
            e.preventDefault();
    });

    Router.init();

    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isMobile) {
        const tabs = document.querySelector(".tabs");
        const touchTab = tabs.querySelector('[data-tab="touch"]');
        if (touchTab) {
            tabs.insertBefore(touchTab, tabs.firstChild);
            Router.go("touch");
        }
    }
    MouseTest.init();
    KeyboardTest.init();
    GamepadTest.init();
    TouchTest.init();

    document.getElementById("themeBtn").addEventListener("click", Theme.toggle);
    Theme.apply();

    const langSel = document.getElementById("langSelect");
    langSel.value = I18n.current();
    langSel.addEventListener("change", (e) => I18n.set(e.target.value));
    I18n.apply();

    document.getElementById("resetBtn").addEventListener("click", () => {
        if (Router.current === "touch") TouchTest.reset();
        else if (Router.current === "mouse") MouseTest.reset();
        else if (Router.current === "keyboard") KeyboardTest.reset();
        else GamepadTest.reset();
    });
})();
