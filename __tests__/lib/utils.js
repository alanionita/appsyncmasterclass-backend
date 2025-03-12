function fetchDatePattern() {
    const datePattern = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g;
    return datePattern
}

module.exports = {
    fetchDatePattern
}