"use strict";

function updateDate() {
    let jh = date_formatter(to_persian_date_array(new Date()), 11180);
    document.getElementById("jh-calendar").innerHTML = jh;

    let pe = date_formatter(to_persian_date_array(new Date()), 1180);
    document.getElementById("pe-calendar").innerHTML = pe;

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

// ── JH date → Gregorian / SH / PE ──
const JH_YEAR_OFFSET = 11180;
const PE_YEAR_OFFSET = 1180;

// Accepts "YYYY.MM.DD" (also separated by "/", "-" or spaces, and Persian digits).
// Returns the formatted result string, or "" if the input is not a valid JH date.
function jhDateToGregorian(str) {
    const match = to_latin_digits(str).trim().match(/^(\d+)\D+(\d{1,2})\D+(\d{1,2})$/);
    if (!match) return "";

    const sh_year = parseInt(match[1], 10) - JH_YEAR_OFFSET;
    const sh_month = String(parseInt(match[2], 10)).padStart(2, "0");
    const sh_day = String(parseInt(match[3], 10)).padStart(2, "0");

    const dt = from_persian_date_array([sh_year, sh_month, sh_day]);
    if (dt === null) return "";

    const gr_date = date_formatter([
        dt.getFullYear(),
        String(dt.getMonth() + 1).padStart(2, "0"),
        String(dt.getDate()).padStart(2, "0"),
    ]);
    const sh_date = date_formatter([sh_year, sh_month, sh_day]);
    const pe_date = date_formatter([sh_year, sh_month, sh_day], PE_YEAR_OFFSET);

    return ` = ${gr_date} CE = ${sh_date} SH = ${pe_date} PE`;
}

document.getElementById("jh-date-input").addEventListener("input", function () {
    document.getElementById("jh-date-convertor").innerHTML = jhDateToGregorian(this.value);
});
