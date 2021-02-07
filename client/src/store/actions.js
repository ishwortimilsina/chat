import io from 'socket.io-client';

export const SET_CONTACTS = 'contacts:set';
export const SEND_MESSAGE = 'message:send';
export const RECEIVE_MESSAGE = 'message:receive'; 

let newSocket = null;

export function establishConnection(id) {
    return async (dispatch) => {
        try {
            newSocket = await io(
                'http://localhost:3001',
                {
                    query: { id },
                    transports: ["websocket"]
                },
            );

            newSocket.on('receive-message', data => {
                dispatch({
                    type: RECEIVE_MESSAGE,
                    recipients: data.recipients,
                    sender: data.sender,
                    time: data.time,
                    text: data.msg
                });
            });

            newSocket.on('contacts-list', data => {
                dispatch({
                    type: SET_CONTACTS,
                    contacts: data.contacts
                })
            });

        } catch (ex) {
            console.log(ex);
        }
    };
}

export function sendMessage({ recipients, text, sender }) {
    return async (dispatch) => {
        try {
            await newSocket.emit('send-message', { recipients, msg: text, sender });
            dispatch({
                type: SEND_MESSAGE,
                recipients,
                text,
                sender,
                time: Date.now()
            });
        } catch (ex) {
            console.log(ex);
        }
    }
}