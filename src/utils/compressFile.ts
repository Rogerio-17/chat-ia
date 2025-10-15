import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 620,
      useWebWorker: true,
      fileType: "image/png",
    };

    imageCompression(file, options)
      .then((compressedFile) => {
        resolve(compressedFile);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
