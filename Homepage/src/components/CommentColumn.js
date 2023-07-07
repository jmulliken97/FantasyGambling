import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { WindowSizeContext } from '../homefeed';
import './components.css';

const CommentColumn = ({ selectedPick }) => {
  const [comments, setComments] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState(null);
  const user = Cookies.get('username');
  const { windowWidth, showOverlay, setShowOverlay } = useContext(WindowSizeContext);

  useEffect(() => {
    const newSocket = new WebSocket('wss://merlunietest.com');
    setSocket(newSocket);

    newSocket.onmessage = (event) => {
      const comment = JSON.parse(event.data);
      setComments(prevComments => ({
        ...prevComments,
        [comment.pick_id]: [...(prevComments[comment.pick_id] || []), comment],
      }));
    };

    console.log('Username from cookie:', user);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (windowWidth <= 750 && selectedPick) {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [windowWidth, selectedPick, setShowOverlay]);

  useEffect(() => {
    const fetchComments = async () => {
      if (selectedPick) {
        try {
          const response = await axios.get(`https://merlunietest.com/comments/${selectedPick.id}`);
          console.log(response.data);
          setComments((prevComments) => ({
            ...prevComments,
            [selectedPick.id]: response.data.comments,
          }));
        } catch (error) {
          console.error('Error fetching comments:', error);
        }
      }
    };
    fetchComments();
  }, [selectedPick]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleCommentSubmit = async (pickId, comment) => {
    try {
      await axios.post('https://merlunietest.com/comment', { pick_id: pickId, comment }, { withCredentials: true });
      setComments(prevComments => ({
        ...prevComments,
        [pickId]: [...(prevComments[pickId] || []), { user, text: comment }],
      }));

      setInputValue('');
  
      // Adding the username to the data sent through the socket
      const newComment = { user, text: comment, pick_id: pickId };
      socket.send(JSON.stringify(newComment));
  
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };
  
  const renderComments = () => (
    <>
      {comments[selectedPick.id]?.length > 0 ? (
        comments[selectedPick.id].map((comment, index) => (
          <div key={index} className="comment">
            <strong>{comment.user}</strong>: {comment.text}
          </div>
        ))
      ) : (
        <p>No comments available for this pick.</p>
      )}
      <form onSubmit={(e) => {
        e.preventDefault();
        handleCommentSubmit(selectedPick.id, inputValue);
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Write a comment..."
        />
        <button type="submit">Post</button>
      </form>
    </>
  );

  return (
    <>
      {showOverlay && (
        <div 
          className="overlay"
          onClick={() => setShowOverlay(false)}
        >
          <div 
            className="overlay-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button onClick={() => setShowOverlay(false)}>Close</button>
            {selectedPick && <h2>Pick ID: {selectedPick.id}</h2>}
            {selectedPick && renderComments()}
          </div>
        </div>
      )}
      <div className={`comment-column responsive-comment-column ${showOverlay ? 'hidden' : ''}`}>
        {selectedPick && <h2>Pick ID: {selectedPick.id}</h2>}
        {selectedPick && renderComments()}
      </div>
    </>
  );
};

export default CommentColumn;




