import ContactListItem from './contactListItem';
import './contacts.css';

import { connect } from 'react-redux';

function Contacts({ contacts, selectedContact, selectContact }) {
    return (
        <div className="contacts">
            <div className="contacts-title">
                <img src="favicon.ico" alt="Profile" className="contacts-title-img" />
                <div>Chats</div>
            </div>
            <div className="contacts-list">
                {contacts.map((item) => <ContactListItem
                    isSelected={selectedContact === item.id}
                    selectContact={selectContact}
                    key={item.id}
                    item={item} />
                )}
            </div>
        </div>
    );
}

const mapStateToProps = (state) => {
    return { contacts: state.contacts };
}

export default connect(mapStateToProps)(Contacts);