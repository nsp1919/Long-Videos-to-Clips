import React, { useState } from 'react';
import axios from 'axios';
import { Upload as UploadIcon, Loader2 } from 'lucide-react';

export default function Upload({ onUploadComplete }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await axios.post('http://localhost:8000/api/upload', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                },
            });
            onUploadComplete(res.data);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed!");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700 max-w-md w-full mx-auto">
            <h2 className="text-xl font-bold mb-4 text-center text-white">Upload Video</h2>

            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                <input
                    type="file"
                    accept="video/mp4,video/mkv,video/mov"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                    <div className="text-gray-200 font-medium truncate">{file.name}</div>
                ) : (
                    <div className="flex flex-col items-center">
                        <UploadIcon className="w-10 h-10 text-gray-500 mb-2" />
                        <span className="text-gray-400">Click to upload or drag & drop</span>
                    </div>
                )}
            </div>

            {uploading && (
                <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 text-center">{progress}%</p>
                </div>
            )}

            <button
                disabled={!file || uploading}
                onClick={handleUpload}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
                {uploading ? <Loader2 className="animate-spin mr-2" /> : "Upload"}
            </button>
        </div>
    );
}
