# babel-plugin-mickey-model-loader

> Inject a model loader function into mickey with hmr support.

[![MIT License](https://img.shields.io/badge/license-MIT_License-green.svg?style=flat-square)](https://github.com/mickey/babel-plugin-mickey-model-loader/blob/master/LICENSE)

[![NPM Version](https://img.shields.io/npm/v/babel-plugin-mickey-model-loader.svg?style=flat-square)](https://www.npmjs.com/package/babel-plugin-mickey-model-loader)
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

Load your models:

```
import React from 'react';
import createApp from 'mickey';
import Routers from './router';

const app = createApp({
  historyMode: 'hash',
});

app.load(); // default load all models in './models'
app.render(<Routers />, document.getElementById('root'));
```

## app.load(pattern)

With this plugin, a handily method `load(pattern)` will be injected to `app`. 

This method will try into load models match with `pattern` from `loaderOptions.directory` specified directory(e.g. `./models`). And `pattern` is a glob expression hand by [minimatch](https://www.npmjs.com/package/minimatch). 

Falsely `pattern` will load all models.


## Options

 - `disableHmr` Disable any Hmr. Default: `false`
 - `disableModelHmr` Disable model HMR. Default: `false`
 - `quiet` Don't output any log. Default: `false`
 - `loaderOptions` Options for `app.loader()` and these options are same as [`require.context(directory, useSubdirectories, regExp)`](https://webpack.github.io/docs/context.html#require-context)
    - `directory` The directory to match within. Default: `'./models'`
    - `useSubdirectories` A boolean flag to include or exclude subdirectories. Default: `true`
    - `regExp` A regular expression to match files against. Default: `/^\.\//`


## Contributing

Pull requests and stars are highly welcome.

For bugs and feature requests, please [create an issue](https://github.com/mickey/babel-plugin-mickey-model-loader/issues/new).