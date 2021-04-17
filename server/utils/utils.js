/**
 * Utility function to generate random strings of given length
 * @param {number} length 
 */
const generateRandomString = (length = 12) => {
    // Declare all characters
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Pick characers randomly
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    if (str === "meet-stranger") {
        generateRandomString(length);
    } else {
        return str;
    }
};

/**
 * 
 * @param {number} duration // in milliseconds 
 */
 function delay(duration) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), duration);
    });
};

exports.generateRandomString = generateRandomString;
exports.delay = delay;