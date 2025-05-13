import React, { useState } from 'react';
import './App.css';
import HandTrackingTest from './ui/HandTrackingTest';

function App() {
  const [activeModule, setActiveModule] = useState(null);
  const [showHandTrackingTest, setShowHandTrackingTest] = useState(false);

  const handleModuleSelect = (moduleName) => {
    console.log(`Selected module: ${moduleName}`);
    setActiveModule(moduleName);
  };

  const handleBackToHome = () => {
    setActiveModule(null);
    setShowHandTrackingTest(false);
  };

  // Render the hand tracking test view
  if (showHandTrackingTest) {
    return (
      <div className="app">
        <header>
          <h1>HandiLearn</h1>
          <p>Hand Tracking Test</p>
        </header>

        <main>
          <HandTrackingTest />

          <button className="back-button" onClick={handleBackToHome}>
            Back to Home
          </button>
        </main>

        <footer>
          <p>HandiLearn - Version 1.0.0</p>
        </footer>
      </div>
    );
  }

  // Render the game view when a module is active
  if (activeModule) {
    return (
      <div className="game-view">
        <div className="webcam-feed"></div>
        <div className="game-overlay"></div>
        <button className="back-button" onClick={handleBackToHome}>
          Back to Home
        </button>
        <div className="module-info">
          <h2>{activeModule} Module</h2>
        </div>
      </div>
    );
  }

  // Render the home/welcome view when no module is active
  return (
    <div className="app">
      <header>
        <h1>HandiLearn</h1>
        <p>Educational Platform for Toddlers</p>
      </header>

      <main>
        <div className="welcome-container">
          <h2>Welcome to HandiLearn!</h2>
          <p>Select a learning module to begin:</p>
        </div>

        <div className="module-selector">
          <div className="module-buttons">
            <button onClick={() => handleModuleSelect('Shapes')}>Shapes</button>
            <button onClick={() => handleModuleSelect('Animals')}>Animals</button>
            <button onClick={() => handleModuleSelect('Colors')}>Colors</button>
          </div>
        </div>

        <div className="dev-tools">
          <h3>Development Tools</h3>
          <button
            className="dev-button"
            onClick={() => setShowHandTrackingTest(true)}
          >
            Hand Tracking Test
          </button>
        </div>
      </main>

      <footer>
        <p>HandiLearn - Version 1.0.0</p>
      </footer>
    </div>
  );
}

export default App;
