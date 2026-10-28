import {
  getBuildUnitForRoute,
  resolveRequestedBuildUnit,
} from '../../scripts/docs/build-units.mjs'
import { filterNavigationRecord } from './navigation.js'

/** 读取前端、工程化和微前端共用的 sidebar 配置。 */
async function loadFrontendSidebar() {
  return (await import('./sidebar/frontend.js')).frontendSidebar
}

/** 读取后端 sidebar 配置。 */
async function loadBackendSidebar() {
  return (await import('./sidebar/backend.js')).backendSidebar
}

/** 读取跨端 sidebar 配置。 */
async function loadCrossendSidebar() {
  return (await import('./sidebar/crossend.js')).crossendSidebar
}

/** 读取运维 sidebar 配置。 */
async function loadOperationSidebar() {
  return (await import('./sidebar/operation.js')).operationSidebar
}

/** 读取 Web3 sidebar 配置。 */
async function loadWeb3Sidebar() {
  return (await import('./sidebar/web3.js')).web3Sidebar
}

/** 读取 AI sidebar 配置。 */
async function loadAiSidebar() {
  return (await import('./sidebar/ai.js')).aiSidebar
}

/** 读取实践、项目和面试 sidebar 配置。 */
async function loadPracticeSidebar() {
  return (await import('./sidebar/practice.js')).practiceSidebar
}

/** 读取关于和随记 sidebar 配置。 */
async function loadMoreSidebar() {
  return (await import('./sidebar/more.js')).moreSidebar
}

const SIDEBAR_LOADERS = Object.freeze({
  frontend: loadFrontendSidebar,
  backend: loadBackendSidebar,
  crossend: loadCrossendSidebar,
  operation: loadOperationSidebar,
  web3: loadWeb3Sidebar,
  ai: loadAiSidebar,
  practice: loadPracticeSidebar,
  more: loadMoreSidebar,
})

/**
 * 根据当前构建单元加载 sidebar；单体模式继续返回全站配置。
 *
 * @param {Readonly<object> | null} buildUnit 当前构建单元，`null` 表示迁移期单体模式。
 * @param {{includeMissing?: boolean}} options 是否保留不存在页面，治理脚本使用该选项读取原始配置。
 * @returns {Promise<Record<string, object[]>>} 只包含当前单元路由前缀的 sidebar 配置。
 */
export async function loadSidebar(buildUnit = resolveRequestedBuildUnit(), options = {}) {
  const moduleNames = buildUnit ? buildUnit.sidebarModules : Object.keys(SIDEBAR_LOADERS)
  const mergedSidebar = {}

  for (const moduleName of moduleNames) {
    const loader = SIDEBAR_LOADERS[moduleName]
    if (!loader) {
      throw new Error(`构建单元引用了未知 sidebar 模块: ${moduleName}`)
    }
    Object.assign(mergedSidebar, await loader())
  }

  const filteredSidebar = {}
  for (const [routePrefix, groups] of Object.entries(mergedSidebar)) {
    if (!buildUnit || getBuildUnitForRoute(routePrefix).name === buildUnit.name) {
      filteredSidebar[routePrefix] = groups
    }
  }

  return options.includeMissing ? filteredSidebar : filterNavigationRecord(filteredSidebar)
}

export const sidebar = await loadSidebar()
