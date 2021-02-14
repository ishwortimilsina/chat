import { useState } from "react";
import Chatbox from "../Chatbox";
import Contacts from "../Contacts";

import './chatContainer.css';

export default function ChatContainer() {
    const [selectedContact, selectContact] = useState();
    return (
        <div className="chat-container">
            <Contacts selectContact={selectContact} selectedContact={selectedContact} />
            <Chatbox selectContact={selectContact} selectedContact={selectedContact} />
        </div>   
    );
}