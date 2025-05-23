import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Preload main CSS */}
        <link
          rel="preload"
          as="style"
          href="/_next/static/css/6d7e3aa2832ac35f.css"
          onLoad="this.rel='stylesheet'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="/_next/static/css/6d7e3aa2832ac35f.css"
          />
        </noscript>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}