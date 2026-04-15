import Joi from 'joi';

export const createProjectSchema = Joi.object({
  projectName: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Project name is required',
    'string.min': 'Project name must be at least 3 characters',
    'string.max': 'Project name must be less than 100 characters',
  }),

  projectDescription: Joi.string().allow('').max(500).optional().messages({
    'string.max': 'Description must be less than 500 characters',
  }),
});
