import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../index';
import { TrashIcon, EyeIcon, UserGroupIcon, HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { viewStory, getStoryViewers, likeStory, replyToStory } from '../../api/storyApi';
import './Story.css';

const Story = ({ story, onClose, onNext, onPrevious, onDelete, viewCount }) => {
    const [progress, setProgress] = useState(0);
    const [viewers, setViewers] = useState([]);
    const [showViewers, setShowViewers] = useState(false);
    const [loadingViewers, setLoadingViewers] = useState(false);
    const progressRef = useRef(null);
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);

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

        // Mark story as viewed using the API service
        const markAsViewed = async () => {
            try {
                await viewStory(story.StoryID);
            } catch (error) {
                console.error('Error marking story as viewed:', error);
            }
        };

        markAsViewed();

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
    
    const fetchViewers = async () => {
        if (showViewers) {
            setShowViewers(false);
            return;
        }
        
        try {
            setLoadingViewers(true);
            const response = await getStoryViewers(story.StoryID);
            setViewers(response.viewers || []);
            setShowViewers(true);
        } catch (error) {
            console.error('Error fetching viewers:', error);
        } finally {
            setLoadingViewers(false);
        }
    };
    
    const handleLike = async () => {
        try {
            const res = await likeStory(story.StoryID);
            if (res.liked) {
                setLiked(true);
            }
        } catch (error) {
            console.error('Error liking story:', error);
        }
    };

    const handleReply = async () => {
        const message = prompt('Nhập tin nhắn trả lời story:');
        if (!message) return;
        try {
            const { conversationId } = await replyToStory(story.StoryID, message);
            alert('Tin nhắn đã được gửi');
            navigate('/chat');
        } catch (error) {
            console.error('Error replying to story:', error);
            alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
        }
    };

    const isOwnStory = onDelete !== null;

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
                <div className="flex items-center space-x-2">
                    {onDelete && (
                        <button 
                            className="story-delete-btn" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            aria-label="Xóa story"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button className="story-close-btn" onClick={onClose}>×</button>
                </div>
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

            <div className="story-footer">
                <div className="story-footer-content">
                    {isOwnStory ? (
                        <>
                            <button 
                                className="story-viewers-btn"
                                onClick={fetchViewers}
                                disabled={loadingViewers}
                            >
                                {loadingViewers ? (
                                    <span className="loading-spinner"></span>
                                ) : (
                                    <>
                                        <UserGroupIcon className="w-4 h-4 mr-1" />
                                        <span>Người xem</span>
                                    </>
                                )}
                            </button>
                            <div className="story-view-count">
                                <EyeIcon className="w-4 h-4 mr-1" />
                                <span>{viewCount}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <button className="story-like-btn" onClick={handleLike} aria-label="Thả tim">
                                <HeartIcon className="w-4 h-4" />
                            </button>
                            <button className="story-reply-btn" onClick={handleReply} aria-label="Trả lời story">
                                <ChatBubbleLeftIcon className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
                
                {/* Viewers list */}
                {showViewers && (
                    <div className="story-viewers-list">
                        <div className="story-viewers-header">
                            <h4>Người xem ({viewers.length})</h4>
                            <button onClick={() => setShowViewers(false)}>×</button>
                        </div>
                        <div className="story-viewers-content">
                            {viewers.length > 0 ? (
                                viewers.map((viewer) => (
                                    <div key={viewer.ViewID} className="story-viewer-item">
                                        <Avatar
                                            src={viewer.Viewer?.Image}
                                            name={viewer.Viewer?.FullName}
                                            size="small"
                                        />
                                        <div className="story-viewer-info">
                                            <span className="story-viewer-name">{viewer.Viewer?.FullName}</span>
                                            <span className="story-viewer-time">
                                                {new Date(viewer.ViewedAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-viewers">Chưa có người xem</p>
                            )}
                        </div>
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