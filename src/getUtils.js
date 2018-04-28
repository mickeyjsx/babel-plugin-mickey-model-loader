import generate from '@babel/generator'

export default function getUtils(babel) {
  const { types: t } = babel

  function getDeclarator(declarations, identifierName) {
    for (let i = 0, l = declarations.length; i < l; i += 1) {
      const d = declarations[i]
      if (t.isIdentifier(d.id) && d.id.name === identifierName) {
        return d
      }
    }
    return null
  }

  function getBinding(_scope, identifierName, withFinalScope) {
    let scope = _scope
    let binding = scope && scope.bindings[identifierName]
    while (!binding && scope) {
      scope = scope.parent
      binding = scope && scope.bindings[identifierName]
    }

    return withFinalScope
      ? {
        binding,
        scope,
      }
      : binding
  }

  function isRequire(node) {
    return t.isCallExpression(node)
      && t.isIdentifier(node.callee)
      && node.callee.name === 'require'
  }

  function getImportRequirePath(scope, identifierName) {
    // identifierName: 'createApp', such as: `import createApp from 'mickey';`
    if (scope.hasBinding(identifierName)) {
      const binding = getBinding(scope, identifierName)
      if (binding) {
        const parent = binding.path.parent
        if (t.isImportDeclaration(parent)) {
          return parent.source.value
        } else if (t.isVariableDeclaration(parent)) {
          const declarator = getDeclarator(parent.declarations, identifierName)
          if (declarator && isRequire(declarator.init)) {
            return declarator.init.arguments[0].value
          }
        }
      }
    }
    return null
  }

  function getRequirePath(node, scope) {
    if (node) {
      switch (node.type) {
        case 'CallExpression':
          if (t.isLiteral(node.arguments[0])) {
            return node.arguments[0].value
          }
          break
        case 'Identifier': {
          const path = getImportRequirePath(scope, node.name)
          if (path) {
            return path
          }
          break
        }
        default:
          break
      }
    }

    return null
  }

  function isMickeyCallExpression(node, scope) {
    return t.isCallExpression(node)
      && t.isIdentifier(node.callee)
      && getImportRequirePath(scope, node.callee.name) === 'mickey'
  }

  function isMickeyInstance(_scope, identifierName) {
    // identifierName: 'app', such as: `const app = createApp({});`
    if (_scope.hasBinding(identifierName)) {
      const { binding, scope } = getBinding(_scope, identifierName, true)
      if (binding) {
        const parent = binding.path.parent
        if (t.isVariableDeclaration(parent)) {
          const declarator = getDeclarator(parent.declarations, identifierName)
          if (declarator && isMickeyCallExpression(declarator.init, scope)) {
            return true
          }
        }
      }
    }
    return false
  }

  function isMethodCall(node, scope, methodName) {
    if (!t.isMemberExpression(node)) {
      return false
    }

    const object = node.object
    const property = node.property

    return t.isIdentifier(property)
      && t.isIdentifier(object)
      && property.name === methodName
      && isMickeyInstance(scope, object.name)
  }

  function isModelCallExpression(node, scope) {
    return isMethodCall(node, scope, 'model')
  }

  function isRenderCallExpression(node, scope) {
    return isMethodCall(node, scope, 'render')
  }

  function getComponentPaths(component, scope, paths = []) {
    const { openingElement, children } = component
    const { name: node } = openingElement
    if (node && t.isJSXIdentifier(node) && node.name) {
      const identifierName = node.name
      if (scope.hasBinding(identifierName)) {
        const binding = getBinding(scope, identifierName)
        if (binding) {
          let componentPath
          const parent = binding.path.parent
          // ast to code
          const raw = generate(parent)
          if (t.isImportDeclaration(parent)) {
            componentPath = parent.source.value
          } else if (t.isVariableDeclaration(parent)) {
            const declarator = getDeclarator(parent.declarations, identifierName)
            if (declarator && isRequire(declarator.init)) {
              componentPath = declarator.init.arguments[0].value
            }
          }

          // collect relative path
          if (componentPath && componentPath[0] === '.') {
            paths.push({
              code: raw.code,
              name: identifierName,
              path: componentPath,
            })

            // remove import/require statement of the component
            // binding.path.parentPath.remove()
          }
        }
      }
    }

    children.forEach(child => (getComponentPaths(child, scope, paths)))

    return paths
  }

  return {
    getRequirePath,
    getComponentPaths,
    isModelCallExpression,
    isRenderCallExpression,
    isMickeyCallExpression,
  }
}

