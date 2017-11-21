# babel-plugin-mickey-model-loader

> Inject a model loader function into mickey with hmr support.

[![MIT License](https://img.shields.io/badge/license-MIT_License-green.svg?style=flat-square)](https://github.com/mickey/babel-plugin-mickey-model-loader/blob/master/LICENSE)

[![NPM Version](https://img.shields.io/npm/v/babel-plugin-mickey-model-loader.svg?style=flat-square)](https://www.npmjs.com/package/babel-plugin-mickey-model-loader)
[![Build Status](https://img.shields.io/travis/mickeyjsx/babel-plugin-mickey-model-loader.svg?style=flat)](https://travis-ci.org/mickeyjsx/babel-plugin-mickey-model-loader)
[![Dependencies](https://david-dm.org/mickey/babel-plugin-mickey-model-loader/status.svg)](https://david-dm.org/mickey/babel-plugin-mickey-model-loader)

## Install

```
npm install babel-plugin-mickey-model-loader redbox-react@1.x --save-dev
```

## Usage

Add the following section in your `.babelrc`:

```
{
  "plugins": ["mickey-model-loader", { loaderOptions: { directory: './models' } }]
}
```

Load models:

```
import React from 'react';
import createApp from 'mickey';
import SomeComponent from './SomeComponent';

const app = createApp({
  historyMode: 'hash',
});

app.load(); // default load all models from './models'
app.render(<SomeComponent />, document.getElementById('root'));
```

## app.load(pattern)

With this plugin, a handily method `load(pattern)` will be injected into `app`. 

This method will try to load models matched with `pattern` from `loaderOptions.directory` specified directory (e.g. `./models`). The `pattern` is a glob pattern matched by [minimatch](https://www.npmjs.com/package/minimatch). 

Falsely `pattern` will load all models.

## Options

 - `disableHmr` Disable any HMR. Default: `false`
 - `disableModelHmr` Disable model HMR. Default: `false`
 - `quiet` Don't output any log. Default: `false`
 - `loaderOptions` Options for `app.loader()` and these options are same as [`require.context(directory, useSubdirectories, regExp)`](https://webpack.github.io/docs/context.html#require-context)
    - `directory` The directory to match within. Default: `'./models'`
    - `useSubdirectories` A boolean flag to include or exclude subdirectories. Default: `true`
    - `regExp` A regular expression to match files against. Default: `/^\.\//`

Note: If `process.env.NODE_ENV` is `'production'`, will disable any HMR and do not output any log. This is useful for release building.


## Contributing

Pull requests and stars are highly welcome.

For bugs and feature requests, please [create an issue](https://github.com/mickey/babel-plugin-mickey-model-loader/issues/new).
