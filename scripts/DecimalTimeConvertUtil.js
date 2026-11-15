"use strict";

var n2 = function (n) {
    return n < 10.0 && n >= 0.0 ? "0" + n : n;
};

function updateTime() {
    var dt = new Date();
    var metric = dt.getMetric();
    document.getElementById("decimal-hour").innerHTML = n2(metric.hours) + ":" + n2(metric.minutes) + ":" + n2(metric.seconds);
    document.getElementById("regular-hour").innerHTML = n2(dt.getHours()) + ":" + n2(dt.getMinutes()) + ":" + n2(dt.getSeconds());
}

setInterval(updateTime, 100);

document.getElementById("time-picker").addEventListener("change", function () {
    let input_time = this.value;
    let dt = new Date('1996-01-01T' + input_time)
    let metric_time = dt.getMetric(input_time);

    let fraction_time = "0." + (metric_time.hours) + n2(metric_time.minutes) + n2(metric_time.seconds);
    let percentage_time = `${metric_time.hours}${(n2(metric_time.minutes) + '').slice(0, 1) + '.' + (n2(metric_time.minutes) + '').slice(1)}${n2(metric_time.seconds)}`;

    document.getElementById("time-convertor").innerHTML = `≃ ${fraction_time} = ${percentage_time}% =
        ${[metric_time.hours, n2(metric_time.minutes), n2(metric_time.seconds)].join(':')}`;

    if ((document.getElementById("time-convertor").innerHTML).includes("N") || input_time == '') {
        document.getElementById("time-convertor").innerHTML = ""
    }
});

// ── Decimal time → regular time ──
// Accepts "H", "H:MM" or "H:MM:SS" (seconds may have a fraction), e.g. "5:00:00".
// Hours 0-9, minutes 0-99, seconds 0-99.99…; one day = 10 hours = 1000 minutes = 100000 seconds,
// so 1 decimal second = 0.864 regular seconds.
// Returns "= HH:MM:SS" (with ".mmm" when needed), or "" if the input is not valid decimal time.
function decimalToRegularTime(str) {
    const parts = to_latin_digits(str).trim().split(":").map(p => p.trim());
    if (parts.length < 1 || parts.length > 3) return "";
    if (!parts.every(p => /^\d+(\.\d+)?$/.test(p))) return "";

    const h = Number(parts[0]);
    const m = parts.length > 1 ? Number(parts[1]) : 0;
    const s = parts.length > 2 ? Number(parts[2]) : 0;

    if (!Number.isInteger(h) || h > 9) return "";
    if (!Number.isInteger(m) || m > 99) return "";
    if (s >= 100) return "";

    const DAY_MS = 86400000;
    const decimal_seconds = h * 10000 + m * 100 + s;
    // 1 decimal second = 864 ms
    const total_ms = Math.min(Math.round(decimal_seconds * 864), DAY_MS - 1);

    const hh = Math.floor(total_ms / 3600000);
    const mm = Math.floor(total_ms / 60000) % 60;
    const ss = Math.floor(total_ms / 1000) % 60;
    const ms = total_ms % 1000;

    let result = [n2(hh), n2(mm), n2(ss)].join(":");
    if (ms !== 0) result += "." + String(ms).padStart(3, "0");
    return "≃ " + result;
}

document.getElementById("decimal-time-input").addEventListener("input", function () {
    document.getElementById("decimal-time-convertor").innerHTML = decimalToRegularTime(this.value);
});
