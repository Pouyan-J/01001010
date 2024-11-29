"use strict";

const dec_chars = ['A', 'a', 'T', 't', 'X', 'x', 'δ', 'τ', 'W', 'w', '*', '↊'];
const elf_chars = ['B', 'b', 'E', 'e', 'Z', 'z', 'ε', '∂', '#', '↋'];

const dec = 'A';
const elf = 'B';

function decimalToDuodecimal(num) {
    if (isNaN(num)) return null;

    let isNegative = num < 0;
    num = Math.abs(num);

    // Handling real numbers
    let integerPart = Math.floor(num);
    let fractionPart = num - integerPart;

    let result = '';

    // Convert integer part
    while (integerPart > 0) {
        let remainder = integerPart % 12;
        if (remainder === 10) {
            result = dec + result;
        } else if (remainder === 11) {
            result = elf + result;
        } else {
            result = remainder.toString() + result;
        }
        integerPart = Math.floor(integerPart / 12);
    }

    if (result === '') result = '0';

    // Convert fraction part
    if (fractionPart > 0) {
        result += '.';
        let fractionLength = 0;
        while (fractionPart > 0 && fractionLength < 16) {
            fractionPart *= 12;
            let fractionDigit = Math.floor(fractionPart);
            if (fractionDigit === 10) {
                result += dec;
            } else if (fractionDigit === 11) {
                result += elf;
            } else {
                result += fractionDigit.toString();
            }
            fractionPart -= fractionDigit;
            fractionLength++;
        }
    }

    return isNegative ? '-' + result : result;
}

function duodecimalToDecimal(duodecimalStr) {
    if (typeof duodecimalStr !== 'string') return null;

    let isNegative = duodecimalStr.startsWith('-');
    if (isNegative) duodecimalStr = duodecimalStr.slice(1);

    let [integerPart, fractionPart] = duodecimalStr.split('.');
    let result = 0;

    // Convert integer part
    for (let i = 0; i < integerPart.length; i++) {
        let char = integerPart[i];
        let value;
        if (dec_chars.includes(char)) {
            value = 10;
        } else if (elf_chars.includes(char)) {
            value = 11;
        } else {
            value = parseInt(char, 12);
        }
        result = result * 12 + value;
    }

    // Convert fraction part
    if (fractionPart) {
        let fractionalResult = 0;
        for (let i = fractionPart.length - 1; i >= 0; i--) {
            let char = fractionPart[i];
            let value;
            if (dec_chars.includes(char)) {
                value = 10;
            } else if (elf_chars.includes(char)) {
                value = 11;
            } else {
                value = parseInt(char, 12);
            }
            fractionalResult = (fractionalResult + value) / 12;
        }
        result += fractionalResult;
    }

    return isNegative ? -result : result;
}