import { Router } from 'express';
import { UserCtr } from '../controller/user.controller';

export const userRouter = Router();
userRouter.post('/register', UserCtr.userRegistration);
userRouter.post('/login', UserCtr.userLogin);
userRouter.post('/reset', UserCtr.userChangePassword);
