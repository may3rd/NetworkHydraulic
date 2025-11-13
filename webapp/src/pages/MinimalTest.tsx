import React from 'react';

const MinimalTest: React.FC = () => {
  return React.createElement('div', {
    style: { padding: '40px', textAlign: 'center', backgroundColor: '#f0f0f0', minHeight: '100vh' }
  }, [
    React.createElement('h1', { key: 'title' }, '✅ Minimal Test - React is Working!'),
    React.createElement('p', { key: 'content' }, 'If you can see this, React is rendering correctly.')
  ]);
};

export default MinimalTest;