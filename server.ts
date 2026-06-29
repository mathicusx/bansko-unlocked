import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import { render } from '@netlify/angular-runtime/common-engine.mjs';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// Netlify SSR entry point. The Netlify runtime imports this export and invokes
// it for every request that isn't a static asset. Local dev still uses the
// Express server in app() below — those two code paths are independent.
const netlifyCommonEngine = new CommonEngine();

export async function netlifyCommonEngineHandler(
  request: Request,
  context: any,
): Promise<Response> {
  return await render(netlifyCommonEngine);
}

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Serve sitemap.xml at /map/sitemap.xml
  server.get('/map/sitemap.xml', (req, res) => {
    const sitemapPath = join(browserDistFolder, 'sitemap.xml');
    res.setHeader('Content-Type', 'application/xml');
    res.sendFile(sitemapPath);
  });

  // Serve static files from /browser
  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
  }));

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

export default bootstrap;
