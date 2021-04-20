import { useEffect } from 'react';
import UserCircleIcon from '../../common/icons/UserCircleIcon';
import './contactListItem.css';

export default function ContactListItem({ item, isSelected, selectContact }) {
    // if this contact is selected, remove it from the selection
    // when it gets removed from the contacts list
    useEffect(() => {
        return () => isSelected && selectContact(null);
    }, [isSelected, selectContact]);

    return (
        <div
            className={`contact-list-item${isSelected ? ' contact-selected' : ''}`}
            onClick={() => selectContact(item.userId)}
        >
            <div className="contact-list-item-img-container">
                <UserCircleIcon className="contact-list-item-img" />
            </div>
            <div className="contact-list-item-details">
                <div className="contact-list-item-name">{item.userName || item.userId}</div>
                <div className="contact-list-item-last-activity">
                    <div className="contact-list-item-last-message">{item.lastMsg || 'No history'}</div>
                    {
                        item.isActive
                            ? <div className="contact-list-item-active"></div>
                            : <div className="contact-list-item-last-active">{item.lastActive}</div>
                    }
                </div>
            </div>
        </div>
    );
}