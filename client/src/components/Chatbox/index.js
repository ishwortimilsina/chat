import './chatbox.css';
import ChatControllers from './ChatControllers';
import MessageContainer from './MessageContainer';

export default function Chatbox({ selectedContact }) {
    return (
        <section className="chatbox">
            <MessageContainer selectedContact={selectedContact} />
            <ChatControllers selectedContact={selectedContact} />
        </section>
    );
}