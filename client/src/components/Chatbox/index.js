import './chatbox.css';
import ChatControllers from './ChatControllers';
import MessageContainer from './MessageContainer';

export default function Chatbox({ selectedContact }) {
    return (
        <section className="chatbox">
            <div className={`chat-initiators-bar${!selectedContact ? ' disable' : ''}`}>
                <div className="chat-initiators">Call</div>
                <div className="chat-initiators">Video</div>
            </div>
            <MessageContainer selectedContact={selectedContact} />
            <ChatControllers selectedContact={selectedContact} />
        </section>
    );
}