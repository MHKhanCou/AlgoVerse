import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw,
  ChevronLeft, ChevronRight, Gauge,
} from 'lucide-react';
import useVisualizationStore from '../../engine/state';
import './PlaybackControls.css';

/**
 * AlgoVerse V2 — Playback Controls
 *
 * Unified control panel for all visualizations.
 * Play/Pause, Step Forward/Back, Reset, Speed slider, drag-to-seek progress.
 */
const PlaybackControls = ({ engine, onStart }) => {
  const {
    status, currentStep, steps, speed,
  } = useVisualizationStore();

  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle' || status === 'stepping';
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  // Drag-to-seek state
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef(null);

  const handlePlayPause = useCallback(() => {
    if (!engine) return;
    if (isPlaying) {
      engine.pause();
    } else {
      if (isIdle && currentStep === -1) {
        onStart?.();
      }
      engine.play();
    }
  }, [engine, isPlaying, isIdle, currentStep, onStart]);

  const handleStepForward = useCallback(() => {
    if (!engine) return;
    engine.stepForward();
  }, [engine]);

  const handleStepBackward = useCallback(() => {
    if (!engine) return;
    engine.stepBackward();
  }, [engine]);

  const handleReset = useCallback(() => {
    if (!engine) return;
    engine.stop();
  }, [engine]);

  const handleSpeedChange = useCallback((e) => {
    if (!engine) return;
    const newSpeed = parseFloat(e.target.value);
    engine.setSpeed(newSpeed);
  }, [engine]);

  // Seek to position from mouse event
  const seekFromEvent = useCallback((e) => {
    if (!engine || totalSteps === 0) return;
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    engine.seekTo(percentage);
  }, [engine, totalSteps]);

  // Drag-to-seek handlers
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    seekFromEvent(e);
  }, [seekFromEvent]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      seekFromEvent(e);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, seekFromEvent]);

  return (
    <div className="playback-controls" role="toolbar" aria-label="Visualization playback controls">
      {/* Progress bar with drag-to-seek */}
      <div
        ref={progressRef}
        className={`playback-progress ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        role="slider"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        tabIndex={0}
      >
        <div
          className="playback-progress-fill"
          style={{ width: `${progress}%` }}
        />
        <div
          className="playback-progress-thumb"
          style={{ left: `${progress}%` }}
        />
      </div>

      <div className="playback-controls-row">
        {/* Left: step controls */}
        <div className="playback-step-controls">
          <button
            onClick={handleReset}
            disabled={isIdle && currentStep === -1}
            className="playback-btn"
            title="Reset (R)"
            aria-label="Reset visualization"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={() => engine?.seekTo(0)}
            disabled={currentStep <= 0}
            className="playback-btn"
            title="Go to start (Home)"
            aria-label="Go to start"
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={handleStepBackward}
            disabled={currentStep <= 0}
            className="playback-btn"
            title="Step backward (←)"
            aria-label="Step backward"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={handlePlayPause}
            className="playback-btn playback-btn-primary"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            aria-label={isPlaying ? 'Pause visualization' : 'Play visualization'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={handleStepForward}
            disabled={currentStep >= totalSteps - 1}
            className="playback-btn"
            title="Step forward (→)"
            aria-label="Step forward"
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={() => engine?.seekTo(1)}
            disabled={currentStep >= totalSteps - 1}
            className="playback-btn"
            title="Go to end (End)"
            aria-label="Go to end"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Center: step counter */}
        <div className="playback-step-counter">
          {totalSteps > 0 ? (
            <span>{currentStep + 1} / {totalSteps}</span>
          ) : (
            <span className="playback-idle">Ready</span>
          )}
        </div>

        {/* Right: speed control */}
        <div className="playback-speed">
          <Gauge size={14} />
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={speed}
            onChange={handleSpeedChange}
            className="playback-speed-slider"
            title={`Speed: ${speed}x (+/-)`}
            aria-label={`Playback speed: ${speed}x`}
          />
          <span className="playback-speed-label">{speed}x</span>
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;
