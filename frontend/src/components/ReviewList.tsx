import React from 'react';
import { Review } from '../services/reviewService';
import { StarRating } from './StarRating';
import { formatDistanceToNow } from 'date-fns';

interface ReviewListProps {
  reviews: Review[];
  emptyMessage?: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({ 
  reviews, 
  emptyMessage = "No reviews yet." 
}) => {
  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 italic">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review._id} className="border-b border-gray-100 pb-6 last:border-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">{review.buyerName}</h4>
              <StarRating rating={review.rating} size={16} />
            </div>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-gray-600 leading-relaxed">{review.comment}</p>
        </div>
      ))}
    </div>
  );
};
