import React, { useState } from 'react';
import { FaPlay, FaChevronDown, FaChevronUp, FaTerminal } from 'react-icons/fa';

const CodeRunner = ({ currentFile, code, children, onRunCode }) => {
  const [output, setOutput] = useState('');
  const [isOutputVisible, setIsOutputVisible] = useState(false); // Start closed
  const [isLoading, setIsLoading] = useState(false);

  const handleRun = async (e) => {
    e.preventDefault();
    if (!code || !currentFile) {
      setOutput('Please open a file and write some code first.');
      setIsOutputVisible(true); // Open panel to show error
      return;
    }
    setIsLoading(true);
    try {
      const response = await onRunCode();
      if (response && response.data && typeof response.data.output !== 'undefined') {
        setOutput(String(response.data.output));
      } else if (response && response.data) {
        setOutput('No output returned. Full response: ' + JSON.stringify(response.data));
      } else {
        setOutput('No output and no response from server.');
      }
      // Always open panel when we run code
      setIsOutputVisible(true);
    } catch (error) {
      setOutput((error && error.message) ? error.message : 'An error occurred while running the code');
      // Always open panel when there's an error
      setIsOutputVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOutput = () => {
    setIsOutputVisible(!isOutputVisible);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-pink-500/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <FaTerminal className="text-pink-400" size={16} />
          <span className="text-white font-medium text-sm">
            {currentFile || 'No File Selected'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Only show toggle button if output panel has been opened at least once */}
          {(isOutputVisible || output) && (
            <button
              onClick={toggleOutput}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 border ${
                isOutputVisible 
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30' 
                  : 'bg-gray-700/30 text-gray-400 border-gray-600/30 hover:bg-gray-600/30 hover:text-gray-300'
              }`}
              title={isOutputVisible ? 'Hide output panel' : 'Show output panel'}
            >
              <FaTerminal size={10} />
              <span>{isOutputVisible ? 'Hide Output' : 'Show Output'}</span>
              {isOutputVisible ? <FaChevronDown size={8} /> : <FaChevronUp size={8} />}
            </button>
          )}
          
          {/* Run Button */}
          <button 
            onClick={handleRun}
            disabled={isLoading || !code || !currentFile}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg text-sm ${
              isLoading || !code || !currentFile
                ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed border border-gray-600/30'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border border-pink-500/30 shadow-pink-500/20'
            }`}
          >
            <FaPlay className="text-xs" />
            {isLoading ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* Editor and Output Panel */}
      <div className="flex flex-col flex-1 min-h-0 relative">
        {/* Editor */}
        <div className="flex-1 min-h-0">
          {children}
        </div>
        
        {/* Output Panel - Overlays on bottom half of editor */}
        {isOutputVisible && (
          <div className="absolute bottom-0 left-0 right-0 h-80 bg-black/85 backdrop-blur-sm border-t-2 border-pink-500/30 flex flex-col shadow-lg shadow-pink-500/20 z-10">
            {/* Output Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-b border-pink-500/20 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FaTerminal className="text-pink-400" size={14} />
                <span className="text-white font-medium text-sm">Console Output</span>
                {isLoading && (
                  <span className="text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 animate-pulse">
                    Running...
                  </span>
                )}
              </div>
              {/* Minimize button in header */}
              <button
                onClick={toggleOutput}
                className="text-gray-400 hover:text-white p-1.5 hover:bg-pink-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-pink-500/20"
                title="Hide output panel"
              >
                <FaChevronDown size={12} />
              </button>
            </div>
            
            {/* Output Content */}
            <div className="flex-1 overflow-auto p-4 bg-black/30">
              {output ? (
                <pre className="whitespace-pre-wrap break-words text-gray-100 font-mono text-sm leading-relaxed">
                  {output}
                </pre>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <FaTerminal className="w-12 h-12 mx-auto mb-3 opacity-40 text-pink-400" />
                  <p className="text-sm text-gray-300">No output yet</p>
                  <p className="text-xs mt-1 text-gray-500">Run your code to see the results here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeRunner;