// Based on the https://github.com/the-halfbloodprince/GalaxyM1199 project <3

import SimpleLightbox from 'simplelightbox';
import Galaxy from './galaxy';

window.onload = () => {
  Galaxy('#87DBFF', '#080852')();

  const lightbox = new SimpleLightbox('.feature > div > a', {
    overlay: true,
    spinner: true,
  });

  lightbox.on('show.simplelightbox', () => {
    if (umami) umami('lightbox view');
  });

  lightbox.on('changed.simplelightbox', () => {
    if (umami) umami('lightbox changed');
  });

  const btn = document.querySelector('button.mobile-menu-button');
  const menu = document.querySelector('.menu-block');

  btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });
};
