export interface FileTree {
  [key: string]: FileTree
}

export interface DiskSpace {
  diskPath: string
  free: number
  size: number
}
