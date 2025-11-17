// components/Carousel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CarouselProps {
  images: string[];
}

export const Carousel: React.FC<CarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-lg">
      {images.map((img, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-500 ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          <img
            src={img}
            alt={`Carousel ${idx + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 md:block hidden"
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 md:block hidden"
        aria-label="Next slide"
      >
        ›
      </button>
      {/* Mobile swipe indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 md:hidden">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};