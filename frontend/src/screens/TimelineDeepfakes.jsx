import React from 'react';

const TimelineDeepfakes = ({ data }) => {
  // Default data if no data is passed
  const defaultData = [
    { year: 2017, title: 'First Deepfake Videos', description: 'Reddit user \'deepfakes\' posts early face-swap videos.' },
    { year: 2018, title: 'Deepfake Apps Emerge', description: 'Consumer tools such as FakeApp appear, making face swaps accessible.' },
    { year: 2019, title: 'Detection Challenges', description: 'Large-scale detection efforts like the Deepfake Detection Challenge begin.' },
    { year: 2020, title: 'Voice Cloning Advances', description: 'Commercial voice cloning tools become widely available.' },
    { year: 2021, title: 'Legislative Actions Begin', description: 'Countries start introducing laws addressing malicious deepfakes.' },
    { year: 2022, title: 'Real-time Deepfakes', description: 'Technology enables live face-swapping and augmented media in real time.' },
    { year: 2023, title: 'AI Detection Tools', description: 'More advanced AI-powered detection platforms are launched.' },
    { year: 2024, title: 'Election Deepfakes', description: 'Deepfakes play a notable role in election-related misinformation globally.' },
    { year: 2025, title: 'C2PA Standard Adoption', description: 'Content provenance standards see broader adoption to help authenticate media.' },
  ];

  const timelineData = data || defaultData;

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, \'Helvetica Neue\', Arial', background: '#f7f9fb', color: '#111', margin: 0, padding: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Evolution of Deepfakes (2017–2025)</h1>
        <p style={{ marginTop: '10px', color: '#666', fontSize: '0.85rem' }}>
          This is an interactive timeline of deepfake evolution. Data can be passed as props to customize the timeline.
        </p>

        <div style={{ marginTop: '18px', position: 'relative', paddingLeft: '20px' }} role="list">
          {timelineData.map((event, index) => (
            <div key={index} style={{ background: '#fff', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', gap: '12px', alignItems: 'flex-start' }} role="listitem">
              <div style={{ background: '#0d6efd', color: '#fff', minWidth: '64px', textAlign: 'center', borderRadius: '6px', padding: '8px 6px', fontWeight: 600 }}>
                {event.year}
              </div>
              <div style={{ fontSize: '0.95rem' }}>
                <p style={{ margin: 0, color: '#333' }}><strong>{event.title}</strong></p>
                <p style={{ margin: 0, color: '#333' }}>{event.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '18px', fontSize: '0.85rem', color: '#666' }}>
          <p>Developer note: This component accepts a 'data' prop to customize the timeline events.</p>
          <p><a href="/" style={{ display: 'inline-block', padding: '8px 10px', background: '#0d6efd', color: '#fff', borderRadius: '6px', textDecoration: 'none' }}>Return to site</a></p>
        </div>
      </div>
    </div>
  );
};

export default TimelineDeepfakes;