import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showText?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  interactive = false,
  onRatingChange,
  showText = false,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      const isFull = i <= Math.floor(displayRating);
      const isHalf = !isFull && i <= Math.ceil(displayRating) && displayRating % 1 !== 0;

      stars.push(
        <span
          key={i}
          className={`${interactive ? 'cursor-pointer transition-transform hover:scale-110' : ''}`}
          onClick={() => interactive && onRatingChange?.(i)}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(null)}
        >
          {isFull ? (
            <Star size={size} className="fill-yellow-400 text-yellow-400" />
          ) : isHalf ? (
            <div className="relative">
              <Star size={size} className="text-gray-300" />
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star size={size} className="fill-yellow-400 text-yellow-400" />
              </div>
            </div>
          ) : (
            <Star size={size} className="text-gray-300" />
          )}
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">{renderStars()}</div>
      {showText && (
        <span className="text-sm font-medium text-gray-600 ml-1">
          ({rating.toFixed(1)}/5)
        </span>
      )}
    </div>
  );
};
