import { useState } from "react";
import { leaveFileSharing } from "../../store/actions";

import EndCallIcon from "../common/icons/EndCallIcon";
import FileUploadIcon from "../common/icons/FileUploadIcon";
import SendMessageIcon from "../common/icons/SendMessageIcon";

export default function ShareFileOngoing({ endFileSharing, shareFile }) {
    const [filename, setFilename] = useState('');
    const [file, setFile] = useState(null);

    const handleFileNameChange = ({ target }) => {
        const file = target.files[0];
        setFilename(file.name);
        setFile(file);
    }

    const handleFileSubmit = (event) => {
        console.log(file);
    }

    return (
        <>
            <form className="share-file-form" onSubmit={handleFileSubmit}>
                <div className="share-file-file-upload-container">
                    <label htmlFor="share-file-file-upload" className="custom-share-file-upload">
                        <FileUploadIcon style={{ height: 15 }} /> Choose file
                    </label>
                    <input id="share-file-file-upload" type="file" onChange={handleFileNameChange} />
                    <span className="file-upload-filename">{filename && filename}</span>
                </div>
                <div type="submit" className="share-file-submit">
                    Send&nbsp;<SendMessageIcon style={{ height: 20 }} />
                </div>
            </form>
            <div
                className="end-call-button"
                onClick={() => {
                    endFileSharing(shareFile.otherUser);
                    leaveFileSharing(shareFile.otherUser);
                }}
                title="End Call"
            >
                <EndCallIcon style={{ height: 30, width: 30 }} />
            </div>
        </>
    );
}