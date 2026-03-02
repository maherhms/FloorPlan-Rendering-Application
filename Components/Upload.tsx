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
    const isMounted = useRef(true);

    const {isSignedIn} = useOutletContext<AuthContext>();

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
    const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

    const processFile = (file: File) => {
        if (!isSignedIn) return;
        if (!ALLOWED_TYPES.has(file.type)) return;
        if (file.size > MAX_UPLOAD_BYTES) return;

        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setProgress(0);
        setFile(file);

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (e) => {
            if (!isMounted.current) return;
            const base64 = e.target?.result as string;
            intervalRef.current = setInterval(() => {
                if (!isMounted.current) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return;
                }
                setProgress((prev) => {
                    const nextProgress = prev + PROGRESS_STEP;
                    if (nextProgress >= 100) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        timeoutRef.current = setTimeout(() => {
                            if (isMounted.current && onComplete) onComplete(base64);
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
                        <p className="help">Maximum file size 50 MB.</p>
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