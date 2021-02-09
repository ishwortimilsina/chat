import { connect } from "react-redux";
import EachMessage from "./EachMessage";

function MessageContainer({ messages, selectedContact }) {
    return (
        <div className={`${!messages.length || !selectedContact ? 'empty-' : ''}messages-container`}>
            {
                messages.length || selectedContact
                    ? messages.map(msg => <EachMessage selectedContact={selectedContact} key={msg.msgId} message={msg} />)
                    : <div>This is message container. Select a contact to send a message.</div>
            }
        </div>
    );
}

const mapStateToProps = (state, ownProps) => {
    return {
        messages: state.messages[ownProps.selectedContact] || []
    }
};

export default connect(mapStateToProps)(MessageContainer);