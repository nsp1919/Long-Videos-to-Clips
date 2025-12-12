import React, { useState } from 'react';
import axios from 'axios';
import { Settings, Play, Plus, X } from 'lucide-react';

export default function JobConfig({ uploadData, onJobCreated }) {
    const [duration, setDuration] = useState(60);
    const [captions, setCaptions] = useState(true);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("auto"); // auto | manual | merge
    const [manualStart, setManualStart] = useState("00:00");
    const [manualEnd, setManualEnd] = useState("00:30");
    const [enhance4k, setEnhance4k] = useState(false);

    // Segments for Merge mode
    const [segments, setSegments] = useState([{ start: "00:00", end: "00:10" }]);

    const addSegment = () => {
        setSegments([...segments, { start: "00:00", end: "00:10" }]);
    };

    const removeSegment = (index) => {
        if (segments.length > 1) {
            setSegments(segments.filter((_, i) => i !== index));
        }
    };

    const updateSegment = (index, field, value) => {
        const newSegments = [...segments];
        newSegments[index][field] = value;
        setSegments(newSegments);
    };

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
                manual_end: manualEnd,
                enhance_4k: enhance4k,
                merge_segments: segments
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
                    <button
                        onClick={() => setMode("merge")}
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'merge' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Merge
                    </button>
                </div>

                {mode === 'auto' && (
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
                )}

                {mode === 'manual' && (
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

                {mode === 'merge' && (
                    <div className="space-y-2">
                        <label className="block text-gray-400 mb-1 font-medium text-sm">Merge Segments</label>
                        <div className="max-h-48 overflow-y-auto space-y-2 p-1">
                            {segments.map((seg, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <span className="text-gray-500 text-xs w-4">{index + 1}.</span>
                                    <input
                                        type="text"
                                        value={seg.start}
                                        onChange={(e) => updateSegment(index, 'start', e.target.value)}
                                        className="w-20 bg-gray-700 text-white border border-gray-600 rounded p-1.5 text-center text-sm"
                                        placeholder="00:00"
                                    />
                                    <span className="text-gray-500">-</span>
                                    <input
                                        type="text"
                                        value={seg.end}
                                        onChange={(e) => updateSegment(index, 'end', e.target.value)}
                                        className="w-20 bg-gray-700 text-white border border-gray-600 rounded p-1.5 text-center text-sm"
                                        placeholder="01:00"
                                    />
                                    {segments.length > 1 && (
                                        <button onClick={() => removeSegment(index)} className="text-red-500 hover:text-red-400">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addSegment}
                            className="w-full py-1.5 mt-2 rounded border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 text-sm flex items-center justify-center transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Segment
                        </button>
                    </div>
                )}
            </div>

            <div className="mb-4 mt-6 flex items-center bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                <input
                    type="checkbox"
                    checked={captions}
                    onChange={(e) => setCaptions(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-600 bg-gray-700 border-gray-600"
                />
                <label className="ml-3 text-gray-300 font-medium select-none cursor-pointer" onClick={() => setCaptions(!captions)}>
                    Generate Captions (AI)
                </label>
            </div>

            <div className="mb-6 flex items-center bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                <input
                    type="checkbox"
                    checked={enhance4k}
                    onChange={(e) => setEnhance4k(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-600 bg-gray-700 border-gray-600"
                />
                <label className="ml-3 text-gray-300 font-medium select-none cursor-pointer" onClick={() => setEnhance4k(!enhance4k)}>
                    ✨ Enhance to 4k Quality
                </label>
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
