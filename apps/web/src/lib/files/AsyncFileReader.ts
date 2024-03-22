export class AsyncFileReader {
  reader: FileReader;

  constructor() {
    this.reader = new FileReader();
  }

  readFile(file: File) {
    return new Promise<string>((resolve) => {
      this.reader.onload = () => {
        resolve(this.reader.result?.toString() || '');
      };
      this.reader.readAsText(file);
    });
  }

  static read(file: File) {
    const reader = new AsyncFileReader();
    return reader.readFile(file);
  }
}
