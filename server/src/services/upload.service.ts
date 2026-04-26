export const formatUploadResponse = (file: any) => {
  return {
    url: file.secure_url || file.path, // fallback safe
    type: file.mimetype,
    name: file.originalname,
  };
};