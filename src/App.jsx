import React, { useState } from 'react';
import './App.css';

function App() {
  const [activeModule, setActiveModule] = useState(null);

  const handleModuleSelect = (moduleName) => {
    console.log(`Selected module: ${moduleName}`);
    setActiveModule(moduleName);
  };

  const handleBackToHome = () => {
    setActiveModule(null);
  };

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
      </main>

      <footer>
        <p>HandiLearn - Version 1.0.0</p>
      </footer>
    </div>
  );
}

export default App;
