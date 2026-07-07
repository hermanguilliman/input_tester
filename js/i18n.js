window.I18n = (() => {
    const DICT = {
        ru: {
            appTitle: "Guilliman's Input Tester",
            tabMouse: "Мышь",
            tabKeyboard: "Клавиатура",
            tabGamepad: "Геймпад",
            reset: "Сброс",
            dblThreshold: "Порог Double Click:",
            visualization: "Визуализация",
            scroll: "Скролл",
            idle: "Покой",
            clickZoneHint: "Зона тестирования кликов",
            movement: "Движение",
            speed: "Скорость",
            buttonStats: "Статистика кнопок",
            eventLog: "Лог событий",
            clicks: "Клики",
            double: "Дабл",
            hzLabel: "Частота",
            totalPresses: "Всего нажатий",
            uniqueKeys: "Уникальных клавиш",
            rollover: "Одновременно (NKRO)",
            maxRollover: "Максимум одновременно",
            lastKey: "Последняя клавиша",
            gpConnect: "Подключите геймпад",
            gpConnectHint:
                "Нажмите любую кнопку на контроллере, чтобы активировать его",
            vibrate: "Вибрация",
            buttons: "Кнопки",
            sticks: "Стики",
            down: "Вниз",
            up: "Вверх",
        },
        en: {
            appTitle: "Guilliman's Input Tester",
            tabMouse: "Mouse",
            tabKeyboard: "Keyboard",
            tabGamepad: "Gamepad",
            reset: "Reset",
            dblThreshold: "Double Click Threshold:",
            visualization: "Visualization",
            scroll: "Scroll",
            idle: "Idle",
            clickZoneHint: "Click testing area",
            movement: "Movement",
            speed: "Speed",
            buttonStats: "Button Stats",
            eventLog: "Event Log",
            clicks: "Clicks",
            double: "Double",
            hzLabel: "Rate",
            totalPresses: "Total presses",
            uniqueKeys: "Unique keys",
            rollover: "Simultaneous (NKRO)",
            maxRollover: "Max simultaneous",
            lastKey: "Last key",
            gpConnect: "Connect a gamepad",
            gpConnectHint: "Press any button on the controller to activate it",
            vibrate: "Vibrate",
            buttons: "Buttons",
            sticks: "Sticks",
            down: "Down",
            up: "Up",
        },
        zh: {
            appTitle: "Guilliman's Input Tester",
            tabMouse: "鼠标",
            tabKeyboard: "键盘",
            tabGamepad: "手柄",
            reset: "重置",
            dblThreshold: "双击阈值：",
            visualization: "可视化",
            scroll: "滚动",
            idle: "空闲",
            clickZoneHint: "点击测试区域",
            movement: "移动",
            speed: "速度",
            buttonStats: "按键统计",
            eventLog: "事件日志",
            clicks: "点击",
            double: "双击",
            hzLabel: "频率",
            totalPresses: "总按键数",
            uniqueKeys: "独立按键",
            rollover: "同时按下 (NKRO)",
            maxRollover: "最大同时按下",
            lastKey: "最后按键",
            gpConnect: "请连接手柄",
            gpConnectHint: "按下手柄上任意按键以激活",
            vibrate: "震动",
            buttons: "按键",
            sticks: "摇杆",
            down: "向下",
            up: "向上",
        },
    };
    const LANG_NAMES = { ru: "ru", en: "en", zh: "zh" };
    let lang = localStorage.getItem("itp-lang") || "ru";
    if (!DICT[lang]) lang = "ru";

    const listeners = [];
    function t(key) {
        return (DICT[lang] && DICT[lang][key]) || DICT.ru[key] || key;
    }
    function apply() {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            el.innerHTML = t(el.getAttribute("data-i18n"));
        });
        document.documentElement.lang = LANG_NAMES[lang];
        listeners.forEach((fn) => fn());
    }
    function set(l) {
        if (!DICT[l]) return;
        lang = l;
        localStorage.setItem("itp-lang", l);
        apply();
    }
    function onChange(fn) {
        listeners.push(fn);
    }
    function current() {
        return lang;
    }
    return { t, set, apply, onChange, current };
})();
