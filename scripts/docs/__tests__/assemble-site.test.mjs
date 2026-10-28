import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { assembleSite } from '../assemble-site.mjs'

/** 计算测试夹具内容的 SHA-256，与生产合并器使用相同摘要格式。 */
function digest(content) {
  return createHash('sha256').update(content).digest('hex')
}

/**
 * 在临时目录创建最小单元 Artifact。
 *
 * @param {string} inputDirectory Artifact 根目录。
 * @param {string} unitName 单元名称。
 * @param {{files?: Record<string, string>, routes?: object[], omitRoutes?: boolean}} fixture 文件、路由和缺失清单选项。
 * @returns {Promise<void>} 夹具文件全部写入后结束。
 */
async function createUnitArtifact(inputDirectory, unitName, fixture = {}) {
  const artifactDirectory = path.join(inputDirectory, unitName)
  const siteDirectory = path.join(artifactDirectory, 'site')
  const files = fixture.files ?? {}
  await mkdir(siteDirectory, { recursive: true })

  const digestEntries = []
  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(siteDirectory, ...relativePath.split('/'))
    await mkdir(path.dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
    digestEntries.push({ path: relativePath, sha256: digest(content), bytes: Buffer.byteLength(content) })
  }

  if (!fixture.omitRoutes) {
    await writeFile(path.join(artifactDirectory, 'routes.json'), `${JSON.stringify({ unit: unitName, routes: fixture.routes ?? [] }, null, 2)}\n`)
  }
  await writeFile(path.join(artifactDirectory, 'file-digests.json'), `${JSON.stringify({ unit: unitName, files: digestEntries }, null, 2)}\n`)
}

/** 创建每个测试独享的输入和输出目录。 */
async function createWorkspace() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'docs-assemble-'))
  return {
    root,
    input: path.join(root, 'units'),
    output: path.join(root, 'assembled'),
  }
}

// 验证当前页面与共享资源正常合并，并在重建时移除上一版遗留的旧跳转页。
test('assembleSite merges unique routes and deduplicates identical files', async () => {
  const workspace = await createWorkspace()
  await createUnitArtifact(workspace.input, 'portal', {
    files: { 'index.html': 'portal', 'assets/shared.js': 'same' },
    routes: [{ route: '/docs/', source: 'index.md', html: 'index.html', unit: 'portal', pageHash: 'portal-hash' }],
  })
  await createUnitArtifact(workspace.input, 'frontend', {
    files: { 'frontend/start.html': 'frontend', 'assets/shared.js': 'same' },
    routes: [{ route: '/docs/frontend/start.html', source: 'frontend/start.md', html: 'frontend/start.html', unit: 'frontend', pageHash: 'frontend-hash' }],
  })

  await mkdir(path.join(workspace.output, 'frontend'), { recursive: true })
  await writeFile(path.join(workspace.output, 'frontend/retired.html'), 'obsolete redirect', 'utf8')

  const report = await assembleSite({
    inputDirectory: workspace.input,
    outputDirectory: workspace.output,
    unitNames: ['portal', 'frontend'],
  })

  assert.equal(report.routeCount, 2)
  assert.equal(report.deduplicatedFiles, 1)
  assert.equal(report.fileCount, 5)
  await assert.rejects(readFile(path.join(workspace.output, 'frontend/retired.html')), { code: 'ENOENT' })
  assert.equal(await readFile(path.join(workspace.output, 'assets/shared.js'), 'utf8'), 'same')
  const hashMap = JSON.parse(await readFile(path.join(workspace.output, 'hashmap.json'), 'utf8'))
  assert.deepEqual(hashMap, { 'frontend_start.md': 'frontend-hash', 'index.md': 'portal-hash' })
})

// 验证同路径不同摘要不会按复制顺序覆盖。
test('assembleSite rejects conflicting file contents', async () => {
  const workspace = await createWorkspace()
  await createUnitArtifact(workspace.input, 'portal', { files: { 'assets/runtime.js': 'portal-runtime' } })
  await createUnitArtifact(workspace.input, 'frontend', { files: { 'assets/runtime.js': 'frontend-runtime' } })

  await assert.rejects(
    assembleSite({ inputDirectory: workspace.input, outputDirectory: workspace.output, unitNames: ['portal', 'frontend'] }),
    /文件摘要冲突.*assets\/runtime\.js/s,
  )
})

// 验证根首页只能由 portal 生成。
test('assembleSite rejects root artifacts from non-portal units', async () => {
  const workspace = await createWorkspace()
  await createUnitArtifact(workspace.input, 'frontend', { files: { 'index.html': 'forbidden' } })

  await assert.rejects(
    assembleSite({ inputDirectory: workspace.input, outputDirectory: workspace.output, unitNames: ['frontend'] }),
    /根级文件.*index\.html.*frontend/s,
  )
})

// 验证缺少路由清单的 Artifact 不能进入合并阶段。
test('assembleSite rejects artifacts without a route manifest', async () => {
  const workspace = await createWorkspace()
  await createUnitArtifact(workspace.input, 'portal', { omitRoutes: true })

  await assert.rejects(
    assembleSite({ inputDirectory: workspace.input, outputDirectory: workspace.output, unitNames: ['portal'] }),
    /缺少.*routes\.json/s,
  )
})

// 验证两个单元不能声明同一个规范 URL。
test('assembleSite rejects duplicate canonical routes', async () => {
  const workspace = await createWorkspace()
  const duplicateRoute = '/docs/frontend/start.html'
  await createUnitArtifact(workspace.input, 'portal', {
    routes: [{ route: duplicateRoute, source: 'index.md', html: 'index.html', unit: 'portal', pageHash: 'a' }],
  })
  await createUnitArtifact(workspace.input, 'frontend', {
    routes: [{ route: duplicateRoute, source: 'frontend/start.md', html: 'frontend/start.html', unit: 'frontend', pageHash: 'b' }],
  })

  await assert.rejects(
    assembleSite({ inputDirectory: workspace.input, outputDirectory: workspace.output, unitNames: ['portal', 'frontend'] }),
    /重复规范路由.*frontend\/start\.html/s,
  )
})
