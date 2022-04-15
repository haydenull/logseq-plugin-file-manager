export const getFilesFromDir = (directoryHandle: FileSystemDirectoryHandle) => {
  async function* getFilesRecursively (entry) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      if (file !== null) {
        file.relativePath = getRelativePath(entry);
        yield file;
      }
    } else if (entry.kind === 'directory') {
      for await (const handle of entry.values()) {
        yield* getFilesRecursively(handle);
      }
    }
  }
  for await (const fileHandle of getFilesRecursively(directoryHandle)) {
    console.log(fileHandle);
  }
}
