import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle, AlertCircle, FileVideo, Rocket, X, Copy } from 'lucide-react';

export default function JobStatus({ jobId, onReset }) {
    const [status, setStatus] = useState("initializing");
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [shareData, setShareData] = useState(null);
    const [sharing, setSharing] = useState(false);

    const handleShare = async (clipPath) => {
        setSharing(true);
        setShareData(null);
        try {
            const res = await axios.post('http://localhost:8000/api/share', { clip_path: clipPath });
            setShareData(res.data);
        } catch (err) {
            alert("Failed to generate metadata");
        } finally {
            setSharing(false);
        }
    };

    useEffect(() => {
        let interval;
        const poll = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/api/job/${jobId}`);
                setStatus(res.data.status);
                setData(res.data);
                if (res.data.status === 'completed' || res.data.status === 'failed') {
                    clearInterval(interval);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to fetch status");
            }
        };

        poll(); // initial
        interval = setInterval(poll, 2000);
        return () => clearInterval(interval);
    }, [jobId]);

    return (
        <div className="p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700 max-w-2xl w-full mx-auto">
            <h2 className="text-xl font-bold mb-6 text-center text-white">Job Status</h2>

            <div className="flex flex-col items-center justify-center py-8">
                {status === 'failed' ? (
                    <div className="text-red-500 flex flex-col items-center">
                        <AlertCircle className="w-16 h-16 mb-4" />
                        <p className="text-lg">Processing Failed</p>
                        <p className="text-sm text-gray-400 mt-2">{data?.error}</p>
                    </div>
                ) : status === 'completed' ? (
                    <div className="w-full">
                        <div className="text-green-500 flex flex-col items-center mb-6">
                            <CheckCircle className="w-16 h-16 mb-4" />
                            <p className="text-lg font-bold">Done!</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {data?.output_files?.map((file, idx) => (
                                <div key={idx} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                                    <span className="flex items-center truncate text-gray-200">
                                        <FileVideo className="mr-3 text-blue-400" />
                                        Clip {idx + 1}
                                    </span>
                                    {/* Since backend is local, we probably can't serve directly via file:// in browser. 
                                    We need a serve endpoint. assuming /api/download or just static host if mounted.
                                    For now, let's just show path, or better, we should have added clear serve logic.
                                    I will assume backend doesn't serve files yet, so I will list the path.
                                */}
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500 font-mono bg-black/30 p-1 rounded hidden sm:inline-block truncate max-w-[200px]">
                                            {file}
                                        </span>
                                        <button
                                            onClick={() => handleShare(file)}
                                            className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                                            title="Generate Viral Metadata"
                                        >
                                            <Rocket className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Share Modal */}
                        {shareData && (
                            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                                <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-w-lg w-full p-6 relative">
                                    <button
                                        onClick={() => setShareData(null)}
                                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>

                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                        <Rocket className="mr-2 text-pink-500" /> Viral Metadata
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                                            <p className="text-lg font-medium text-white">{shareData.title}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                                            <p className="text-gray-300 text-sm">{shareData.description}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Hashtags</label>
                                            <p className="text-blue-400 text-sm">{shareData.hashtags}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.description}\n\n${shareData.hashtags}`);
                                            alert("Copied to clipboard!");
                                        }}
                                        className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                        <Copy className="w-4 h-4 mr-2" /> Copy All
                                    </button>
                                </div>
                            </div>
                        )}

                        {sharing && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-gray-800 p-6 rounded-xl flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
                                    <p className="text-white">Generating Metadata...</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-blue-400 flex flex-col items-center">
                        <Loader2 className="w-16 h-16 animate-spin mb-4" />
                        <p className="text-lg capitalize">{status.replace('_', ' ')}...</p>
                    </div>
                )}
            </div>

            {(status === 'completed' || status === 'failed') && (
                <button
                    onClick={onReset}
                    className="mt-8 w-full bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg transition-colors"
                >
                    Start New Project
                </button>
            )}
        </div>
    );
}
