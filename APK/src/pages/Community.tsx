import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, ThumbsUp, Share2, Send, Plus, Search } from 'lucide-react';
import Header from '../components/Header';
import './Community.css';

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  category: 'discussion' | 'safety' | 'alert' | 'question';
  isLiked: boolean;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

const Community: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [filter, setFilter] = useState<'all' | 'discussion' | 'safety' | 'alert' | 'question'>('all');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPosts([
        {
          id: '1',
          author: 'Sarah Johnson',
          avatar: '👩‍💼',
          content: 'Has anyone noticed increased police patrol in the downtown area? Feeling much safer during evening walks now.',
          timestamp: '2024-01-16T14:30:00Z',
          likes: 12,
          comments: 5,
          category: 'discussion',
          isLiked: false
        },
        {
          id: '2',
          author: 'Mike Chen',
          avatar: '👨‍💻',
          content: 'ALERT: Suspicious activity reported near Oak Street Park. Two individuals were seen checking car doors around 2 PM. Please be cautious and report if you see anything similar.',
          timestamp: '2024-01-16T13:45:00Z',
          likes: 28,
          comments: 8,
          category: 'alert',
          isLiked: true
        },
        {
          id: '3',
          author: 'Emma Davis',
          avatar: '👩‍🏫',
          content: 'Question: What are the best safety apps you recommend for solo travelers? Planning a trip and want to stay connected with family.',
          timestamp: '2024-01-16T12:20:00Z',
          likes: 7,
          comments: 12,
          category: 'question',
          isLiked: false
        },
        {
          id: '4',
          author: 'David Wilson',
          avatar: '👨‍🚒',
          content: 'Safety tip: Always let someone know your route when walking alone at night. The buddy system works even when your buddy is at home!',
          timestamp: '2024-01-16T10:15:00Z',
          likes: 34,
          comments: 3,
          category: 'safety',
          isLiked: true
        },
        {
          id: '5',
          author: 'Lisa Rodriguez',
          avatar: '👩‍⚕️',
          content: 'Thank you to everyone who helped during the emergency on Main Street yesterday. This community truly looks out for each other! 💙',
          timestamp: '2024-01-15T16:30:00Z',
          likes: 45,
          comments: 15,
          category: 'discussion',
          isLiked: false
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'discussion': return 'bg-blue-100 text-blue-800';
      case 'safety': return 'bg-green-100 text-green-800';
      case 'alert': return 'bg-red-100 text-red-800';
      case 'question': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const handlePostSubmit = () => {
    if (newPost.trim()) {
      const post: Post = {
        id: Date.now().toString(),
        author: 'You',
        avatar: '👤',
        content: newPost,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
        category: 'discussion',
        isLiked: false
      };
      setPosts([post, ...posts]);
      setNewPost('');
    }
  };

  const filteredPosts = posts.filter(post => 
    filter === 'all' || post.category === filter
  );

  if (loading) {
    return (
      <div className="community-page">
        <Header title="Community" />
        <div className="community-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="community-page">
      <Header title="Community" />
      {/* Search Bar */}
      <div className="community-search-bar">
        <Search className="community-search-icon" size={20} />
        <input
          type="text"
          placeholder="Search discussions..."
          className="community-search-input"
        />
      </div>
      {/* Filter Tabs */}
      <div className="community-filter-tabs">
        {['all', 'discussion', 'safety', 'alert', 'question'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType as any)}
            className={`community-filter-btn${filter === filterType ? ' community-filter-btn-active' : ''}`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>
      {/* New Post */}
      <div className="community-new-post">
        <div className="community-new-post-avatar">👤</div>
        <div className="community-new-post-content">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share something with the community..."
            className="community-new-post-input"
            rows={3}
          />
          <div className="community-new-post-actions">
            <button className="community-btn community-btn-post" onClick={handlePostSubmit} disabled={!newPost.trim()}>
              <Send size={16} className="community-btn-icon" /> Post
            </button>
          </div>
        </div>
      </div>
      {/* Community List */}
      <div className="community-list">
        {filteredPosts.length === 0 ? (
          <div className="community-card community-card-empty">
            <MessageCircle size={48} className="community-empty-icon" />
            <h3 className="community-title">No Posts Found</h3>
            <p className="community-message">No posts match your current filter.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="community-card">
              <div className="community-card-header">
                <span className="community-card-avatar">{post.avatar}</span>
                <div className="community-card-meta">
                  <span className="community-card-author">{post.author}</span>
                  <span className="community-card-timestamp">{formatTimestamp(post.timestamp)}</span>
                  <span className={`community-category community-category-${post.category}`}>{post.category.toUpperCase()}</span>
                </div>
              </div>
              <div className="community-card-content">{post.content}</div>
              <div className="community-actions">
                <button className={`community-btn community-btn-like${post.isLiked ? ' liked' : ''}`} onClick={() => handleLike(post.id)}>
                  <ThumbsUp size={16} /> {post.likes}
                </button>
                <button className="community-btn community-btn-comment">
                  <MessageCircle size={16} /> {post.comments}
                </button>
                <button className="community-btn community-btn-share">
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Community;