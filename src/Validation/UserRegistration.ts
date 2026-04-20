import Joi from 'joi';

export const UserRegistrationValidation = Joi.object({
  userName: Joi.string().required(),
  userEmail: Joi.string().email().required(),
  userPassword: Joi.string().min(4).alphanum().required(),
  role: Joi.string().valid('admin', 'public').required(),
});

export const UserLoginValidation = Joi.object({
  userEmail: Joi.string().email().required().messages({
    'string.email': 'userEmail must be a valid email',
  }),
  userPassword: Joi.string().min(5).required(),
});

export const UserChangePassword = Joi.object({
  userEmail: Joi.string().required(),
  userPassword: Joi.string().required(),
  confirmPassord: Joi.any().valid(Joi.ref('userPassword')).required(),
});
