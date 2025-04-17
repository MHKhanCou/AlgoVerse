import React from 'react';

const Sidebar = ({ activeSection, setActiveSection }) => {
  return (
    <aside className="dashboard-sidebar">
      <ul>
        {['dashboard', 'users', 'algo-types', 'algorithms', 'progress', 'blogs', 'help'].map((section) => (
          <li
            key={section}
            className={activeSection === section ? 'active' : ''}
            onClick={() => setActiveSection(section)}
          >
            {section.charAt(0).toUpperCase() + section.slice(1).replace('-', ' ')}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;