import React, { useState } from 'react';
import Upload from './components/Upload';
import JobConfig from './components/JobConfig';
import JobStatus from './components/JobStatus';
import { Video } from 'lucide-react';

function App() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Config, 3: Status
  const [uploadData, setUploadData] = useState(null);
  const [jobId, setJobId] = useState(null);

  const handleUploadComplete = (data) => {
    setUploadData(data);
    setStep(2);
  };

  const handleJobCreated = (id) => {
    setJobId(id);
    setStep(3);
  };

  const handleReset = () => {
    setStep(1);
    setUploadData(null);
    setJobId(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white">
      <header className="p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center">
          <div className="p-2 bg-blue-600 rounded-lg mr-3 shadow-lg shadow-blue-900/20">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Local Shorts Gen
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 mt-8">
        <div className="transition-all duration-300 transform">
          {step === 1 && <Upload onUploadComplete={handleUploadComplete} />}
          {step === 2 && <JobConfig uploadData={uploadData} onJobCreated={handleJobCreated} />}
          {step === 3 && <JobStatus jobId={jobId} onReset={handleReset} />}
        </div>
      </main>
    </div>
  );
}

export default App;
