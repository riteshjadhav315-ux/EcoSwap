import React, { useState } from 'react';
import { StarRating } from './StarRating';
import { addReview } from '../services/reviewService';

interface ReviewFormProps {
  productId: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  onReviewSubmitted: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  sellerId,
  buyerId,
  buyerName,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please enter a comment");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addReview({
        productId,
        sellerId,
        buyerId,
        buyerName,
        rating,
        comment,
      });
      setComment('');
      setRating(5);
      onReviewSubmitted();
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
        <StarRating 
          rating={rating} 
          interactive 
          onRatingChange={setRating} 
          size={28} 
        />
      </div>

      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Your Review
        </label>
        <textarea
          id="comment"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none"
          placeholder="Share your experience with this seller and product..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
          isSubmitting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200'
        }`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};
