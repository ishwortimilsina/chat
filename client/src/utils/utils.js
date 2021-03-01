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
 * Converts an array buffer to string 
 * @param {ArrayBuffer} buff 
 */
export function arrBuffToStr(buff) {
    try {
        return String.fromCharCode.apply(null, new Uint8Array(buff));
    } catch (err) {
        console.log(err);
        return;
    }
}

/**
 * Converts an string to an array buffer
 * @param {string} str 
 */
export function strToArrBuff(str) {
    try {
        const buff = new ArrayBuffer(str.length);
        const buffView = new Uint8Array(buff);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            buffView[i] = str.charCodeAt(i);
        }
        return buff;
    } catch (err) {
        console.log(err);
        return;
    }
}