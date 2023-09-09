import { GlobalStyle } from './GlobalStyle';
import { Layout } from './Layout';
import React, { useState, useEffect } from 'react';
import { fetchArticlesWithQuery } from 'api/api';
import toast, { Toaster } from 'react-hot-toast';
import { Searchbar } from './Searchbar/Searchbar';
import { Button } from './Button/Button';
import { ImageGallery } from './ImageGallery/ImageGallery';
import { Modal } from './Modal/Modal';
import { Loader } from './Loader/Loader';

const getInitialQuery = () => {
  const savedSearchQuery = localStorage.getItem('search-query');
  if (savedSearchQuery !== null) {
    return JSON.parse(savedSearchQuery);
  }
  return '';
};

export const App = () => {
  const [query, setQuery] = useState(getInitialQuery);
  const [queryText, setQueryText] = useState(getInitialQuery);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [loadMore, setLoadMore] = useState(false);
  const [uniqueId, setUniqueId] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [largeImageURL, setLargeImageURL] = useState('');

  useEffect(() => {
    async function getArticles() {
      if (!query) return;
      try {
        setLoading(true);
        setError(false);
        const { hits, totalHits } = await fetchArticlesWithQuery(query, page);

        if (page > 1) {
          setImages(prevImages => [...prevImages, ...hits]);
        } else {
          if (!hits.length) {
            toast.error('Nothing found!');
            return;
          }
          setImages(hits);
          setLoadMore(true);
        }
        if (!hits.length || page >= Math.ceil(totalHits / 12)) {
          setLoadMore(false);

          toast.error('No more images!');
        }
      } catch (error) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    getArticles();
  }, [query, page, uniqueId]);

  useEffect(() => {
    localStorage.setItem('search-query', JSON.stringify(query));
  }, [query]);

  useEffect(() => {
    if (error) {
      toast.error('HTTP error!');
    }
  }, [error]);

  const handleSubmit = evt => {
    evt.preventDefault();

    setQuery(evt.target.elements.query.value);
    setImages([]);
    setPage(1);
    setLoadMore(false);
    setUniqueId(Date.now());
  };
  const changeQueryText = evt => {
    setQueryText(evt.target.value);
  };

  const handleLoadMore = () => {
    setPage(page + 1);
  };
  const openModal = largeImageURL => {
    setLargeImageURL(largeImageURL);
    setModalIsOpen(true);

    document.addEventListener('keydown', onEscKeyPress);
  };

  const closeModal = evt => {
    if (evt.target === evt.currentTarget) {
      setModalIsOpen(false);

      document.removeEventListener('keydown', onEscKeyPress);
    }
  };
  const onEscKeyPress = evt => {
    const ESC_KEY_CODE = 'Escape';
    if (evt.code === ESC_KEY_CODE) {
      closeModal();
    }
  };

  return (
    <Layout>
      <Searchbar
        onSubmit={handleSubmit}
        queryText={queryText}
        onChangeQueryText={changeQueryText}
      />
      {images.length > 0 && (
        <ImageGallery images={images} openModal={openModal} />
      )}
      {modalIsOpen && (
        <Modal largeImageURL={largeImageURL} closeModal={closeModal} />
      )}
      {loadMore && <Button onHandleLoadMore={handleLoadMore} />}
      {loading && <Loader />}
      <GlobalStyle />
      <Toaster position="top-right" reverseOrder={false} />
    </Layout>
  );
};
