import { combineReducers } from 'redux';
import { audioCallReducer } from './audioCallReducer';
import { contactsReducer } from './contactsReducer';
import { messagesReducer } from './messagesReducer';
import { shareFileReducer } from './shareFileReducer';
import statusReducer from './statusReducer';
import { videoCallReducer } from './videoCallReducer';


const rootReducer = combineReducers({
    contacts: contactsReducer,
    messages: messagesReducer,
    audioCall: audioCallReducer,
    videoCall: videoCallReducer,
    shareFile: shareFileReducer,
    status: statusReducer
});

export default rootReducer;