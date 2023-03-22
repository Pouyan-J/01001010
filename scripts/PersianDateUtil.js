"use strict";

function updateDate() {
    let jh = date_formatter(to_persian_date_array(new Date()), 11180);
    document.getElementById("today").innerHTML = jh;
}

updateDate()
setInterval(updateDate, 1000);