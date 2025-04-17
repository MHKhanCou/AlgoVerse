import React from 'react';

const HelpSection = () => {
  return (
    <section>
      <h2>Help & Tips</h2>
      <div className="chat-help">
        <div className="help-message">
          <strong>Tip:</strong> Use the search bar to quickly find users.
        </div>
        <div className="help-message">
          <strong>Tip:</strong> Click "Make Admin" to promote a user to admin status.
        </div>
        <div className="help-message">
          <strong>Tip:</strong> Delete user progress to reset their learning journey.
        </div>
      </div>
    </section>
  );
};

export default HelpSection;