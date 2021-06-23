/**
 * 
 * @param {number} duration // in milliseconds 
 */
export function delay(duration) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), duration);
    });
};

/**
 * Utility function to generate random strings of given length
 * @param {number} length 
 */
export const generateRandomString = (length = 12) => {
    // Declare all characters
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Pick characers randomly
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
};