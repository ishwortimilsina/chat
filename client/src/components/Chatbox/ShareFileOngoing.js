import { useState } from "react";

import { leaveFileSharing } from "../../store/actions";

import EndCallIcon from "../common/icons/EndCallIcon";
import FileUploadIcon from "../common/icons/FileUploadIcon";
import SendMessageIcon from "../common/icons/SendMessageIcon";

export default function ShareFileOngoing({ requestShareFile, endFileSharing, shareFile, currUserId }) {
    const [filename, setFilename] = useState('');
    const [file, setFile] = useState(null);

    const handleFileNameChange = ({ target }) => {
        const file = target.files[0];
        setFilename(file.name);
        setFile(file);
    }

    const handleFileSubmit = (event) => {
        requestShareFile(shareFile.otherUser, currUserId, file);
    }

    return (
        <>
            <form className="share-file-form">
                {
                    shareFile.uploadProgress ? (
                        <>
                            <span>Uploading</span>
                            <span className="sharing-file-name" title={shareFile.shareFileMetadata.fileName}>
                                {shareFile.shareFileMetadata.fileName}
                            </span>
                            <span>Upload speed: {shareFile.uploadSpeed} MB/s</span>
                            <progress className="upload-download-progressbar" max="100" value={shareFile.uploadProgress}>
                                {shareFile.uploadProgress}
                            </progress>
                            <span>{shareFile.uploadProgress}%</span>
                        </>
                    ) : null
                }
                {
                    shareFile.downloadProgress ? (
                        <>
                            <span>Downloading</span>
                            <span className="sharing-file-name" title={shareFile.shareFileMetadata.fileName}>
                                {shareFile.shareFileMetadata.fileName}
                            </span>
                            <span>Download speed: {shareFile.downloadSpeed} MB/s</span>
                            <progress className="upload-download-progressbar" max="100" value={shareFile.downloadProgress}>
                                {shareFile.downloadProgress}
                            </progress>
                            <span>{shareFile.downloadProgress}%</span>
                        </>
                     ) : null
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
                                <div
                                    className={`share-file-submit${!filename ? ' disable' : ''}`}
                                    onClick={handleFileSubmit}
                                >
                                    Send&nbsp;<SendMessageIcon style={{ height: 20 }} />
                                </div>
                            </>
                        ) : null
                }
            </form>
            <div
                className="end-call-button"
                onClick={() => {
                    endFileSharing();
                    leaveFileSharing(shareFile.otherUser, currUserId);
                }}
                title="End Call"
            >
                <EndCallIcon style={{ height: 30, width: 30 }} />
            </div>
        </>
    );
}