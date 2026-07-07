/* ================================================================
   Router — переключение вкладок (мышь / клавиатура / геймпад)
   Публикует глобальный объект `Router`.
   ================================================================ */
window.Router = (() => {
    const listeners = [];
    let current = "mouse";

    function go(tab) {
        current = tab;
        document
            .querySelectorAll(".tab")
            .forEach((t) =>
                t.classList.toggle("active", t.dataset.tab === tab),
            );
        document
            .querySelectorAll(".view")
            .forEach((v) =>
                v.classList.toggle("active", v.id === "view-" + tab),
            );
        listeners.forEach((fn) => fn(tab));
    }
    function onChange(fn) {
        listeners.push(fn);
    }
    function init() {
        document
            .querySelectorAll(".tab")
            .forEach((t) =>
                t.addEventListener("click", () => go(t.dataset.tab)),
            );
    }
    return {
        go,
        onChange,
        init,
        get current() {
            return current;
        },
    };
})();
