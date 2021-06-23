import { useContext, useEffect, useState } from "react";
import { connect } from 'react-redux';

import { AppContext } from "../../contexts/AppContext";
import { establishConnection } from "../../store/actions";
import Modal from "../common/components/Modal";
import LoadingIcon from "../common/icons/LoadingIcon";

import './Landing.css';

function LoginForm({ establishConnection }) {
    const { userId, userName } = useContext(AppContext);
    const [name, setName] = useState(userName);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => setName(userName), [userName]);

    const handleSubmit = () => {
        if (name) {
            establishConnection(userId, name);

            setIsSubmitting(true);
            localStorage.setItem('chat-identity', JSON.stringify({ userName: name }));
        }
    };

    return (
        <div className="landing-page">
            <Modal>
                <form className="login-form">
                    <div className="login-form-header">
                        JOIN
                    </div>
                    <div className="login-form-body">
                        <input
                            className="login-input"
                            type="text"
                            value={name || ''}
                            onChange={({ target }) => setName(target.value)}
                            placeholder="Name"
                        />
                        <input
                            className="login-input"
                            type="text"
                            value={userId || ''}
                            onChange={null}
                            placeholder="ID"
                            disabled
                        />
                    </div>
                    <div className="login-form-footer">
                        <div className={`login-submit-button${name ? '' : ' disable'}`} onClick={handleSubmit}>
                            { isSubmitting ? <LoadingIcon style={{ height: 80, width: 80 }} /> : 'Enter' }
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default connect(null, { establishConnection })(LoginForm);