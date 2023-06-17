import path from 'path'

import fs from 'fs-extra'
import { minimatch } from 'minimatch'
import Fuse from 'fuse.js'

import { excludedDirs, rootDirectoryPath } from './config.js'
import { IndexedFile } from './types.js'

export let indexArray: IndexedFile[] = []
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

    //* Exclude directories
    if (excludedDirs.some((excludedDir) => minimatch(filePath, excludedDir))) continue

    if ((await fs.stat(filePath)).isDirectory()) {
      indexArray.push({
        name: file,
        path: filePath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/'),
        isDirectory: true,
      })

      await indexTraverser(filePath)
    } else {
      indexArray.push({
        name: file,
        path: filePath.replace(rootDirectoryPath, '').replaceAll(path.sep, '/'),
        isDirectory: false,
      })
    }
  }
}
