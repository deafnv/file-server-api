import path from 'path'

import fs from 'fs-extra'
import { minimatch } from 'minimatch'
import Fuse from 'fuse.js'
import omit from 'lodash/omit.js'

import { excludedDirs, metadataEnabled, rootDirectoryPath } from './config.js'

export let indexArray: any[] = []
//@ts-ignore
export const fuse = new Fuse([], { keys: ['name'] })

export async function indexFiles(directoryPath = rootDirectoryPath) {
  await indexTraverser(directoryPath)

  //indexArray.sort((a, b) => a.name.localeCompare(b.name))
  fuse.setCollection(indexArray)
  indexArray = null
}

async function indexTraverser(directoryPath: string) {
  const files = await fs.readdir(directoryPath)
  for (const file of files) {
    const filePath = path.join(directoryPath, file)
    const fileStats = await fs.stat(filePath)

    //* Exclude directories & shortcuts
    if (excludedDirs.some((excludedDir) => minimatch(filePath, excludedDir))) continue
    if (file.includes('.shortcut.json')) continue

    if (fileStats.isDirectory()) {
      const metadata =
        metadataEnabled && (await fs.exists(path.join(filePath, '.metadata.json')))
          ? JSON.parse(await fs.readFile(path.join(filePath, '.metadata.json'), 'utf-8'))
          : {}

      indexArray.push({
        name: file,
        path: filePath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/'),
        size: fileStats.size,
        created: fileStats.birthtime,
        modified: fileStats.mtime,
        isDirectory: true,
        isShortcut: null,
        metadata: Object.keys(metadata).length ? omit(metadata, ['name', 'path']) : undefined,
      })

      await indexTraverser(filePath)
    } else {
      indexArray.push({
        name: file,
        path: filePath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/'),
        size: fileStats.size,
        created: fileStats.birthtime,
        modified: fileStats.mtime,
        isDirectory: true,
        isShortcut: null,
      })
    }
  }
}
