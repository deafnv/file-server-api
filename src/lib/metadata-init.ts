import fs from 'fs'
import path from 'path'

import fse from 'fs-extra'

import { rootDirectoryPath } from './config.js'

export function isValidMetadata(metadata: any, logErrors = true) {
  const keysToValidate = [
    { key: 'color', type: 'string'}
  ]
  const validateResult = keysToValidate.map(({ key, type }) => {
    if (metadata instanceof Object && metadata.hasOwnProperty(key)) {
      if (typeof metadata[key] !== type) {
        if (logErrors) console.error(`Error with metadata: ${JSON.stringify(metadata)}`)
        return false
      } else return true
    } else {
      if (logErrors) console.error(`Error with metadata: ${JSON.stringify(metadata)}`)
      return false
    }
  })
  return validateResult.every(result => result)
}

//* Initialize metadata with full system directory path
export async function initializeMetadata(directoryPath = rootDirectoryPath) {
  const files = await fs.promises.readdir(directoryPath)
  for (const file of files) {
    const filePath = path.join(directoryPath, file)

    if ((await fs.promises.stat(filePath)).isDirectory()) {
      await initializeMetadata(filePath)
    }
  }
  
  //* No need metadata in root
  if (directoryPath == rootDirectoryPath) return

  const metadataFilePath = path.join(directoryPath, '.metadata.json')

  const defaultMetadata = {
    name: path.basename(directoryPath),
    path: directoryPath.replace(rootDirectoryPath, '').split(path.sep).join('/'),
    color: ''
  }

  if (await fse.exists(metadataFilePath)) {
    const metadata = JSON.parse(await fs.promises.readFile(metadataFilePath, 'utf8'))
    if (!isValidMetadata(metadata)) {
      await fs.promises.writeFile(metadataFilePath, JSON.stringify(defaultMetadata, null, 2), 'utf8')
        .then(() => console.log('Metadata reset'))
        .catch(err => console.error(err))
    }
  } else {
    await fs.promises.writeFile(metadataFilePath, JSON.stringify(defaultMetadata, null, 2), 'utf8').catch(err => console.error(err))
  }
}

export async function deleteMetadata(directoryPath = rootDirectoryPath) {
  const files = await fs.promises.readdir(directoryPath)
  for (const file of files) {
    const filePath = path.join(directoryPath, file)

    if ((await fs.promises.stat(filePath)).isDirectory()) {
      await deleteMetadata(filePath)
    }
  }
  
  if (directoryPath == rootDirectoryPath) return

  const metadataFilePath = path.join(directoryPath, '.metadata.json')
  await fs.promises.rm(metadataFilePath, { force: true })
}