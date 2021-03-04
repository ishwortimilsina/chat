import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import './Landing.css';
import LoginForm from './LoginForm';

export default function Landing() {
    const { status } = useContext(AppContext);

    return (
        <div className="landing-page">
            {
                status.connected
                    ? <div>Connected</div>
                    : <LoginForm userName="Ishwor Timilsina" userId="some-random-id" />
            }
        </div>
    );
}