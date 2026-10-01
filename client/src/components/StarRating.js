import React from 'react';
import '../styles/StarRating.css';

function StarRating({ value, onChange, readOnly = false }) {
  return (
    <span className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= value ? 'filled' : ''} ${readOnly ? '' : 'clickable'}`}
          onClick={readOnly ? undefined : () => onChange(star)}
        >
          {star <= value ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

export default StarRating;
