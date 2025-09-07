
import React, { useState, useCallback } from 'react';
import { View } from './types';
import SignatureCreator from './components/SignatureCreator';
import SignatureVerifier from './components/SignatureVerifier';
import { LockClosedIcon, ShieldCheckIcon } from './components/Icons';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CREATE);

  const renderView = useCallback(() => {
    switch (currentView) {
      case View.CREATE:
        return <SignatureCreator />;
      case View.VERIFY:
        return <SignatureVerifier />;
      default:
        return <SignatureCreator />;
    }
  }, [currentView]);

  const getButtonClass = (view: View) => {
    return `flex items-center justify-center w-full px-6 py-3 text-lg font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 ${
      currentView === view
        ? 'bg-blue-600 text-white shadow-lg'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Digital Signature Server
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          Securely sign and verify documents with AI-powered cryptographic simulation.
        </p>
      </header>
      
      <main className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="p-6 bg-gray-800 border-b border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCurrentView(View.CREATE)}
              className={getButtonClass(View.CREATE)}
            >
              <LockClosedIcon className="w-6 h-6 mr-3" />
              Create Signature
            </button>
            <button
              onClick={() => setCurrentView(View.VERIFY)}
              className={getButtonClass(View.VERIFY)}
            >
              <ShieldCheckIcon className="w-6 h-6 mr-3" />
              Verify Signature
            </button>
          </div>
        </div>
        
        <div className="p-6 sm:p-8">
          {renderView()}
        </div>
      </main>

      <footer className="w-full max-w-4xl mt-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Digital Signature Server. All Rights Reserved.</p>
        <p className="mt-1">This is a simulated service and should not be used for legally binding signatures.</p>
      </footer>
    </div>
  );
};

export default App;
