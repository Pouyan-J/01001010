function updateDuodecimal() {
    const decimalInput = document.getElementById('decimal-input').value;
    const duodecimalOutput = decimalToDuodecimal(Number(decimalInput));
    document.getElementById('duodecimal-input').value = duodecimalOutput ? duodecimalOutput : '';
}

function updateDecimal() {
    const duodecimalInput = document.getElementById('duodecimal-input').value;
    const decimalOutput = duodecimalToDecimal(duodecimalInput);
    document.getElementById('decimal-input').value = decimalOutput ? decimalOutput : '';
}
