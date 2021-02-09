import { useState } from "react";
import { connect } from 'react-redux';
import { sendMessage } from "../../store/actions";

function ChatControllers(props) {
    const [text, setText] = useState('');

    const onSendClick = (e) => {
        e.preventDefault();
        if (props.selectedContact && text) {
            const userId = JSON.parse(localStorage.getItem('chat-identity')).id;

            props.sendMessage({
                recipients: [props.selectedContact],
                text,
                sender: userId
            });

            setText('');
        }
    }

    return props.selectedContact ? (
        <form onSubmit={onSendClick} className="chat-controllers">
            <input
                type="text"
                className="chatInput"
                value={text}
                onChange={({ target }) => setText(target.value)}
                disabled={!props.selectedContact}
            />
            {
                text ? (
                    <div
                        type="submit"
                        className="sendButton"
                        onClick={onSendClick}
                        disabled={!props.selectedContact}
                    >Send</div>
                ) : null
            }
        </form>
    ) : null;
}

export default connect(null, { sendMessage })(ChatControllers);