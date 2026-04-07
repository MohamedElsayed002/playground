//  A Passport Strategy teaches NestJS how to authenticate one type
// of credential. JwtStrategy handles Bearer tokens

// Flow per protected request
// 1. JwtAuthGuard activates this strategy
// 2. ExtractJwt pulls "Bearer <token>" from the Authorization header
// 3. Passport verifies the token = 401 automatically, validate() never runs
// 4. validate(payload) receives the decoded payload
// 5. Its return value is attached as req.user
// 6. Your resolver/controller reads req.user

// No database call in validate() - the payload was already trusted
// by the signature check. this keeps every request fast

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'Mohamed',
    });
  }

  // Called after passport validates signature
  // Return value becomse req.user everywhere in the app.

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      profileId: payload.profileId,
      email: payload.email,
    };
  }
}
