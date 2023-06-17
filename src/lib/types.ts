export interface FileTree {
  [key: string]: FileTree
}

export interface DiskSpace {
  diskPath: string
  free: number
  size: number
}

export interface IndexedFile {
  name: string
  path: string
  isDirectory: boolean
}
