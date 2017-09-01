# babel-plugin-mickey-model-loader

> Inject a model loader function into mickey with hmr support.

## Install

```
npm install babel-plugin-mickey-model-loader redbox-react@1.x --save-dev
```

## Usage

Add the following section in your `.babelrc`:

```
{
  "plugins": ["mickey-model-loader"]
}
```

Then you can load your models as:

## Options

 - `disableHmr` Disable any Hmr. Default: `false`
 - `disableModelHmr` Disable model HMR. Default: `false`
 - `quiet` Don't output any log. Default: `false`
 - `loaderOptions` Options for `app.loader()` and these options are same as `[require.context(directory, useSubdirectories, regExp)](https://webpack.github.io/docs/context.html#require-context)` 
    - `directory` The directory to match within. Default: `'./models'`
    - `useSubdirectories` A boolean flag to include or exclude subdirectories. Default: `true`
    - `regExp` A regular expression to match files against. Default: `/^\.\//`,