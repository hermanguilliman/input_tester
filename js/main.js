/* ================================================================
   main.js — точка входа. Загружается последним.
   Инициализирует все модули и связывает шапку (тема/язык/сброс).
   ================================================================ */
(function bootstrap() {
    // блокировка контекстного меню вне управляющих элементов
    window.addEventListener("contextmenu", (e) => {
        if (!e.target.closest("header") && !e.target.closest(".controls-bar"))
            e.preventDefault();
    });

    Router.init();
    MouseTest.init();
    KeyboardTest.init();
    GamepadTest.init();

    // Тема
    document.getElementById("themeBtn").addEventListener("click", Theme.toggle);
    Theme.apply();

    // Язык
    const langSel = document.getElementById("langSelect");
    langSel.value = I18n.current();
    langSel.addEventListener("change", (e) => I18n.set(e.target.value));
    I18n.apply();

    // Общий сброс — сбрасывает активный раздел
    document.getElementById("resetBtn").addEventListener("click", () => {
        if (Router.current === "mouse") MouseTest.reset();
        else if (Router.current === "keyboard") KeyboardTest.reset();
        else GamepadTest.reset();
    });
})();
