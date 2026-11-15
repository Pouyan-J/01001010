"use strict";

const date_seperator = ".";

function to_persian_date_array(date) {
    let options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }

    return new Date(date)
        .toLocaleDateString("fa-IR", options)
        .replace(/([۰-۹])/g, (token) =>
            String.fromCharCode(token.charCodeAt(0) - 1728))
        .split("/");
}

function date_formatter(date, year_increment = 0) {
    return [parseInt(date[0]) + year_increment, date[1], date[2]].join(date_seperator);
}

// Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to Latin digits
function to_latin_digits(str) {
    return String(str)
        .replace(/[۰-۹]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 1728))
        .replace(/[٠-٩]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 1584));
}

// Reverse of to_persian_date_array: takes a Solar Hijri [year, month, day]
// and returns the matching Date (local noon), or null if the date is invalid.
//
// It estimates the Gregorian date from the Nowruz offset and then checks the
// neighbouring days with to_persian_date_array itself, so the result is always
// consistent with the forward conversion (and impossible dates such as
// 31 Mehr or 30 Esfand in a non-leap year are rejected).
function from_persian_date_array(date) {
    const y = parseInt(date[0], 10);
    const m = parseInt(date[1], 10);
    const d = parseInt(date[2], 10);

    if ([y, m, d].some(isNaN) || y < 1 || m < 1 || m > 12 || d < 1 || d > 31) {
        return null;
    }

    // days since 1 Farvardin: months 1-6 have 31 days, months 7-12 have 30
    const day_offset = (m <= 6 ? (m - 1) * 31 : 186 + (m - 7) * 30) + (d - 1);

    const base = new Date(2000, 0, 1, 12);
    base.setFullYear(y + 621, 2, 21 + day_offset); // 21 March ± a few days

    for (let delta = -4; delta <= 4; delta++) {
        const candidate = new Date(base.getTime());
        candidate.setDate(candidate.getDate() + delta);

        const p = to_persian_date_array(candidate);
        if (parseInt(p[0], 10) === y && parseInt(p[1], 10) === m && parseInt(p[2], 10) === d) {
            return candidate;
        }
    }

    return null;
}
