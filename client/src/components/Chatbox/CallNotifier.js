import React from 'react';
import { createPortal } from 'react-dom';

const CallNotifier = props => {
    return createPortal(
        <div
            className="call-notifier-container"
            onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
            }}
        >
            <div className="call-notifier">
                {props.children}
            </div>
        </div>,
        document.getElementById("root")
    );
};

export default CallNotifier;