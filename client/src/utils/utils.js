/**
 * 
 * @param {number} duration // in milliseconds 
 */
export function delay(duration) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), duration);
    });
};