import { useEffect, useState } from "react";

function convertToTwoDigits(num) {
    return `${num ? num < 10 ? '0' + num : num : '00'}`
}

function millisecondsToHHMMSS(msDuration) {
    const hh = Math.floor(msDuration / (60 * 60 * 1000));
    const mm = Math.floor((msDuration - (hh * 60 * 60 * 1000)) / (60 * 1000));
    const ss = Math.floor((msDuration - (mm * 60 * 1000)) / 1000);

    return `${hh ? convertToTwoDigits(hh) + ':' : ''}${convertToTwoDigits(mm)}:${convertToTwoDigits(ss)}`;
}

export default function useTimer() {
    const [tickTime, setTickTime] = useState(0);

    useEffect(() => {
        const startTimestamp = Date.now();
        const timeInterval = setInterval(() => {
            setTickTime(Date.now() - startTimestamp);
        }, 1000);

        return () => timeInterval && clearInterval(timeInterval);
    }, []);

    return {
        msDuration: tickTime,
        durationString: millisecondsToHHMMSS(tickTime)
    };
}