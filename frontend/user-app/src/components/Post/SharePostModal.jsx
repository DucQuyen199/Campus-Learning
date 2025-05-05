import React, { useState } from 'react';
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton, 
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon
} from 'react-share';
import { ClipboardIcon, XMarkIcon } from '@heroicons/react/24/outline';
import postService from '../../services/postService';

const SharePostModal = ({ post, onClose, onShare }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/posts/${post.PostID}`;
  const shareTitle = post.Title || 'Chia sẻ bài viết';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async (platform) => {
    try {
      await postService.sharePost(post.PostID, { platform });
      onShare(post.PostID);
      onClose();
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Chia sẻ bài viết</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Post Preview */}
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="font-medium mb-2">{post.Title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{post.Content}</p>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <FacebookShareButton url={shareUrl} quote={shareTitle}>
            <div className="flex flex-col items-center">
              <FacebookIcon size={40} round />
              <span className="text-xs mt-1">Facebook</span>
            </div>
          </FacebookShareButton>

          <TwitterShareButton url={shareUrl} title={shareTitle}>
            <div className="flex flex-col items-center">
              <TwitterIcon size={40} round />
              <span className="text-xs mt-1">Twitter</span>
            </div>
          </TwitterShareButton>

          <LinkedinShareButton url={shareUrl} title={shareTitle}>
            <div className="flex flex-col items-center">
              <LinkedinIcon size={40} round />
              <span className="text-xs mt-1">LinkedIn</span>
            </div>
          </LinkedinShareButton>

          <WhatsappShareButton url={shareUrl} title={shareTitle}>
            <div className="flex flex-col items-center">
              <WhatsappIcon size={40} round />
              <span className="text-xs mt-1">WhatsApp</span>
            </div>
          </WhatsappShareButton>
        </div>

        {/* Copy Link */}
        <div className="flex items-center justify-between border rounded-lg p-3">
          <span className="text-sm text-gray-600 truncate flex-1 mr-2">
            {shareUrl}
          </span>
          <button
            onClick={handleCopyLink}
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <ClipboardIcon className="h-5 w-5 mr-1" />
            <span className="text-sm">{copied ? 'Đã sao chép' : 'Sao chép'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal; 