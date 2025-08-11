import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Edit3, 
  Trash2, 
  Reply, 
  User,
  Clock,
  CheckCircle,
  Code,
  HelpCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { algorithmCommentService } from '../services/algorithmCommentService';
import UserLink from './common/UserLink';
import '../styles/AlgorithmDiscussionBoard.css';

const AlgorithmDiscussionBoard = ({ algorithmId, user, algorithm }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [algorithmId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await algorithmCommentService.getComments(algorithmId);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async (content, parentId = null) => {
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }

    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      const newCommentData = await algorithmCommentService.createComment(
        algorithmId, 
        content, 
        parentId
      );
      
      if (parentId) {
        // Add reply to existing comment
        setComments(prevComments => 
          updateCommentsWithReply(prevComments, parentId, newCommentData)
        );
        setReplyingTo(null);
      } else {
        // Add new top-level comment
        setComments(prevComments => [newCommentData, ...prevComments]);
        setNewComment('');
      }
      
      toast.success('Comment posted successfully!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(error.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCommentsWithReply = (comments, parentId, newReply) => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [newReply, ...(comment.replies || [])]
        };
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentsWithReply(comment.replies, parentId, newReply)
        };
      }
      return comment;
    });
  };

  const editComment = async (commentId, content) => {
    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      const updatedComment = await algorithmCommentService.updateComment(commentId, content);
      setComments(prevComments => 
        updateCommentInList(prevComments, commentId, updatedComment)
      );
      setEditingComment(null);
      setEditContent('');
      toast.success('Comment updated successfully!');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error(error.message || 'Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCommentInList = (comments, commentId, updatedComment) => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return updatedComment;
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInList(comment.replies, commentId, updatedComment)
        };
      }
      return comment;
    });
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await algorithmCommentService.deleteComment(commentId);
      setComments(prevComments => 
        removeCommentFromList(prevComments, commentId)
      );
      toast.success('Comment deleted successfully!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(error.message || 'Failed to delete comment');
    }
  };

  const removeCommentFromList = (comments, commentId) => {
    return comments.filter(comment => {
      if (comment.id === commentId) {
        return false;
      } else if (comment.replies && comment.replies.length > 0) {
        comment.replies = removeCommentFromList(comment.replies, commentId);
      }
      return true;
    });
  };

  const formatDate = (dateString) => {
    const hasTZ = /[zZ]|[+-]\d{2}:?\d{2}$/.test(dateString);
    const parsedDate = hasTZ ? new Date(dateString) : new Date(`${dateString}Z`);

    const now = new Date();
    const diffMs = now.getTime() - parsedDate.getTime();
    const diffInSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 10) return 'just now';
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;

    return parsedDate.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <div className={`comment-item ${isReply ? 'comment-reply' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <User className="author-icon" />
          <span className="author-name">
            {comment.user_id ? (
              <UserLink userId={comment.user_id} to={`/users/${comment.user_id}`} showDetails={false} />
            ) : (
              comment.author_name
            )}
          </span>
          {comment.is_edited && (
            <span className="edited-badge">
              <Edit3 className="edited-icon" />
              edited
            </span>
          )}
        </div>
        <div className="comment-meta">
          <Clock className="time-icon" />
          <span className="comment-time">{formatDate(comment.created_at)}</span>
        </div>
      </div>

      <div className="comment-content">
        {editingComment === comment.id ? (
          <div className="edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="edit-textarea"
              rows="3"
              placeholder="Edit your comment..."
            />
            <div className="edit-actions">
              <button
                onClick={() => editComment(comment.id, editContent)}
                disabled={submitting}
                className="btn-primary btn-sm"
              >
                <CheckCircle className="btn-icon" />
                Save
              </button>
              <button
                onClick={() => {
                  setEditingComment(null);
                  setEditContent('');
                }}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-text">{comment.content}</p>
        )}
      </div>

      <div className="comment-actions">
        {user && !isReply && (
          <button
            onClick={() => setReplyingTo(comment.id)}
            className="action-btn reply-btn"
          >
            <Reply className="action-icon" />
            Reply
          </button>
        )}
        
        {user && user.id === comment.user_id && (
          <>
            <button
              onClick={() => {
                setEditingComment(comment.id);
                setEditContent(comment.content);
              }}
              className="action-btn edit-btn"
            >
              <Edit3 className="action-icon" />
              Edit
            </button>
            <button
              onClick={() => deleteComment(comment.id)}
              className="action-btn delete-btn"
            >
              <Trash2 className="action-icon" />
              Delete
            </button>
          </>
        )}
      </div>

      {replyingTo === comment.id && (
        <div className="reply-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="reply-textarea"
            rows="3"
            placeholder="Write a reply..."
          />
          <div className="reply-actions">
            <button
              onClick={() => {
                submitComment(newComment, comment.id);
                setNewComment('');
              }}
              disabled={submitting || !newComment.trim()}
              className="btn-primary btn-sm"
            >
              <Send className="btn-icon" />
              Reply
            </button>
            <button
              onClick={() => {
                setReplyingTo(null);
                setNewComment('');
              }}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-container">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="algorithm-discussion-board">
        <div className="discussion-header">
          <MessageCircle className="section-icon" />
          <h3>Discussion</h3>
        </div>
        <div className="loading-comments">
          <div className="loading-spinner"></div>
          <p>Loading discussion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="algorithm-discussion-board">
      <div className="discussion-header">
        <MessageCircle className="section-icon" />
        <h3>Discussion ({comments.length})</h3>
        <div className="discussion-context">
          <Code className="context-icon" />
          <span className="context-text">{algorithm?.name}</span>
        </div>
      </div>

      {user ? (
        <div className="new-comment-form">
          <div className="form-header">
            <User className="user-icon" />
            <span className="user-name">{user.name}</span>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="comment-textarea"
            rows="4"
            placeholder="Ask a question, share insights, or discuss this algorithm..."
          />
          <div className="form-actions">
            <button
              onClick={() => submitComment(newComment)}
              disabled={submitting || !newComment.trim()}
              className="btn-primary"
            >
              <Send className="btn-icon" />
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      ) : (
        <div className="login-prompt">
          <HelpCircle className="prompt-icon" />
          <p>Please log in to join the discussion about this algorithm</p>
        </div>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <MessageCircle className="no-comments-icon" />
            <h4>No discussion yet</h4>
            <p>Be the first to ask a question or share insights about this algorithm!</p>
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
};

export default AlgorithmDiscussionBoard;