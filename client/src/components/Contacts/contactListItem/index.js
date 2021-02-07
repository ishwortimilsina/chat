import './contactListItem.css';

export default function ContactListItem({ item, isSelected, selectContact }) {
    return (
        <div
            className={`contact-list-item${isSelected ? ' contact-selected' : ''}`}
            onClick={() => selectContact(item.id)}
        >
            <img src={item.img} alt={item.name} className="contact-list-item-img" />
            <div className="contact-list-item-details">
                <div className="contact-list-item-name">{item.name}</div>
                <div className="contact-list-item-last-activity">
                    <div className="contact-list-item-last-message">{item.lastMsg}</div>
                    <div className="contact-list-item-last-active">{item.lastActive}</div>
                </div>
            </div>
        </div>
    );
}