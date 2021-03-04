import React from 'react';
import { createPortal } from 'react-dom';

import './Modal.css';

const Modal = props => {
    return createPortal(
        <div className="modal-container">
            <div
                className="modal"
                style={{
                    height: props.height || 300,
                    width: props.width || 450,
                    backgroundColor: props.backgroundColor || "#72baac"
                }}
            >
                {props.children}
            </div>
        </div>,
        document.getElementById("root")
    );
};

export default Modal;