import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Avatar } from '../index';
import './Story.css';

const Story = ({ story, onClose, onNext, onPrevious }) => {
    const [progress, setProgress] = useState(0);
    const progressRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    onNext?.();
                    return 100;
                }
                return prev + (100 / (story.Duration || 15));
            });
        }, 1000);

        // Mark story as viewed
        axios.post(`/api/stories/${story.StoryID}/view`);

        return () => clearInterval(timer);
    }, [story.StoryID, story.Duration, onNext]);

    const handleClick = (e) => {
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = (x / width) * 100;
        setProgress(percentage);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowRight') {
            onNext?.();
        } else if (e.key === 'ArrowLeft') {
            onPrevious?.();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onPrevious, onClose]);

    return (
        <div className="story-container">
            <div className="story-header">
                <div className="story-user-info">
                    <Avatar
                        src={story.User?.Image}
                        name={story.User?.FullName}
                        size="small"
                        className="ring-2 ring-white"
                    />
                    <span className="story-username">{story.User?.FullName}</span>
                </div>
                <button className="story-close-btn" onClick={onClose}>×</button>
            </div>

            <div className="story-progress-container" ref={progressRef} onClick={handleClick}>
                <div 
                    className="story-progress-bar"
                    style={{ width: `${progress}%` }}
                />
            </div>
            
            <div className="story-content" style={{ backgroundColor: story.BackgroundColor }}>
                {story.MediaType === 'image' && (
                    <img 
                        src={story.MediaUrl} 
                        alt="Story" 
                        className="story-media"
                    />
                )}
                {story.MediaType === 'video' && (
                    <video 
                        src={story.MediaUrl} 
                        className="story-media"
                        autoPlay
                        loop
                        muted
                    />
                )}
                {story.TextContent && (
                    <div className="story-text">
                        {story.TextContent}
                    </div>
                )}
            </div>

            <div className="story-navigation">
                <button className="story-nav-btn story-nav-prev" onClick={onPrevious} />
                <button className="story-nav-btn story-nav-next" onClick={onNext} />
            </div>
        </div>
    );
};

export default Story; 