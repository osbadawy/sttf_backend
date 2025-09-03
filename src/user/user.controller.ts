// src/users/user.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { UniqueConstraintError } from 'sequelize';
import {SignUpResponse} from './dtos/user.interfaces.dtos'

type SignUpBody = {
  firebase_id: string;
  email: string;       
};

@Controller('user')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  @Post('signup')
  async signUp(@Body() body: SignUpBody, @Req() req: any): Promise<SignUpResponse> {
    const firebase_id = (body?.firebase_id ?? '').trim();
    const email = (body?.email ?? '').trim().toLowerCase();
    console.log(req.body)
    if (!firebase_id) throw new BadRequestException('firebase_id is required');
    if (!email) throw new BadRequestException('email is required');


    const uid = req?.user?.uid;
    if (uid && uid !== firebase_id) {
      throw new BadRequestException('firebase_id does not match authenticated user');
    }

    try {
      let user = await this.userModel.findOne({ where: { firebase_id } });

      if (!user) {
        user = await this.userModel.create({ firebase_id, email });
        return { created: true, user: { firebase_id, email: user.email } };
      }

      if (user.email !== email) {
        await user.update({ email });
      }

      return { created: false, user: user};
    } catch (err: any) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException('Email or firebase_id already in use.');
      }
      throw new BadRequestException(err?.message ?? 'Failed to save user.');
    }
  }
}
