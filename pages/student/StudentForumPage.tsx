
import React, { useState, useEffect, useCallback } from 'react';
import { ForumPost, ForumReply } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { UsersIcon, PlusIcon, ArrowRightIcon, ChatBubbleIcon } from '../../assets/icons';

const API_URL = 'http://localhost:3001/api';

const StudentForumPage: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [newPostData, setNewPostData] = useState({ title: '', content: '', tags: '' });
  const [newReplyContent, setNewReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [posting, setPosting] = useState(false); // For post/reply submission
  
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/forum/posts`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch forum posts.');
      const data: ForumPost[] = await response.json();
      // Server now sorts and adds repliesCount
      setPosts(data);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load posts.' });
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  const fetchReplies = useCallback(async (postId: string) => {
    setLoadingReplies(true);
    try {
      const response = await fetch(`${API_URL}/forum/posts/${postId}/replies`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch replies.');
      const data: ForumReply[] = await response.json();
      // Server now sorts replies by createdAt
      setReplies(data);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load replies.' });
      setReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  }, [getAuthHeaders, addToast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleViewPost = (post: ForumPost) => {
    setSelectedPost(post);
    fetchReplies(post.id);
  };

  const handleCreatePost = async () => {
    if (!newPostData.title || !newPostData.content) {
      addToast({ type: 'warning', message: 'Title and content are required for a new post.' });
      return;
    }
    setPosting(true);
    try {
      const payload = { 
        title: newPostData.title, 
        content: newPostData.content,
        tags: newPostData.tags ? newPostData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };
      const response = await fetch(`${API_URL}/forum/posts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create post.');
      }
      addToast({ type: 'success', message: 'Post created successfully!' });
      fetchPosts(); // Refresh post list
      setIsPostModalOpen(false);
      setNewPostData({ title: '', content: '', tags: '' });
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setPosting(false);
    }
  };

  const handleCreateReply = async () => {
    if (!selectedPost || !newReplyContent) {
      addToast({ type: 'warning', message: 'Reply content cannot be empty.' });
      return;
    }
    setPosting(true);
    try {
      const response = await fetch(`${API_URL}/forum/posts/${selectedPost.id}/replies`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: newReplyContent }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to add reply.');
      }
      addToast({ type: 'success', message: 'Reply added successfully!' });
      fetchReplies(selectedPost.id); // Refresh replies for current post
      // Also update repliesCount on the main post list if possible, or re-fetch posts
      const updatedPosts = posts.map(p => p.id === selectedPost.id ? {...p, repliesCount: (p.repliesCount || 0) + 1} : p);
      setPosts(updatedPosts);

      setIsReplyModalOpen(false);
      setNewReplyContent('');
    } catch (error: any) {
      addToast({ type: 'error', message: error.message });
    } finally {
      setPosting(false);
    }
  };

  const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "just now";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  if (selectedPost) {
    return (
      <div className="container mx-auto p-4 sm:p-6 animate-fadeIn">
        <Button onClick={() => setSelectedPost(null)} variant="ghost" className="mb-4 text-sm text-primary-600 dark:text-primary-400 hover:underline">&larr; Back to All Posts</Button>
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-300 mb-2">{selectedPost.title}</h1>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">By: <span className="font-medium text-secondary-700 dark:text-secondary-200">{selectedPost.studentName || 'Unknown User'}</span> &bull; {timeSince(selectedPost.createdAt)}</p>
           {selectedPost.tags && selectedPost.tags.length > 0 && (
            <div className="mb-4">
                {selectedPost.tags.map(tag => <span key={tag} className="text-xs bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full mr-1">{tag}</span>)}
            </div>
          )}
          <p className="text-secondary-700 dark:text-secondary-200 whitespace-pre-wrap mb-6 prose dark:prose-invert max-w-none">{selectedPost.content}</p>
          
          <hr className="my-6 border-secondary-200 dark:border-secondary-700"/>
          <h2 className="text-xl font-semibold text-secondary-800 dark:text-dark-text mb-4">Replies ({replies.length})</h2>
          {loadingReplies ? <p className="dark:text-secondary-400">Loading replies...</p> : (
            replies.length > 0 ? (
              <ul className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {replies.map(reply => (
                  <li key={reply.id} className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg shadow-sm">
                    <p className="text-sm text-secondary-700 dark:text-secondary-200 whitespace-pre-wrap">{reply.content}</p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2 text-right">By: <span className="font-medium text-secondary-700 dark:text-secondary-200">{reply.studentName || 'Unknown User'}</span> &bull; {timeSince(reply.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-secondary-500 dark:text-secondary-400">No replies yet. Be the first to respond!</p>
          )}
          <Button onClick={() => setIsReplyModalOpen(true)} variant="primary" className="mt-6" leftIcon={<PlusIcon className="w-4 h-4"/>} disabled={posting}>Add Reply</Button>
        </div>
        <Modal isOpen={isReplyModalOpen} onClose={() => setIsReplyModalOpen(false)} title={`Reply to: ${selectedPost.title}`}>
            <textarea 
                value={newReplyContent} 
                onChange={(e) => setNewReplyContent(e.target.value)}
                rows={5}
                className="w-full p-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-dark-text placeholder-secondary-400 dark:placeholder-secondary-500"
                placeholder="Write your reply..."
            />
            <div className="flex justify-end mt-4">
                <Button onClick={handleCreateReply} variant="primary" disabled={posting || !newReplyContent.trim()}>
                    {posting ? 'Posting Reply...' : 'Post Reply'}
                </Button>
            </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center"><UsersIcon className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />Student Discussion Forum</h1>
        <Button onClick={() => setIsPostModalOpen(true)} variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>}>Create New Post</Button>
      </div>

      {loading ? (
         <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">Loading posts...</p>
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6 hover:shadow-xl dark:hover:shadow-primary-500/30 transition-shadow duration-300 transform hover:scale-[1.02] animate-fadeIn">
              <h2 className="text-xl font-semibold text-primary-700 dark:text-primary-300 mb-1 hover:underline cursor-pointer" onClick={() => handleViewPost(post)}>{post.title}</h2>
              <div className="flex items-center text-xs text-secondary-500 dark:text-secondary-400 mb-2">
                <span>By: <span className="font-medium text-secondary-700 dark:text-secondary-200">{post.studentName || 'Unknown User'}</span></span>
                <span className="mx-1.5">&bull;</span>
                <span>{timeSince(post.createdAt)}</span>
                <span className="mx-1.5">&bull;</span>
                <span className="flex items-center"><ChatBubbleIcon className="w-3.5 h-3.5 mr-1"/> {post.repliesCount || 0}</span>
              </div>
               {post.tags && post.tags.length > 0 && (
                <div className="mb-3">
                    {post.tags.map(tag => <span key={tag} className="text-xs bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full mr-1">{tag}</span>)}
                </div>
              )}
              <p className="text-sm text-secondary-600 dark:text-secondary-300 line-clamp-2 mb-3">{post.content}</p>
              <Button variant="ghost" size="sm" onClick={() => handleViewPost(post)} rightIcon={<ArrowRightIcon className="w-4 h-4"/>} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">Read More & Reply</Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white dark:bg-dark-card rounded-xl shadow-md">
          <UsersIcon className="w-16 h-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">No Discussions Yet</h2>
          <p className="text-secondary-500 dark:text-secondary-400 mt-2">Be the first to start a conversation!</p>
        </div>
      )}

      <Modal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} title="Create New Forum Post">
        <Input 
            label="Post Title" 
            value={newPostData.title} 
            onChange={(e) => setNewPostData(prev => ({...prev, title: e.target.value}))} 
            placeholder="Enter a catchy title"
            required
        />
        <label htmlFor="postContent" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mt-4 mb-1">Content</label>
        <textarea 
            id="postContent"
            value={newPostData.content} 
            onChange={(e) => setNewPostData(prev => ({...prev, content: e.target.value}))}
            rows={8}
            className="w-full p-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-dark-text placeholder-secondary-400 dark:placeholder-secondary-500"
            placeholder="Share your thoughts, questions, or ideas..."
            required
        />
        <Input 
            label="Tags (Optional, comma-separated)" 
            value={newPostData.tags} 
            onChange={(e) => setNewPostData(prev => ({...prev, tags: e.target.value}))} 
            placeholder="e.g., math, homework-help, study-group"
            containerClassName="mt-4"
        />
        <div className="flex justify-end mt-4 space-x-2">
            <Button variant="secondary" onClick={() => setIsPostModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePost} variant="primary" disabled={posting || !newPostData.title.trim() || !newPostData.content.trim()}>
                {posting ? 'Creating Post...' : 'Create Post'}
            </Button>
        </div>
      </Modal>
    </div>
  );
};

export default StudentForumPage;
