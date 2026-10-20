import { type DynamicModule, Module } from '@nestjs/common';
import type { AppConfig } from './config/env.validation.js';
import { PartyAuthenticationModule } from './party-authentication.module.js';

@Module({})
export class AppModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [PartyAuthenticationModule.register(config)],
    };
  }
}
