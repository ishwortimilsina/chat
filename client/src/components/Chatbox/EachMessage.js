export default function EachMessage({ message, selectedContact }) {
    return (
        <div className={`each-message ${selectedContact !== message.sender ? 'own-message': ''}`}>
            {message.text}
        </div>
    );
}