import React from 'react';
import TimelineDeepfakes from '../screens/TimelineDeepfakes';

const InteractiveContent = ({ content }) => {
  const { url, title, description } = content;

  // Map of URLs to components
  const componentMap = {
    '/interactive/timeline-deepfakes': TimelineDeepfakes,
    // Add more mappings here as you create components
    // '/interactive/gans-diagram': GansDiagram,
    // etc.
  };

  const Component = componentMap[url];

  if (Component) {
    return <Component data={content.data} />; // Pass any data if available
  }

  // Default fake content for unmapped URLs
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3>{title}</h3>
      <p>{description}</p>
      <p style={{ color: '#666', fontStyle: 'italic' }}>
        This is a placeholder for interactive content at {url}. Add a component to the componentMap in InteractiveContent.jsx to render actual content here.
      </p>
      {/* You can add more fake content here, like a simple diagram or text */}
      <div style={{ marginTop: '20px' }}>
        <h4>Fake Interactive Content</h4>
        <p>Imagine an interactive {title.toLowerCase()} here.</p>
        {/* Example: if it's a diagram, show some text */}
        {url.includes('diagram') && <p>📊 Diagram visualization would go here.</p>}
        {url.includes('gallery') && <p>🖼️ Image gallery would go here.</p>}
        {url.includes('map') && <p>🗺️ Interactive map would go here.</p>}
        {url.includes('dilemmas') && <p>🤔 Ethical scenarios would go here.</p>}
        {url.includes('scenarios') && <p>⚖️ Legal scenarios would go here.</p>}
        {url.includes('facial') && <p>👤 Facial analysis tutorial would go here.</p>}
      </div>
    </div>
  );
};

export default InteractiveContent;