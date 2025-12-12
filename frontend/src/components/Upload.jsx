import React, { useState } from 'react';
import axios from 'axios';
import { Upload as UploadIcon, FileVideo, Youtube, Link, Loader2 } from 'lucide-react';

export default function Upload({ onUploadComplete }) {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('file'); // 'file' | 'url'
    const [url, setUrl] = useState('');
    const [progress, setProgress] = useState(0);

    const handleFile = async (file) => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post('http://localhost:8000/api/upload', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });
            onUploadComplete(res.data);
        } catch (error) {
            console.error(error);
            alert("Upload failed");
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const handleUrlSubmit = async () => {
        if (!url) return;
        setUploading(true);
        try {
            const res = await axios.post('http://localhost:8000/api/process-url', { url: url });
            onUploadComplete(res.data);
        } catch (error) {
            console.error(error);
            alert("Failed to process URL");
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="max-w-md w-full mx-auto p-4 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-6 text-center text-white">Upload Video</h2>

            <div className="flex mb-4 bg-gray-700 rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('file')}
                    className={`flex-1 py-2 rounded-md flex items-center justify-center font-medium transition-colors ${activeTab === 'file' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <UploadIcon className="w-4 h-4 mr-2" /> Upload File
                </button>
                <button
                    onClick={() => setActiveTab('url')}
                    className={`flex-1 py-2 rounded-md flex items-center justify-center font-medium transition-colors ${activeTab === 'url' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <Youtube className="w-4 h-4 mr-2" /> YouTube URL
                </button>
            </div>

            {activeTab === 'file' ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 bg-gray-800'}`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="fileInput"
                        className="hidden"
                        accept="video/*"
                        onChange={(e) => handleFile(e.target.files[0])}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-2" />
                            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{progress}%</p>
                        </div>
                    ) : (
                        <div className="cursor-pointer" onClick={() => document.getElementById('fileInput').click()}>
                            <FileVideo className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-300 font-medium">Drag & Drop or Click to Upload</p>
                            <p className="text-gray-500 text-sm mt-2">MP4, MKV, MOV</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="mb-4">
                        <label className="block text-gray-400 mb-2 font-medium">Paste YouTube Link</label>
                        <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg px-3">
                            <Link className="w-5 h-5 text-gray-400 mr-2" />
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full bg-transparent border-none text-white py-3 focus:ring-0 placeholder-gray-500 outline-none"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleUrlSubmit}
                        disabled={uploading || !url}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {uploading ? <><Loader2 className="animate-spin mr-2 w-5 h-5" /> Downloading...</> : "Fetch & Process"}
                    </button>
                </div>
            )}
        </div>
    );
}
