"use strict";

var n2 = function (n) {
    return n < 10.0 && n >= 0.0 ? "0" + n : n;
};

function updateTime() {
    var dt = new Date();
    var metric = dt.getMetric();
    document.getElementById("decimal-hour").innerHTML = metric.hours + ":" + n2(metric.minutes) + ":" + n2(metric.seconds);
}

setInterval(updateTime, 100);