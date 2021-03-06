import { connect } from "react-redux";
import WriteNewIcon from "../common/icons/WriteNewIcon";
import EachMessage from "./EachMessage";

function MessageContainer({ messages, selectedContact }) {
    return (
        <div className={`${!messages.length || !selectedContact ? 'empty-' : ''}messages-container`}>
            {
                messages.length || selectedContact
                    ? messages.map(msg => <EachMessage selectedContact={selectedContact} key={msg.msgId} message={msg} />)
                    : (
                        <>
                            <WriteNewIcon className="no-contact-selected-icon" />
                            <div className="empty-messages-message">Select a contact to start a conversation</div>
                        </>
                    )
            }
        </div>
    );
}

const mapStateToProps = (state, ownProps) => {
    return {
        messages: (state.messages[ownProps.roomId] && state.messages[ownProps.roomId][ownProps.selectedContact]) || []
    }
};

export default connect(mapStateToProps)(MessageContainer);