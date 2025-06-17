// Ejemplo simple para DNI: solo números y 7-8 dígitos
function isValidDNI(value) {
  return /^\d{7,8}$/.test(value);
}

// Fecha válida y no futura mm/dd/yyyy
function isValidPastDate(value) {
  const date = new Date(value);
  return !isNaN(date) && date <= new Date();
}

module.exports = {
  isValidDNI,
  isValidPastDate
};
