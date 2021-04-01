import { useState } from 'react'; 

import ContactListItem from './contactListItem';
import './contacts.css';

import { connect } from 'react-redux';
import { SearchContacts } from './SearchContacts';

function Contacts({ contacts, selectedContact, selectContact }) {
    const [searchTerm, setSearchTerm] = useState('');
    return (
        <div className="contacts">
            <div className="contacts-title">
                <div className="contacts-title-title">
                    <img src="/favicon.ico" alt="Profile" className="contacts-title-img" />
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
        </div>
    );
}

const mapStateToProps = (state) => ({
    contacts: Object.values(state.contacts)
});

export default connect(mapStateToProps)(Contacts);