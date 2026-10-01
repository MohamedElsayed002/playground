jest.mock(
    'src/prisma/prisma.service',
    () => ({
        PrismaService: class PrismaService { },
    }),
    { virtual: true },
);

jest.mock(
    '@sentry/nestjs',
    () => ({
        logger: {
            info: jest.fn(),
        },
    }),
    { virtual: true },
);

import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    it('rejects forged refresh tokens before hitting the database', async () => {
        const prisma = {
            refreshToken: {
                findMany: jest.fn(),
                delete: jest.fn(),
            },
        } as any;

        const jwt = {
            verify: jest.fn(() => {
                throw new Error('invalid token');
            }),
            sign: jest.fn(),
        } as any;

        const service = new AuthService(prisma, jwt);

        await expect(service.refresh('999.anythinghere')).rejects.toThrow(
            UnauthorizedException,
        );
        expect(jwt.verify).toHaveBeenCalledWith('999.anythinghere');
        expect(prisma.refreshToken.findMany).not.toHaveBeenCalled();
    });
});
