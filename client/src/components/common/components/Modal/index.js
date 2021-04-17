import React from 'react';
import { createPortal } from 'react-dom';

import './Modal.css';

const Modal = props => {
    return createPortal(
        <div className="modal-container">
            <div
                className="modal"
                style={{
                    height: props.height,
                    width: props.width,
                    backgroundColor: props.backgroundColor || "#e9eaff"
                }}
            >
                {props.children}
            </div>
        </div>,
        document.getElementById("root")
    );
};

export default Modal;