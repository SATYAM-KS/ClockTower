import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ExternalLink, TrendingUp, AlertCircle, X } from 'lucide-react';
import Header from '../components/Header';
import './News.css';
import { Tailspin } from 'ldrs/react';
import { getNews } from '../utils/api';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  location: string;
  category: 'redzone' | 'safety' | 'policy' | 'community';
  priority: 'high' | 'medium' | 'low';
  imageUrl?: string;
  url?: string;
}

const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'redzone' | 'safety' | 'policy' | 'community'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    getNews()
      .then(data => {
        const articles = data.map((article: any, index: number) => ({
          id: article.id || index.toString(),
          title: article.title,
          summary: article.summary || '',
          content: article.content || '',
          date: article.date || '',
          location: article.location || 'Unknown',
          category: article.category || 'safety',
          priority: article.priority || 'medium',
          imageUrl: article.imageUrl || '',
          url: article.url || ''
        }));
        setNews(articles);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching news:', err);
        setLoading(false);
      });
  }, []);

  const filteredNews = news.filter(item => filter === 'all' || item.category === filter);
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const currentNews = filteredNews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <TrendingUp className="text-red-500" size={16} />;
      case 'medium': return <AlertCircle className="text-yellow-500" size={16} />;
      case 'low': return <AlertCircle className="text-green-500" size={16} />;
      default: return null;
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/fallback.jpg'; // Ensure this fallback image exists in /public
  };

  return (
    <div className="news-page">
      <Header title="Daily News" />

      {/* Filter Tabs */}
      <div className="news-filter-tabs">
        {['all', 'redzone', 'safety', 'policy', 'community'].map((category) => (
          <button
            key={category}
            onClick={() => { setFilter(category as any); setCurrentPage(1); }}
            className={`news-filter-btn${filter === category ? ' news-filter-btn-active' : ''}`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Banner */}
      <div className="news-banner">
        <div className="news-banner-icon"><TrendingUp size={20} /></div>
        <div className="news-banner-content">
          <h3>BREAKING NEWS</h3>
          <p>New safety measures implemented citywide</p>
        </div>
      </div>

      {/* News List */}
      <div className="news-list">
        {loading ? (
          <div className="news-loading-spinner">
            <Tailspin size="40" stroke="5" speed="0.9" color="black" />
          </div>
        ) : currentNews.length === 0 ? (
          <div className="news-card news-card-empty">
            <div className="news-empty-icon">📰</div>
            <h3 className="news-title">No News Found</h3>
            <p className="news-summary">No news articles match your current filter.</p>
          </div>
        ) : (
          currentNews.map((item) => (
            <div key={item.id} className="news-card">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  onError={handleImageError}
                  alt={item.title}
                  className="news-image hover-zoom"
                />
              )}
              <div className="news-card-header">
                <span className={`news-category news-category-${item.category}`}>
                  {item.category.toUpperCase()}
                </span>
                {getPriorityIcon(item.priority)}
              </div>
              <h4 className="news-title">{item.title}</h4>
              <p className="news-summary">{item.summary}</p>
              <div className="news-meta">
                <div className="news-meta-item"><MapPin size={16} /> {item.location}</div>
                <div className="news-meta-item"><Calendar size={16} /> {item.date}</div>
              </div>
              <div className="news-divider"></div>
              <button className="news-read-btn hover-link" onClick={() => setSelectedArticle(item)}>
                <ExternalLink size={16} />
                <span>Read Full Article</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="news-pagination">
          <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}>
            ◀ Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages}>
            Next ▶
          </button>
        </div>
      )}

      {/* News Stats */}
      <div className="news-stats">
        <h3 className="news-stats-title">News Summary</h3>
        <div className="news-stats-grid">
          <div className="news-stats-item">
            <div className="news-stats-value news-stats-red">
              {news.filter(n => n.category === 'redzone').length}
            </div>
            <div className="news-stats-label">Red Zone Updates</div>
          </div>
          <div className="news-stats-item">
            <div className="news-stats-value news-stats-green">
              {news.filter(n => n.category === 'safety').length}
            </div>
            <div className="news-stats-label">Safety Initiatives</div>
          </div>
        </div>
      </div>

      {/* Modal for full article */}
      {selectedArticle && (
        <div className="news-modal">
          <div className="news-modal-content">
            <button 
              className="news-modal-close" 
              onClick={() => setSelectedArticle(null)}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <h2>{selectedArticle.title}</h2>
            <p><strong>Date:</strong> {selectedArticle.date}</p>
            <p><strong>Location:</strong> {selectedArticle.location}</p>
            {selectedArticle.imageUrl && (
              <img
                src={selectedArticle.imageUrl}
                onError={handleImageError}
                className="news-modal-image"
                alt="full article"
              />
            )}
            <p className="news-full-content">{selectedArticle.content}</p>
            {selectedArticle.url && (
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-modal-link hover-link"
              >
                Read on Source
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
