import React, {useEffect, useRef, useState} from 'react';
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS} from "../lib/constants";

interface UploadProps {
    onComplete?: (data: string) => void;
}

const Upload = ({onComplete}: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const readerRef = useRef<FileReader | null>(null);
    const isMountedRef = useRef(true);

    const {isSignedIn} = useOutletContext<AuthContext>();

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (readerRef.current && readerRef.current.readyState === FileReader.LOADING) {
                readerRef.current.abort();
                }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                }
            };
        }, []);

    const MAX_FILE_SIZE_MB = 10;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    const processFile = (file: File) => {
        if (!isSignedIn) return;

        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a JPG or PNG image');
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            alert(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
            return;
        }
        setFile(file);

        const reader = new FileReader();
        readerRef.current = reader;
        reader.readAsDataURL(file);

        reader.onerror = () => {
            if (!isMountedRef.current) return;
            alert('Failed to read file. Please try again.');
            setFile(null);
        };

        reader.onload = (e) => {
            if (!isMountedRef.current) return;
            const base64 = e.target?.result as string;
            intervalRef.current = setInterval(() => {
                setProgress((prev) => {
                    const nextProgress = prev + PROGRESS_STEP;
                    if (nextProgress >= 100) {
                        clearInterval(intervalRef.current!);
                        intervalRef.current = null;
                        timeoutRef.current = setTimeout(() => {
                            if (onComplete) onComplete(base64);
                        }, REDIRECT_DELAY_MS);
                        return 100;
                    }
                    return nextProgress;
                });
            }, PROGRESS_INTERVAL_MS);
        };
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    return (
        <div className="upload">
            {!file ? (
                <div className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                     onDragOver={handleDragOver}
                     onDragLeave={handleDragLeave}
                     onDrop={handleDrop}>
                    <input type="file"
                           className="drop-input"
                           accept=".jpg,.jpeg,.png"
                           onChange={handleFileChange}
                           disabled={!isSignedIn} />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20}/>
                        </div>
                        <p>{isSignedIn? (
                            "Click to upload or drag and drop"
                        ):(
                            "Sign in or Sign up with Puter to upload"
                        )}</p>
                        <p className="help">Maximum file size 10 MB.</p>
                    </div>
                </div>
            ):(
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ?(
                                <CheckCircle2 className="check"/>
                            ):(
                                <ImageIcon className="image"/>
                            )}
                        </div>

                        <h3>{file.name}</h3>
                        <div className="progress">
                            <div className="bar" style={{width: `${progress}%`}}/>

                            <p className="status-text">
                                {progress < 100 ? ("Analyzing floor plan..."):("Redirecting...")}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload;