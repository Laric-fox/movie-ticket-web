document.querySelectorAll('.movie-card').forEach(card => {
  card.addEventListener('click', () => {
    const id = card.dataset.id;
    window.location.href = `movie.htm?id=${id}`;
  });
});