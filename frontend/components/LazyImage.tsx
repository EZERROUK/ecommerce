import React from 'react';

export type LazyImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading'> & {
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
};

export const LazyImage: React.FC<LazyImageProps> = ({
  decoding = 'async',
  loading = 'lazy',
  fetchPriority,
  ...props
}) => {
  return (
    <img
      {...props}
      decoding={decoding}
      loading={loading}
      // React supporte cet attribut (camelCase) sur <img>
      fetchPriority={fetchPriority}
    />
  );
};
