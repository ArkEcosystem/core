<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# vision

Templates rendering plugin.

[![Build Status](https://travis-ci.org/hapijs/vision.svg)](http://travis-ci.org/hapijs/vision)

**vision** decorates the [server](https://github.com/hapijs/hapi/blob/master/API.md#server),
[request](https://github.com/hapijs/hapi/blob/master/API.md#request), and
`h` response [toolkit](https://github.com/hapijs/hapi/blob/master/API.md#response-toolkit) interfaces with additional
methods for managing view engines that can be used to render templated responses.

**vision** also provides a built-in [handler](https://github.com/hapijs/hapi/blob/master/API.md#-serverdecoratetype-property-method-options) implementation for creating templated responses.

## Usage
> See also the [API Reference](./API.md)

```js
const Hapi = require('@hapi/hapi');
const Vision = require('@hapi/vision');

const server = Hapi.Server({ port: 3000 });

const provision = async () => {

    await server.register(Vision);
    await server.start();

    console.log('Server running at:', server.info.uri);
};

provision();
```

## Examples

The examples in the `examples` folder can be run with `node`.

```
git clone https://github.com/hapijs/vision.git && cd vision
npm install

node examples/handlebars
```

:point_up: That command will run the handlebars basic template.
There are three more examples in there: for helpers, layout, and partials.

Use this hierarchy to know which commands to run, e.g.
```
node examples/mustache
node examples/mustache/partials
node examples/jsx
```

```
- cms // A bare-bones Content Management System with a WYSIWYG editor
- ejs
  - layout
- handlebars
  - helpers
  - layout
  - partials
- jsx // React server-side rendering with `hapi-react-views`
- marko
- mixed // Using multiple render engines (handlebars and pug)
- mustache
  - layout
  - partials
- nunjucks
- pug
- twig
```

**vision** is compatible with most major templating engines out of the box. Engines that don't follow
the normal API pattern can still be used by mapping their API to the [**vision** API](./API.md). Some of the examples below use the `compile` and `prepare` methods which are part of the API.

### EJS

```js
const Ejs = require('ejs');
const Hapi = require('@hapi/hapi');
const Vision = require('@hapi/vision');

const server = Hapi.Server({ port: 3000 });

const rootHandler = (request, h) => {

    return h.view('index', {
        title: 'examples/ejs/templates/basic | Hapi ' + request.server.version,
        message: 'Hello Ejs!'
    });
};

const provision = async () => {

    await server.register(Vision);

    server.views({
        engines: { ejs: Ejs },
        relativeTo: __dirname,
        path: 'examples/ejs/templates/basic'
    });

    server.route({ method: 'GET', path: '/', handler: rootHandler });

    await server.start();
    console.log('Server running at:', server.info.uri);
};

provision();
```

### Handlebars
```js
const Handlebars = require('handlebars');
const Hapi = require('@hapi/hapi');
const Vision = require('@hapi/vision');

const server = Hapi.Server({ port: 3000 });

const rootHandler = (request, h) => {

    return h.view('index', {
        title: 'examples/handlebars/templates/basic | hapi ' + request.server.version,
        message: 'Hello Handlebars!'
    });
};

const provision = async () => {

    await server.register(Vision);

    server.views({
        engines: { html: Handlebars },
        relativeTo: __dirname,
        path: 'examples/handlebars/templates/basic'
    });

    server.route({ method: 'GET', path: '/', handler: rootHandler });

    await server.start();
    console.log('Server running at:', server.info.uri);
};

provision();
```

### Pug

```js
const Path = require('path');

const Hapi = require('@hapi/hapi');
const Pug = require('pug');
const Vision = require('@hapi/vision');

const server = Hapi.Server({ port: 3000 });

const rootHandler = (request, h) => {

    return h.view('index', {
        title: 'examples/pug/templates | Hapi ' + request.server.version,
        message: 'Hello Pug!'
    });
};

const provision = async () => {

    await server.register(Vision);

    server.views({
        engines: { pug: Pug },
        relativeTo: __dirname,
        path: 'examples/pug/templates',
        compileOptions: {
            // By default Pug uses relative paths (e.g. ../root.pug), when using absolute paths (e.g. include /root.pug), basedir is prepended.
            // https://pugjs.org/language/includes.html
            basedir: Path.join(__dirname, 'examples/pug/templates')
        }
    });

    server.route({ method: 'GET', path: '/', handler: rootHandler });

    await server.start();
    console.log('Server running at:', server.info.uri);
};

provision();
```

### Marko

```js
const Hapi = require('@hapi/hapi');
const Marko = require('marko');
const Vision = require('@hapi/vision');

const server = Hapi.Server({ port: 3000 });

const rootHandler = (request, h) => {

    return h.view('index', {
        title: 'examples/marko/templates | Hapi ' + request.server.version,
        message: 'Hello Marko!'
    });
};

const provision = async () => {

    await server.register(Vision);

    server.views({
        engines: {
            marko: {
                compile: (src, options) => {

                    const opts = { preserveWhitespace: true, writeToDisk: false };

                    const template = Marko.load(options.filename, opts);

                    return (context) => {

                        return template.renderToString(context);
                    };
                }
            }
        },
        relativeTo: __dirname,
        path: 'examples/marko/templates'
    });

    server.route({ method: 'GET', path: '/', handler: rootHandler });

    await server.start();
    console.log('Server running at:', server.info.uri);
};

provision();
```

### Mustache

```js
const Hapi = require('@hapi/hapi');
const Mustache = require('mustache');
const Vision = require('@hapi/vision');

const server = Hapi.Server({ port: 3000 });

const rootHandler = (request, h) => {

    return h.view('index', {
        title: 'examples/mustache/templates/basic | Hapi ' + request.server.version,
        message: 'Hello Mustache!'
    });
};

const provision = async () => {

    await server.register(Vision);

    server.views({
        engines: {
            html: {
                compile: (template) => {

                    Mustache.parse(template);

                    return (context) => {

                        return Mustache.render(template, context);
                    };
                }
            }
        },
        relativeTo: __dirname,
        path: 'examples/mustache/templates/basic'
    });

    server.route({ method: 'GET', path: '/', handler: rootHandler });

    await server.start();
    console.log('Server running at:', server.info.uri);
};

provision();
```

### Nunjucks

```js
const Hapi = require('@hapi/hapi');
const Nunjucks = require('nunjucks');
const Vision = require('@hapi/vision');

const server = Hapi.Server({ port: 3000 });

const rootHandler = (request, h) => {

    return h.view('index', {
        title: 'examples/nunjucks/templates | Hapi ' + request.server.version,
        message: 'Hello Nunjucks!'
    });
};

const provision = async () => {

    await server.register(Vision);

    server.views({
        engines: {
            html: {
                compile: (src, options) => {

                    const template = Nunjucks.compile(src, options.environment);

                    return (context) => {

                        return template.render(context);
                    };
                },

                prepare: (options, next) => {

                    options.compileOptions.environment = Nunjucks.configure(options.path, { watch : false });

                    return next();
                }
            }
        },
        relativeTo: __dirname,
        path: 'examples/nunjucks/templates'
    });

    server.route({ method: 'GET', path: '/', handler: rootHandler });

    await server.start();
    console.log('Server running at:', server.info.uri);
};

provision();
```

### Twig

```js
const Hapi = require('@hapi/hapi');
const Twig = require('twig');
const Vision = require('@hapi/vision');

const server = Hapi.Server({ port: 3000 });

const rootHandler = (request, h) => {

    return h.view('index', {
        title: 'examples/twig/templates | Hapi ' + request.server.version,
        message: 'Hello Twig!'
    });
};

const provision = async () => {

    await server.register(Vision);

    server.views({
        engines: {
            twig: {
                compile: (src, options) => {

                    const template = Twig.twig({ id: options.filename, data: src });

                    return (context) => {

                        return template.render(context);
                    };
                }
            }
        },
        relativeTo: __dirname,
        path: 'examples/twig/templates'
    });

    server.route({ method: 'GET', path: '/', handler: rootHandler });

    await server.start();
    console.log('Server running at:', server.info.uri);
};

provision();
```
