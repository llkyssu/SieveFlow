import { Injectable } from '@nestjs/common';
import { ApiResponse } from '@sieveflow/shared-types';

@Injectable()
export class AppService {
  getHello(): ApiResponse<string> {
    return {
      success: true,
      data: 'Hello World!',
      message: 'Welcome to SieveFlow API',
    };
  }
}
