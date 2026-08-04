import React from 'react';
import SplitPane from './SplitPane';
import PlaybackControls from '../engine/PlaybackControls';
import StepDescription from '../engine/StepDescription';
import StepTimeline from '../engine/StepTimeline';
import StatsPanel from '../engine/StatsPanel';
import StatePanel from '../engine/StatePanel';
import CodeEditor from '../editors/CodeEditor';
import './VisualizationLayout.css';

/**
 * AlgoVerse V2 — Visualization Layout
 *
 * Universal layout for all algorithm visualization pages.
 * Provides consistent structure: header, tabs, visualization, code, controls.
 *
 * Layout:
 * ┌─────────────────────────────────────────────────┐
 * │  Header (title, difficulty, description)         │
 * ├─────────────────────────────────────────────────┤
 * │  [Visualization]  │  [Code Editor]              │
 * ├───────────────────┴─────────────────────────────┤
 * │  Step Timeline                                  │
 * ├─────────────────────────────────────────────────┤
 * │  Playback Controls                              │
 * ├─────────────────────────────────────────────────┤
 * │  Step Description  │  State Panel  │  Stats     │
 * └─────────────────────────────────────────────────┘
 */
const VisualizationLayout = ({
  engine,
  onStart,
  visualization,      // React element for the visualization area
  code = '',          // Code string to display
  codeLanguage = 'python',
  algorithmType = 'array', // 'array' | 'graph' | 'search' | 'dp'
  metadata = null,    // Algorithm metadata for StatsPanel
  header = null,      // Optional header element
  className = '',
}) => {
  return (
    <div className={`viz-layout ${className}`}>
      {/* Optional header */}
      {header && <div className="viz-layout-header">{header}</div>}

      {/* Main: Visualization + Code side-by-side */}
      <div className="viz-layout-main">
        <SplitPane
          left={
            <div className="viz-layout-viz-area">
              {visualization}
            </div>
          }
          right={
            <div className="viz-layout-code-area">
              <CodeEditor code={code} language={codeLanguage} readOnly={true} />
            </div>
          }
          defaultSplit={60}
        />
      </div>

      {/* Step Timeline */}
      <StepTimeline engine={engine} />

      {/* Playback Controls */}
      <PlaybackControls engine={engine} onStart={onStart} />

      {/* Bottom: Step Description + State Panel + Stats */}
      <div className="viz-layout-bottom">
        <StepDescription />
        <StatePanel algorithmType={algorithmType} />
        <StatsPanel metadata={metadata} />
      </div>
    </div>
  );
};

export default VisualizationLayout;
