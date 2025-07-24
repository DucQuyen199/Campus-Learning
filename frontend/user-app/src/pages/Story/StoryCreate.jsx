/*-----------------------------------------------------------------
* File: StoryCreate.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState } from 'react';

const StoryCreate = () => {
  const [storyTitle, setStoryTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://localhost:5004/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: storyTitle,
          content: storyContent,
        })
      });

      if (!response.ok) {
        throw new Error('Không thể tạo story');
      }

      // Success handling
      const data = await response.json();
      console.log('Story created successfully:', data);
      setStoryTitle('');
      setStoryContent('');
    } catch (err) {
      console.error('Create story error:', err);
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Create a Story</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="storyTitle">Title:</label>
          <input
            type="text"
            id="storyTitle"
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="storyContent">Content:</label>
          <textarea
            id="storyContent"
            value={storyContent}
            onChange={(e) => setStoryContent(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Story</button>
      </form>
    </div>
  );
};

export default StoryCreate;
