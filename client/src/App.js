import { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import './App.css';

import MainContainer from './components/MainContainer';
import { establishConnection } from './store/actions';

function App({ establishConnection }) {
    const [id, setId] = useState('');
    // just a placeholder for id, name to be determined after login
    useEffect(() => {
        function askInput() {
            const input = prompt("Enter id and name separated by ':'");
            if (input && input.includes(':')) {
                const [id, name] = input.split(':');
                setId(id);
                localStorage.setItem("chat-identity", JSON.stringify({ id, name }));
            } else {
                askInput();
            }
        }
        if (localStorage.getItem("chat-identity")) {
            const {id} = JSON.parse(localStorage.getItem("chat-identity"));
            setId(id);
        } else {
            askInput();
        }
    }, []);

    useEffect(() => {
        if (id) {
            establishConnection(id);
        }
    }, [id, establishConnection]);

    return (
        <div className="App">
            <header className="App-header">
                Chat App
            </header>
            <MainContainer />
        </div>
    );
}

export default connect(null, { establishConnection })(App);
