"use strict";

let jh = date_formatter(to_persian_date_array(new Date()), 11180);
document.getElementById("today").innerHTML = jh;

function updateDate() {
    let jh = date_formatter(to_persian_date_array(new Date()), 11180);
    document.getElementById("today").innerHTML = jh;
}

setInterval(updateTime, 1000);