import {
  routeToSourcePath,
  toPosixPath,
} from './lib/routes.mjs'

const UNIT_DEFINITIONS = [
  {
    name: 'portal',
    sourceRoots: ['index.md', 'links.md', 'about'],
    sidebarModules: ['more'],
    ownsRootArtifacts: true,
  },
  {
    name: 'frontend',
    sourceRoots: ['frontend'],
    sidebarModules: ['frontend'],
    ownsRootArtifacts: false,
  },
  {
    name: 'backend',
    sourceRoots: ['backend'],
    sidebarModules: ['backend'],
    ownsRootArtifacts: false,
  },
  {
    name: 'operation',
    sourceRoots: ['operation'],
    sidebarModules: ['operation'],
    ownsRootArtifacts: false,
  },
  {
    name: 'ai',
    sourceRoots: ['ai'],
    sidebarModules: ['ai'],
    ownsRootArtifacts: false,
  },
  {
    name: 'web3',
    sourceRoots: ['web3'],
    sidebarModules: ['web3'],
    ownsRootArtifacts: false,
  },
  {
    name: 'ecosystem',
    sourceRoots: [
      'articles',
      'crossend',
      'diary',
      'engineering',
      'interview',
      'microfrontend',
      'practices',
      'project',
      'skill',
    ],
    sidebarModules: ['frontend', 'crossend', 'practice', 'more'],
    ownsRootArtifacts: false,
  },
]

// 冻结数组和单元对象，避免构建配置加载期间被主题代码意外修改。
export const BUILD_UNITS = Object.freeze(UNIT_DEFINITIONS.map((definition) => Object.freeze({
  ...definition,
  sourceRoots: Object.freeze([...definition.sourceRoots]),
  sidebarModules: Object.freeze([...definition.sidebarModules]),
  outDir: `.build/units/${definition.name}/site`,
  cacheDir: `.build/cache/${definition.name}`,
})))

// 单元顺序是本地串行构建、CI Matrix 和确定性合并的共同契约。
export const BUILD_UNIT_NAMES = Object.freeze(BUILD_UNITS.map((unit) => unit.name))

/**
 * 判断仓库相对 Markdown 路径是否属于一个源码根。
 *
 * @param {string} sourcePath 规范化后的 Markdown 路径。
 * @param {string} sourceRoot 单文件或顶层目录所有权声明。
 * @returns {boolean} 精确文件或目录前缀匹配时返回 `true`。
 */
function sourceMatchesRoot(sourcePath, sourceRoot) {
  return sourceRoot.endsWith('.md')
    ? sourcePath === sourceRoot
    : sourcePath.startsWith(`${sourceRoot}/`)
}

/**
 * 按名称读取已批准的构建单元，未知名称立即失败。
 *
 * @param {string} name 构建单元名称。
 * @returns {Readonly<object>} 冻结的构建单元配置。
 */
export function resolveBuildUnit(name) {
  // 按唯一名称查找单元，找不到时由下方分支生成带可选值的错误信息。
  const unit = BUILD_UNITS.find((candidate) => candidate.name === name)
  if (!unit) {
    throw new Error(`未知构建单元: ${name}`)
  }

  return unit
}

/**
 * 根据 Markdown 路径解析唯一构建单元。
 *
 * @param {string} sourcePath 相对于 `content/` 的 Markdown 路径。
 * @returns {Readonly<object>} 唯一负责该路径的构建单元。
 */
export function getBuildUnitForSource(sourcePath) {
  const normalizedSource = toPosixPath(sourcePath)
  if (!normalizedSource.toLowerCase().endsWith('.md')) {
    throw new Error(`构建单元归属只支持 Markdown: ${sourcePath}`)
  }

  // 单元数量固定且很小，显式遍历能保留全部冲突来源用于错误信息。
  const matches = BUILD_UNITS.filter((unit) => unit.sourceRoots.some((root) => sourceMatchesRoot(normalizedSource, root)))
  if (matches.length === 0) {
    throw new Error(`没有构建单元负责 Markdown: ${normalizedSource}`)
  }
  if (matches.length > 1) {
    // 冲突消息保留每个候选单元名称，便于修正重叠的 sourceRoots。
    throw new Error(`Markdown 被多个构建单元负责: ${normalizedSource} -> ${matches.map((unit) => unit.name).join(', ')}`)
  }

  return matches[0]
}

/**
 * 根据公开 URL 解析负责该页面的构建单元。
 *
 * @param {string} route 带站点 base 的页面 URL。
 * @param {string} siteBase VitePress 部署 base。
 * @returns {Readonly<object>} 唯一负责该 URL 的构建单元。
 */
export function getBuildUnitForRoute(route, siteBase = '/docs/') {
  return getBuildUnitForSource(routeToSourcePath(route, siteBase))
}

/**
 * 为指定单元生成 VitePress `srcExclude`，排除所有其他单元的源码根。
 *
 * @param {string} unitName 已批准的构建单元名称。
 * @returns {string[]} 稳定排序的 Markdown ignore glob。
 */
export function createSrcExclude(unitName) {
  const selectedUnit = resolveBuildUnit(unitName)
  const excludes = []

  for (const unit of BUILD_UNITS) {
    if (unit.name === selectedUnit.name) {
      continue
    }

    for (const sourceRoot of unit.sourceRoots) {
      excludes.push(sourceRoot.endsWith('.md') ? sourceRoot : `${sourceRoot}/**/*.md`)
    }
  }

  return excludes.sort()
}

/**
 * 解析环境变量中的构建单元；空值表示保留迁移期单体构建模式。
 *
 * @param {string | undefined} requestedUnit `DOCS_BUILD_UNIT` 的原始值。
 * @returns {Readonly<object> | null} 指定单元配置；空值返回 `null`。
 */
export function resolveRequestedBuildUnit(requestedUnit = process.env.DOCS_BUILD_UNIT) {
  return requestedUnit ? resolveBuildUnit(requestedUnit) : null
}
