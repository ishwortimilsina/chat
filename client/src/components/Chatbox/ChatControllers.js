import { useContext, useState } from "react";
import { connect } from 'react-redux';
import { AppContext } from "../../contexts/AppContext";
import { sendMessage } from "../../store/actions";
import { SendMessage } from "../common/icons/SendMessage";

function ChatControllers(props) {
    const [text, setText] = useState('');
    const cred = useContext(AppContext);

    const onSendClick = (e) => {
        e.preventDefault();
        if (props.selectedContact && text) {
            props.sendMessage({
                recipient: props.selectedContact,
                text,
                sender: cred.userId
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
                    <SendMessage
                        type="submit"
                        className="sendButton"
                        onClick={onSendClick}
                        disabled={!props.selectedContact}
                    />
                ) : null
            }
        </form>
    ) : null;
}

export default connect(null, { sendMessage })(ChatControllers);