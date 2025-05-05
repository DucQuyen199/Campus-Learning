import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import StoryCreate from './StoryCreate';
import { Avatar } from '../index';

const StoryList = ({ orientation = 'horizontal', showTimeline = false, onStoryEnd }) => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedStory, setSelectedStory] = useState(null);
    const [viewingStory, setViewingStory] = useState(false);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const response = await fetch('/api/stories', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể tải stories');
            }

            const data = await response.json();
            setStories(data.stories || []);
        } catch (error) {
            console.error('Fetch stories error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStoryCreated = (newStory) => {
        setStories(prevStories => [newStory, ...prevStories]);
        setShowCreateForm(false);
    };

    const handleStoryClick = async (story) => {
        setSelectedStory(story);
        setViewingStory(true);

        // Mark story as viewed
        try {
            await fetch(`/api/stories/${story.StoryID}/view`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
        } catch (error) {
            console.error('Mark story as viewed error:', error);
        }
    };

    const renderStoryItem = (story) => (
        <div
            key={story.StoryID}
            onClick={() => handleStoryClick(story)}
            className="relative cursor-pointer group"
        >
            <div className="relative w-full h-40 rounded-lg overflow-hidden">
                {story.MediaType === 'image' ? (
                    <img
                        src={story.MediaUrl}
                        alt="Story"
                        className="w-full h-full object-cover"
                    />
                ) : story.MediaType === 'video' ? (
                    <video
                        src={story.MediaUrl}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center p-4"
                        style={{ backgroundColor: story.BackgroundColor || '#1d4ed8' }}
                    >
                        <p className={`text-white text-center ${story.FontStyle || 'font-sans'}`}>
                            {story.TextContent}
                        </p>
                    </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
                
                {/* User info */}
                <div className="absolute top-2 left-2 flex items-center">
                    <Avatar
                        src={story.User?.Image}
                        name={story.User?.FullName}
                        size="small"
                        className="ring-2 ring-white"
                    />
                    <span className="ml-2 text-white text-sm font-medium truncate">
                        {story.User?.FullName}
                    </span>
                </div>
                
                {/* Time */}
                <div className="absolute bottom-2 left-2 text-white text-xs">
                    {new Date(story.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {/* Create Story Form Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-lg">
                        <StoryCreate
                            onStoryCreated={handleStoryCreated}
                            onClose={() => setShowCreateForm(false)}
                        />
                    </div>
                </div>
            )}

            {/* Story Viewer Modal */}
            {viewingStory && selectedStory && (
                <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                    <button
                        onClick={() => setViewingStory(false)}
                        className="absolute top-4 right-4 text-white text-xl"
                    >
                        ×
                    </button>
                    
                    <div className="w-full max-w-lg">
                        {selectedStory.MediaType === 'image' ? (
                            <img
                                src={selectedStory.MediaUrl}
                                alt="Story"
                                className="w-full h-auto"
                            />
                        ) : selectedStory.MediaType === 'video' ? (
                            <video
                                src={selectedStory.MediaUrl}
                                className="w-full h-auto"
                                controls
                                autoPlay
                            />
                        ) : (
                            <div
                                className="w-full h-96 flex items-center justify-center p-8"
                                style={{ backgroundColor: selectedStory.BackgroundColor || '#1d4ed8' }}
                            >
                                <p className={`text-white text-2xl text-center ${selectedStory.FontStyle || 'font-sans'}`}>
                                    {selectedStory.TextContent}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stories Grid */}
            <div className={`grid gap-4 ${
                orientation === 'horizontal' ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            }`}>
                {/* Create Story Button */}
                <div
                    onClick={() => setShowCreateForm(true)}
                    className="relative cursor-pointer group"
                >
                    <div className="w-full h-40 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                <PlusIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="mt-2 text-sm font-medium text-gray-700">
                                Tạo story
                            </span>
                        </div>
                    </div>
                </div>

                {/* Story Items */}
                {loading ? (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : (
                    stories.map(story => renderStoryItem(story))
                )}
            </div>
        </div>
    );
};

export default StoryList; 