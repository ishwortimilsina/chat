import { useState } from "react";

import { endFileDownload, leaveFileSharing, sendFile } from "../../store/actions";

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
        sendFile(shareFile.otherUser, file);
    }

    return (
        <>
            <form className="share-file-form">
                {
                    shareFile.uploadProgress ? <progress max="100" value={shareFile.uploadProgress}>{shareFile.uploadProgress}</progress> : null
                }
                {
                    shareFile.downloadProgress ? (
                        <>
                            <progress max="100" value={shareFile.downloadProgress}>
                                {shareFile.downloadProgress}
                            </progress>{shareFile.downloadProgress}%
                        </>
                     ) : null
                }
                {
                    shareFile.bytesReceived === shareFile.shareFileMetadata.fileSize
                        ? <a
                            className="download-file-button"
                            href={URL.createObjectURL(new Blob(shareFile.shareFileData))}
                            download={shareFile.shareFileMetadata.fileName}
                            onClick={() => endFileDownload(shareFile.otherUser)}
                        >Download File</a>
                        : null
                }
                {
                    !shareFile.uploadProgress && ! shareFile.downloadProgress
                        ? (
                            <>
                                <div className="share-file-file-upload-container">
                                    <label htmlFor="share-file-file-upload" className="custom-share-file-upload">
                                        <FileUploadIcon style={{ height: 15 }} /> Choose file
                                    </label>
                                    <input id="share-file-file-upload" type="file" onChange={handleFileNameChange} />
                                    <span className="file-upload-filename">{filename && filename}</span>
                                </div>
                                <div type="submit" className="share-file-submit" onClick={handleFileSubmit}>
                                    Send&nbsp;<SendMessageIcon style={{ height: 20 }} />
                                </div>
                            </>
                        ) : null
                }
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