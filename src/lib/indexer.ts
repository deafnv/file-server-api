import path from 'path'

import fs from 'fs-extra'
import { minimatch } from 'minimatch'
import Fuse from 'fuse.js'

import { excludedDirs, rootDirectoryPath } from './config.js'

export let indexArray: any[] = []
//@ts-ignore
export const fuse = new Fuse([], { keys: ['name'] })

export async function indexFiles(directoryPath = rootDirectoryPath) {
  await indexTraverser(directoryPath)

  fuse.setCollection(indexArray)
  indexArray = []
}

async function indexTraverser(directoryPath: string) {
  const files = await fs.readdir(directoryPath)
  for (const file of files) {
    const filePath = path.join(directoryPath, file)

    //* Exclude directories & shortcuts
    if (excludedDirs.some((excludedDir) => minimatch(filePath, excludedDir))) continue
    if (file.includes('.shortcut.json')) continue

    if ((await fs.stat(filePath)).isDirectory()) {
      indexArray.push({
        name: file,
        path: filePath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/'),
      })

      await indexTraverser(filePath)
    } else {
      indexArray.push({
        name: file,
        path: filePath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/'),
      })
    }
  }
}
