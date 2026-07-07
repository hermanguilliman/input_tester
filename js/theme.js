/* ================================================================
   Theme — тёмная/светлая, сохранение в localStorage
   Публикует глобальный объект `Theme`.
   ================================================================ */
window.Theme = (() => {
    const listeners = [];
    let theme = localStorage.getItem("itp-theme") || "dark";

    function apply() {
        document.documentElement.setAttribute("data-theme", theme);
        const icon = document.querySelector("#themeBtn i");
        if (icon)
            icon.className = theme === "dark" ? "fas fa-moon" : "fas fa-sun";
        listeners.forEach((fn) => fn(theme));
    }
    function toggle() {
        theme = theme === "dark" ? "light" : "dark";
        localStorage.setItem("itp-theme", theme);
        apply();
    }
    function onChange(fn) {
        listeners.push(fn);
    }
    function cssVar(name) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim();
    }
    return {
        apply,
        toggle,
        onChange,
        cssVar,
        get current() {
            return theme;
        },
    };
})();
