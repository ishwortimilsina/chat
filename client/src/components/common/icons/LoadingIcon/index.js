import { useEffect, useState } from "react";
import useIsMounted from "../../hooks/useIsMounted";
import "./LoadingIcon.css";

export default function LoadingIcon(props) {
    const _isMounted = useIsMounted();
    const rX = 2.5, rY = 2.5;
    const [iconState, setIconState] = useState({
        angle: 0,
        largeArcFl: 0,
        sweepFl: 0,
        x: 10,
        y: 10
    });

    const animate = () => {
        const { angle, sweepFl } = iconState;
        const center = { x: 10, y: 10 };
    
        let newAngle = angle + Math.PI / 180;
        let sF = sweepFl;
        if (newAngle > Math.PI * 2 - Math.PI / 180) {
            newAngle = Math.PI / 180;
            sF = (sweepFl + 1) % 2;
        }
    
        const x = center.x + rX * Math.cos(newAngle);
        const y = center.y + rY * Math.sin(newAngle);

        if (_isMounted) {
            setIconState({
                x,
                y,
                angle: newAngle,
                sweepFl: sF,
                largeArcFl: sF === 0
                    ? (newAngle >= 0 && newAngle < Math.PI) ? 1 : 0
                    : (newAngle >= 0 && newAngle < Math.PI) ? 0 : 1
            });
        }
    };

    useEffect(() => {
        animate();
    }, []);

    useEffect(() => {
        const chase = Math.floor(Math.pow((Math.abs(iconState.newAngle - Math.PI) / Math.PI), 4) * 10) + 5;
        const animateTimeout = setTimeout(animate, chase);
        return () => clearTimeout(animateTimeout);
    });

    const { largeArcFl, sweepFl, x, y } = iconState;
    return (
        <svg className="loading-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d={`M 12.5 10 A ${rX} ${rY} 0 ${largeArcFl} ${sweepFl} ${x} ${y}`}
                stroke="black"
                fillOpacity="0"
                strokeWidth="0.4"
            />
        </svg>
    );
}