import React from 'react';
import './Skeleton.css';

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, lastWidth = '60%' }) {
  return (
    <div className="skeleton-text-block">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastWidth : '100%'}
          height={14}
          style={{ marginBottom: 10 }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ height = 120 }) {
  return (
    <div className="skeleton-card">
      <Skeleton width="40%" height={12} style={{ marginBottom: 12 }} />
      <SkeletonText lines={3} />
      <Skeleton width="30%" height={10} style={{ marginTop: 16 }} />
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="message-skeleton">
      <Skeleton width={36} height={36} borderRadius={50} />
      <div style={{ flex: 1 }}>
        <Skeleton width="75%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="55%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="65%" height={14} />
      </div>
    </div>
  );
}
