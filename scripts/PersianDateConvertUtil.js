"use strict";

function updateDate() {
    let jh = date_formatter(to_persian_date_array(new Date()), 11180);
    document.getElementById("jh-calendar").innerHTML = jh;

    let persian_date = date_formatter(to_persian_date_array(new Date()), 0);
    document.getElementById("persian-calendar").innerHTML = persian_date;

    let gregorian_date = new Date();
    document.getElementById("gregorian-calendar").innerHTML = date_formatter(gregorian_date.toLocaleDateString("en-GB").split("/").reverse());
}

updateDate()
setInterval(updateDate, 1000);

document.getElementById("date-picker").addEventListener("change", function () {
    let input_date = this.value.split("-");
    let gr_date = date_formatter(input_date);
    let sh_date = date_formatter(to_persian_date_array(input_date));
    let pe_date = date_formatter(to_persian_date_array(input_date), 1180);
    let jh_date = date_formatter(to_persian_date_array(input_date), 11180);
    document.getElementById("convertor").innerHTML = ` = ${sh_date} SH = ${pe_date} PE = ${jh_date} JH`;

    if (document.getElementById("convertor").innerHTML.includes("NaN")) {
        document.getElementById("convertor").innerHTML = ""
    }
});