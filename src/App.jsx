import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  return (
    <div className="app">
      <header>
        <h1>HandiLearn</h1>
        <p>Educational Platform for Toddlers</p>
      </header>

      <main>
        <div className="game-container">
          <div id="playcanvas-container"></div>
          <div id="webcam-container"></div>
        </div>

        <div className="module-selector">
          <h2>Learning Modules</h2>
          <div className="module-buttons">
            <button disabled>Shapes (Coming Soon)</button>
            <button disabled>Animals (Coming Soon)</button>
            <button disabled>Colors (Coming Soon)</button>
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
