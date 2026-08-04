import React, { useState } from 'react';
import './TabPanel.css';

/**
 * AlgoVerse V2 — Tab Panel
 *
 * Reusable tabbed interface for algorithm detail pages.
 */
const TabPanel = ({ tabs, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeContent = tabs.find(t => t.id === activeTab);

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-panel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon && <span className="tab-panel-tab-icon">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-panel-content">
        {activeContent?.content}
      </div>
    </div>
  );
};

export default TabPanel;
