global.httpServer = new Promise((resolve) => {
  import('../build/index.js').then((index) => resolve(index.server.server));
});
