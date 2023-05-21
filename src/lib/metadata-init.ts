import path from 'path'

import fs from 'fs-extra'

import { rootDirectoryPath } from './config.js'

const metadataSchema = {
  color: 'string'
}

//* Validates metadata based on schema, recursively called for nested objects
function validateObject(object: any, schema: any, strict = true) {
  if (typeof object != 'object') return false
  for (let key in schema) {
    if (!(key in object)) {
      //* Allow if strict mode off
      if (strict) return false
      else continue
    }

    if (typeof schema[key] == 'string') {
      const expectedType = schema[key]
      const actualType = typeof object[key]
  
      if (expectedType !== actualType) {
        //* Doesn't match the schema
        return false
      }
    } else if (schema[key] instanceof Array) {
      //* Validate array schema
      if (!(object[key] instanceof Array)) return false
      if (typeof schema[key][0] == 'string') {
        if (!object[key].every((item: any) => typeof item == schema[key][0])) return false
        continue
      }
      if (!object[key].every((item: any) => validateObject(item, schema[key][0], strict))) return false
    } else {
      if (!validateObject(object[key], schema[key], strict)) return false
    }
  }

  return true
}


export function isValidMetadata(metadata: any, strict = true) {
  const validate = validateObject(metadata, metadataSchema, strict)
  if (!validate && strict) {
    console.error(`Error with metadata: ${JSON.stringify(metadata)}`)
  }

  return validate
}

//* Initialize metadata with full system directory path
export async function initializeMetadata(directoryPath = rootDirectoryPath) {
  const files = await fs.readdir(directoryPath)
  for (const file of files) {
    const filePath = path.join(directoryPath, file)

    if ((await fs.stat(filePath)).isDirectory()) {
      //TODO: Validate contents of metadata as well (ensure name and path correct)
      await initializeMetadata(filePath)
    }
  }

  const metadataFilePath = path.join(directoryPath, '.metadata.json')

  const defaultMetadata = {
    name: directoryPath == rootDirectoryPath ? 'Root' : path.basename(directoryPath),
    path: directoryPath == rootDirectoryPath ? '/' : directoryPath.replace(rootDirectoryPath, '').split(path.sep).join('/'),
    color: ''
  }

  if (await fs.exists(metadataFilePath)) {
    const metadataFile = await fs.readFile(metadataFilePath, 'utf8')
    let metadata: any
    try {
      metadata = JSON.parse(metadataFile)
    } catch (error) {}
    finally {
      if (!isValidMetadata(metadata)) {
        await fs.writeFile(metadataFilePath, JSON.stringify(defaultMetadata, null, 2), 'utf8')
          .then(() => console.log('Metadata reset'))
          .catch(err => console.error(err))
      }
    }
  } else {
    await fs.writeFile(metadataFilePath, JSON.stringify(defaultMetadata, null, 2), 'utf8').catch(err => console.error(err))
  }
}

export async function deleteMetadata(directoryPath = rootDirectoryPath) {
  const files = await fs.readdir(directoryPath)
  for (const file of files) {
    const filePath = path.join(directoryPath, file)

    if ((await fs.stat(filePath)).isDirectory()) {
      await deleteMetadata(filePath)
    }
  }
  
  if (directoryPath == rootDirectoryPath) return

  const metadataFilePath = path.join(directoryPath, '.metadata.json')
  await fs.rm(metadataFilePath, { force: true })
}