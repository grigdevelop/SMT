import { z } from 'zod';

export const Role = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const RoleSchema = z.enum(['ADMIN', 'USER']);

export const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  role: RoleSchema.optional().default(Role.USER),
});
export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const CreateApiTokenSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Token name is required')
    .max(100, 'Name must be 100 characters or less'),
});
export type CreateApiTokenDto = z.infer<typeof CreateApiTokenSchema>;

export interface UserDto {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AuthResponseDto {
  readonly accessToken: string;
  readonly user: UserDto;
}

export interface ApiTokenDto {
  readonly id: string;
  readonly name: string;
  readonly tokenPreview: string;
  readonly lastUsedAt: string | null;
  readonly createdAt: string;
}

export interface CreatedApiTokenDto extends ApiTokenDto {
  readonly rawToken: string;
}
