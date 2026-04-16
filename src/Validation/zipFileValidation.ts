import Joi from 'joi';
import mongoose from 'mongoose';

export const fileZipSchema = Joi.object({
  fileIds: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      }, 'ObjectId validation'),
    )
    .min(1)
    .required()
    .messages({
      'any.invalid': 'File does not belong to this project',
      'array.min': 'fileIds cannot be empty',
    }),
});
