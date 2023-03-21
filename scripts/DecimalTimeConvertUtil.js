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