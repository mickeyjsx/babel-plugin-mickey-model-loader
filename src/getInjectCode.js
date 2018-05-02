import generate from '@babel/generator'
import { PLUGIN_NAME } from './consts'

function transformCode({ transform }, code, returnCode) {
  const ret = transform(code, {
    ast: true,
    code: true,
    babelrc: false,
    presets: [
      '@babel/preset-env',
      '@babel/preset-react',
    ],
  })

  const tc = ret.code
    .replace(/;$/g, '')
    .replace(/^(['"])use strict\1;/g, '')
    .trim()


  return returnCode ? tc : {
    ...ret,
    code: tc,
  }
}

function getRenderArgs(babel, args) {
  // app.render(<Router />, document.getElementById('root'), callback)
  return args.map((arg) => {
    const { code } = generate(arg)
    return transformCode(babel, code, true)
  })
}

function getComponentHmrCode(babel, app, paths, args, disableHMR) {
  const imports = paths.map(({ code }) => code).join('\n')
  const [component, container, callback] = getRenderArgs(babel, args)
  const renderFn = callback
    ? `${app}.render(${component}, ${container}, ${callback})`
    : `${app}.render(${component}, ${container})`

  const renderFnCode = `
    let render = () => {
      ${transformCode(babel, imports, true)}
      ${transformCode(babel, renderFn, true)}
    }
  `

  const hmrCode = `
    if (module.hot) {
      const renderNormally = render
      const renderException = (error) => {
        const RedBox = require('redbox-react').default
        const ReactDOM = require('react-dom')
        ReactDOM.render(React.createElement(RedBox, { error: error }), ${container})
      }

      render = () => {
        try {
          renderNormally()
        } catch (error) {
          console.error('error', error) // eslint-disable-line
          renderException(error)
        }
      }

      module.hot.accept([${paths.map(({ path }) => `'${path}'`).join(' ,')}], () => {
        render()
      })
    }
  `

  return `
    ${renderFnCode}
    ${disableHMR ? '' : hmrCode}
    render();
  `
}

function getModelHmrCode(app, modelPaths, disabled) {
  if (!disabled && modelPaths && modelPaths.length) {
    const vars = `
      const injectMode = ${app}.mode
      const utils = require('mickey/lib/utils')
    `
    const code = modelPaths.map(path => `
      module.hot.accept('${path}', () => {
        try {
          const model = require('${path}').default;
          ${app}.model(model)
          console.log('[${PLUGIN_NAME}] Model "${path}" updated.')
        } catch(e) {
          console.error(e) // eslint-disable-line
        }
      })
    `).join('\n')

    return `
      // hmr for models that loaded with app.model(m)
      (function() {
        ${vars}
        if (module.hot) {
          ${code}
        }
      })()
    `
  }

  return ''
}

export function getHmrCode({
  babel,
  app,
  components = [],
  models = [],
  args = [],
  disableHmr,
  disableModelHmr,
}) {
  return `
    (function() {
      ${getComponentHmrCode(babel, app, components, args, disableHmr, disableHmr)}
      ${getModelHmrCode(app, models, disableHmr || disableModelHmr)}
    })()
  `
}

export function getLoaderCode({
  babel,
  app,
  loaderOpts,
  quiet,
  isProduction,
  disableHmr,
  disableModelHmr,
}) {
  const { directory, useSubdirectories, regExp } = loaderOpts
  const loaderCode = `
    const utils = require('mickey/lib/utils')
    const context = require.context('${directory}', ${useSubdirectories}, ${regExp})
    const files = context.keys();
    const modelMap = {}

    ${app}.load = function(pattern) {
      const fileList = pattern ? utils.minimatch.match(files, pattern) : files;

      fileList.forEach(path => {
        const raw = context(path).default;
        const model = utils.asign({}, raw, { namespace: utils.getNamespaceFromPath(path) })
        modelMap[path] = raw
        ${app}.model(model)
      })
    };
  `

  const injectorLogCode = quiet || isProduction
    ? ''
    : `console.log('[${PLUGIN_NAME}] Loader injected. Call \`${app}.load(pattern)\` load model from "${directory}".')`

  const modelLogCode = quiet || isProduction
    ? ''
    : `console.log('[${PLUGIN_NAME}] Model "${directory}/' + fixedPath + '" updated.')`

  const hmrCode = isProduction || disableHmr || disableModelHmr ? '' : `
    if (module.hot) {
      module.hot.accept(context.id, () => {
        try {
          const hmrContext = require.context('${directory}', ${useSubdirectories}, ${regExp})
          hmrContext.keys()
            .filter(path => modelMap[path])
            .map(path => [path, hmrContext(path).default])
            .filter(item => modelMap[item[0]] !== item[1])
            .forEach(item => {
              const path = item[0]
              const raw = item[1]
              const model = utils.asign({}, raw, { namespace: utils.getNamespaceFromPath(path) })

              let fixedPath = path
              if(path[0] === '.'){
                fixedPath = path.split('/').slice(1).join('/')
              }

              modelMap[path] = raw
              ${app}.model(model)
              ${modelLogCode}
            })
        } catch (e) {
          console.error(e) // eslint-disable-line
        }
      })
    }
  `
  const code = `
    // Generated by [${PLUGIN_NAME}]
    (function() {
      ${loaderCode}
      ${injectorLogCode}
      ${hmrCode}
    })()
  `
  return transformCode(babel, code)
}

