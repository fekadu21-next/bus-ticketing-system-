import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ImageCarousel = ({
  images = [],
  interval = 5000,
  className = '',
  children,
}) => {
  const total = images.length;
  if (!images || total === 0) return null;

  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [direction, setDirection] = useState('next');
  const [isPaused, setIsPaused] = useState(false);

  const animTimerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Preload all carousel images into browser cache immediately
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  // Clean transition to next slide (always forward horizontally from right to left)
  const goToNext = useCallback(() => {
    if (total <= 1) return;
    clearTimeout(animTimerRef.current);
    setDirection('next');
    setCurrent((curr) => {
      const nextIdx = (curr + 1) % total;
      setPrev(curr);
      animTimerRef.current = setTimeout(() => {
        setPrev(null);
      }, 700);
      return nextIdx;
    });
  }, [total]);

  // Clean transition to previous slide (from left to right)
  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    clearTimeout(animTimerRef.current);
    setDirection('prev');
    setCurrent((curr) => {
      const prevIdx = (curr - 1 + total) % total;
      setPrev(curr);
      animTimerRef.current = setTimeout(() => {
        setPrev(null);
      }, 700);
      return prevIdx;
    });
  }, [total]);

  // Direct dot navigation
  const goToSlide = (targetIdx) => {
    if (total <= 1 || targetIdx === current) return;
    clearTimeout(animTimerRef.current);
    const dir = targetIdx > current ? 'next' : 'prev';
    setDirection(dir);
    setPrev(current);
    setCurrent(targetIdx);
    animTimerRef.current = setTimeout(() => {
      setPrev(null);
    }, 700);
  };

  // Automatic 5-second slide timer with tab visibility pause
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    let timer = null;

    const startTimer = () => {
      clearInterval(timer);
      timer = setInterval(() => {
        goToNext();
      }, interval);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        startTimer();
      }
    };

    startTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(animTimerRef.current);
    };
  }, [total, interval, isPaused, goToNext]);

  // Mobile swipe gestures
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      goToNext();
    } else if (diff < -45) {
      goToPrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      className={`relative w-full overflow-hidden select-none bg-slate-900 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero background carousel"
      role="region"
    >
      {/* CSS Keyframes for smooth, glitch-free horizontal transitions */}
      <style>{`
        @keyframes carouselSlideInNext {
          0% { transform: translate3d(100%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes carouselSlideOutNext {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
        @keyframes carouselSlideInPrev {
          0% { transform: translate3d(-100%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes carouselSlideOutPrev {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(100%, 0, 0); }
        }
      `}</style>

      {/* 1. Outgoing slide during transition */}
      {prev !== null && prev !== current && (
        <div
          key={`prev-slide-${prev}-${direction}`}
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{
            animation:
              direction === 'next'
                ? 'carouselSlideOutNext 700ms cubic-bezier(0.25, 1, 0.5, 1) forwards'
                : 'carouselSlideOutPrev 700ms cubic-bezier(0.25, 1, 0.5, 1) forwards',
            zIndex: 10,
          }}
        >
          <img
            src={images[prev]}
            alt="Bus journey"
            className="w-full h-full object-cover object-center pointer-events-none"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/60 pointer-events-none" />
        </div>
      )}

      {/* 2. Active slide (always present - never black) */}
      <div
        key={`curr-slide-${current}-${direction}`}
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{
          animation:
            prev !== null
              ? direction === 'next'
                ? 'carouselSlideInNext 700ms cubic-bezier(0.25, 1, 0.5, 1) forwards'
                : 'carouselSlideInPrev 700ms cubic-bezier(0.25, 1, 0.5, 1) forwards'
              : 'none',
          transform: prev === null ? 'translate3d(0, 0, 0)' : undefined,
          zIndex: 20,
        }}
      >
        <img
          src={images[current]}
          alt="Bus journey"
          className="w-full h-full object-cover object-center pointer-events-none"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/60 pointer-events-none" />
      </div>

      {/* Floating Prev / Next Navigation Arrows */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-[#f43f5e] text-white border border-white/20 hover:border-[#f43f5e] flex items-center justify-center transition-all duration-300 shadow-xl backdrop-blur-md hover:scale-110 focus:outline-none cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={goToNext}
            aria-label="Next slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-[#f43f5e] text-white border border-white/20 hover:border-[#f43f5e] flex items-center justify-center transition-all duration-300 shadow-xl backdrop-blur-md hover:scale-110 focus:outline-none cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Content wrapper over the background images */}
      <div className="relative z-20 w-full h-full pointer-events-auto flex items-start">
        {children}
      </div>

      {/* Slide Indicators matching Navbar rose-pink theme */}
      {total > 1 && (
        <div className="absolute bottom-4 right-5 sm:right-8 z-30 flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-xl">
          <div className="flex items-center gap-1.5">
            {images.map((_, index) => {
              const isActive = index === current;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToSlide(index)}
                  aria-label={`Jump to image ${index + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
                    isActive
                      ? 'w-6 bg-[#f43f5e] shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      : 'w-2 bg-white/40 hover:bg-white/80'
                  }`}
                />
              );
            })}
          </div>

          <span className="text-[11px] font-mono font-bold text-slate-300 border-l border-white/15 pl-2.5">
            0{current + 1} / 0{total}
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;