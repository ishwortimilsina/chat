import { combineReducers } from 'redux';
import { contactsReducer } from './contactsReducer';
import messagesReducer from './messagesReducer';


const rootReducer = combineReducers({
    contacts: contactsReducer,
    messages: messagesReducer
});

export default rootReducer;