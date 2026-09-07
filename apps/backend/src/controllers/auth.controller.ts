import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { loginSchema, createUserSchema } from '../validations';

export class AuthController {
  async login(req: Request, res: Response) {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.json(result);
  }

  async createUser(req: Request, res: Response) {
    const data = createUserSchema.parse(req.body);
    const user = await authService.createUser(data);
    res.status(201).json(user);
  }

  async getUsers(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await authService.getUsers(page, limit);
    res.json(result);
  }

  async getUser(req: Request, res: Response) {
    const user = await authService.getUser(req.params.id as string);
    res.json(user);
  }
}

export const authController = new AuthController();
