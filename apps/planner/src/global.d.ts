import http from 'node:http';

declare global {
  // eslint-disable-next-line no-var
  var httpServer: Promise<http.Server>;

  namespace globalThis {
    // eslint-disable-next-line no-var
    var httpServer: Promise<http.Server>;
  }
}

export {};
