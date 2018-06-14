/* eslint-disable no-console */
/* eslint-disable brace-style */

// import chalk from 'chalk'
import getUtils from './getUtils'
import { PLUGIN_NAME } from './consts'
import defaultOptions from './defaultOptions'
import { getHmrCode, getLoaderCode } from './getInjectCode'


export default function (babel) {
  const utils = getUtils(babel)
  const cache = {}
  const modelPaths = {}

  let tipPrinted = false
  let injectedFile = null
  let injectLoaderFn = null

  return {
    visitor: {
      Program: {
        enter(path) {
          const { filename } = path.hub.file.opts
          delete cache[filename]
          injectLoaderFn = null
        },
      },
      CallExpression(path, { opts }) {
        const { filename } = path.hub.file.opts
        if ((injectedFile && injectedFile !== filename) || cache[filename]) {
          return
        }

        const { callee, arguments: args } = path.node
        const isProduction = process.env.NODE_ENV === 'production'
        const { quiet, disableModelHmr, disableHmr, loaderOptions } = {
          ...defaultOptions,
          ...opts,
        }

        const noLog = quiet && tipPrinted

        const loaderOpts = {
          ...defaultOptions.loaderOptions,
          ...loaderOptions,
        }

        /*
          Assume the following code are both in one file:
             const app = createApp({})
             app.load()
             app.model()
             app.render()
           So, we fist find the file contains `const app = createApp({})`
           Then, inject the model loader function and hmr code.
        */

        // Check `const app = createApp({})`
        // But the `connect` exported by mickey will also be `true` with following code
        // So, wo just delay the injector function call until found `app.render()`
        if (utils.isMickeyCallExpression(path.node, path.scope)) {
          const app = path.parentPath
            && path.parentPath.node
            && path.parentPath.node.id
            && path.parentPath.node.id.name
          const injectPath = path.parentPath && path.parentPath.parentPath

          if (app && injectPath) {
            const code = getLoaderCode({
              app,
              babel,
              loaderOpts,
              noLog,
              isProduction,
              disableHmr,
              disableModelHmr,
            })

            injectLoaderFn = () => {
              injectPath.insertAfter(code.ast.program.body[0])
            }
          } else {
            cache[filename] = true
          }
        }

        // check `app.model(m)`
        else if (!isProduction && utils.isModelCallExpression(callee, path.scope)) {
          const modelPath = utils.getRequirePath(args[0], path.scope)
          if (modelPath) {
            if (!modelPaths[filename]) {
              modelPaths[filename] = []
            }
            if (!modelPaths[filename].includes(modelPath)) {
              modelPaths[filename].push(modelPath)
            }
          }
        }

        // check `app.render(component, container, callback)`
        else if (utils.isRenderCallExpression(callee, path.scope)) {
          const app = callee.object.name

          if (injectLoaderFn) {
            injectLoaderFn()
            if (!noLog && !isProduction) {
              console.log()
              console.log(`[${PLUGIN_NAME}] Loader injected. Call \`${app}.load(pattern)\` load model from "${loaderOpts.directory}".`)
              tipPrinted = true
            }
          }

          if (!isProduction) {
            const paths = utils.getComponentPaths(args[0], path.scope)
            if (paths.length) {
              path.parentPath.replaceWithSourceString(getHmrCode({
                babel,
                args,
                app,
                components: paths,
                models: modelPaths[filename],
                disableHmr,
                disableModelHmr,
              }))

              if (!noLog) {
                console.log(`[${PLUGIN_NAME}] Parsed component paths: ${paths.map(item => item.path).join(' ,')}`)
                console.log()
                tipPrinted = true
              }
            } else if (!noLog) {
              // eslint-disable-next-line
              // console.log(chalk.yellow(`[${PLUGIN_NAME}] Can not parse any component path in "${filename}"`))
              // console.log()
              tipPrinted = true
            }
          }

          injectedFile = filename
          cache[filename] = true
        }
      },
    },
  }
}
