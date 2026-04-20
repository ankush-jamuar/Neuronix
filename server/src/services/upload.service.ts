export const formatUploadResponse = (file: Express.Multer.File) => {
  return {
    url: file.path,
    type: file.mimetype,
    name: file.originalname,
  };
};
