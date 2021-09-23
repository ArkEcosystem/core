declare namespace prependHttp {
	interface Options {
		/**
		Prepend `https://` instead of `http://`.

		@default true
		*/
		readonly https?: boolean;
	}
}

/**
Prepend `https://` to humanized URLs like `sindresorhus.com` and `localhost`.

@param url - URL to prepend `https://` to.

@example
```
import prependHttp = require('prepend-http');

prependHttp('sindresorhus.com');
//=> 'https://sindresorhus.com'

prependHttp('localhost', {https: false});
//=> 'http://localhost'

prependHttp('https://sindresorhus.com');
//=> 'https://sindresorhus.com'
```
*/
declare function prependHttp(url: string, options?: prependHttp.Options): string;

export = prependHttp;
