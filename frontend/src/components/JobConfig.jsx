import React, { useState } from 'react';
import axios from 'axios';
import { Settings, Play } from 'lucide-react';

export default function JobConfig({ uploadData, onJobCreated }) {
    const [duration, setDuration] = useState(60);
    const [captions, setCaptions] = useState(true);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("auto"); // auto | manual
    const [manualStart, setManualStart] = useState("00:00");
    const [manualEnd, setManualEnd] = useState("00:30");

    const startJob = async () => {
        setLoading(true);
        try {
            const payload = {
                video_path: uploadData.path,
                filename: uploadData.filename,
                mode: mode,
                duration: parseInt(duration),
                captions: captions,
                manual_start: manualStart,
                manual_end: manualEnd
            };
            const res = await axios.post('http://localhost:8000/api/job', payload);
            onJobCreated(res.data.job_id);
        } catch (error) {
            console.error(error);
            alert("Failed to start job");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700 max-w-md w-full mx-auto">
            <h2 className="text-xl font-bold mb-6 text-center text-white flex items-center justify-center">
                <Settings className="mr-2" /> Configure Shorts
            </h2>

            <div className="mb-4">
                <div className="flex space-x-2 mb-3 bg-gray-700 p-1 rounded-lg">
                    <button
                        onClick={() => setMode("auto")}
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'auto' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Automatic
                    </button>
                    <button
                        onClick={() => setMode("manual")}
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Manual
                    </button>
                </div>

                {mode === 'auto' ? (
                    <>
                        <label className="block text-gray-400 mb-2 font-medium">Clip Duration (seconds)</label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value={20}>20 Seconds</option>
                            <option value={30}>30 Seconds</option>
                            <option value={60}>60 Seconds</option>
                            <option value={90}>90 Seconds</option>
                            <option value={120}>120 Seconds</option>
                        </select>
                    </>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 mb-2 font-medium text-xs">Start Time (MM:SS)</label>
                            <input
                                type="text"
                                value={manualStart}
                                onChange={(e) => setManualStart(e.target.value)}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2.5 text-center"
                                placeholder="00:00"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2 font-medium text-xs">End Time (MM:SS)</label>
                            <input
                                type="text"
                                value={manualEnd}
                                onChange={(e) => setManualEnd(e.target.value)}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2.5 text-center"
                                placeholder="00:30"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="mb-6 flex items-center bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                <input
                    type="checkbox"
                    checked={captions}
                    onChange={(e) => setCaptions(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-600 bg-gray-700 border-gray-600"
                />
                <label className="ml-3 text-gray-300 font-medium">Generate Captions (AI)</label>
            </div>

            <button
                onClick={startJob}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            >
                {loading ? "Starting..." : <><Play className="mr-2 w-5 h-5" /> Start Processing</>}
            </button>
        </div>
    );
}
