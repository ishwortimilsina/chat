import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import * as uuid from 'uuid';

import './App.css';

import { AppContext } from './contexts/AppContext';
import MainContainer from './components/MainContainer';
import { establishConnection } from './store/actions';

function App({ establishConnection }) {
    const [cred, setCred] = useState({});
    useEffect(() => {
        const userId = uuid.v1();
        const userName = uuid.v1();
        setCred({ userId, userName });
        establishConnection(userId, userName);
    }, [establishConnection]);

    return (
        <AppContext.Provider value={{...cred}}>
            <div className="App">
                <header className="App-header">
                    Chat App
                </header>
                <MainContainer />
            </div>
        </AppContext.Provider>
    );
}

export default connect(null, { establishConnection })(App);