import { useState } from 'react'; 

import ContactListItem from './contactListItem';
import './contacts.css';

import { connect } from 'react-redux';
import { SearchContacts } from './SearchContacts';
import ArrowLeftIcon from '../common/icons/ArrowLeftIcon';
import UserCircleIcon from '../common/icons/UserCircleIcon';

function Contacts({ contacts, selectedContact, selectContact }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`contacts${isExpanded ? ' expanded': ''}`}>
            <div className="contacts-title">
                <div className="contacts-title-title">
                    <UserCircleIcon className="contacts-title-img" />
                    <div>Chats</div>
                </div>
                <SearchContacts searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>
            <div className="contacts-list">
                {contacts.filter(item => item.userName.includes(searchTerm)).map((item) => <ContactListItem
                    isSelected={selectedContact === item.userId}
                    selectContact={selectContact}
                    key={item.userId}
                    item={item} />
                )}
            </div>
            <div className="toggle-contacts-bar" onClick={handleToggle}>
                <span className="toggle-contacts-icon">{isExpanded ? '<' : '>'}</span>
            </div>
        </div>
    );
}

const mapStateToProps = (state) => ({
    contacts: Object.values(state.contacts)
});

export default connect(mapStateToProps)(Contacts);