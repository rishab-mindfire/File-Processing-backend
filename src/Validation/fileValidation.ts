import Joi from 'joi';
// file upload schema
export const fileSchema = Joi.object({
  originalname: Joi.string().required(),
  mimetype: Joi.string()
    .valid(
      'text/plain',
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/zip',

      // Video types
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      // .xls
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    .required(),
  size: Joi.number()
    .max(1000 * 1024 * 1024) // for testing purpose upload up-to 1000 mb
    .required(),
});
