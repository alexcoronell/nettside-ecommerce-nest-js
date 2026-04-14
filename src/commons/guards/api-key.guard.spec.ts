/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';
import { ConfigType } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '@auth/decorators/public.decorator';
import config from '@config/index';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let reflector: Reflector;
  let mockConfigService: ConfigType<typeof config>;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    mockConfigService = {
      apikey: 'testApiKey',
    } as unknown as ConfigType<typeof config>;

    guard = new ApiKeyGuard(reflector, mockConfigService);

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          header: jest.fn(),
          path: '/api/v1/test',
        }),
      }),
      getHandler: jest.fn(), // Add a mock for getHandler
    } as unknown as ExecutionContext;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access if the route is public', () => {
      // Mock the Reflector to return true for public routes
      jest.spyOn(reflector, 'get').mockReturnValue(true);

      // Mock the ExecutionContext to provide a valid handler
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            header: jest.fn(),
            path: '/api/v1/test',
          }),
        }),
        getHandler: jest.fn().mockReturnValue(() => {}),
      } as unknown as ExecutionContext;

      // Call the canActivate method
      const result = guard.canActivate(mockExecutionContext);

      // Assert that access is allowed
      expect(result).toBe(true);

      // Verify that Reflector.get was called with the correct arguments
      expect(reflector.get).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        expect.any(Function),
      );
    });

    it('should allow access to Swagger/OpenAPI paths without API key', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(false);
      const mockRequest = mockExecutionContext.switchToHttp().getRequest();
      mockRequest.header.mockReturnValue(undefined);
      mockRequest.path = '/docs';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access if the API key is valid', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(false);
      const mockRequest = mockExecutionContext.switchToHttp().getRequest();
      mockRequest.header.mockReturnValue('testApiKey');
      mockRequest.path = '/not-public-endpoint';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.header).toHaveBeenCalledWith('x-api-key');
    });

    it('should throw UnauthorizedException if the API key is invalid', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(false);
      const mockRequest = mockExecutionContext.switchToHttp().getRequest();
      mockRequest.header.mockReturnValue('invalidApiKey');
      mockRequest.path = '/not-public-endpoint';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new UnauthorizedException('Invalid API key'),
      );
      expect(mockRequest.header).toHaveBeenCalledWith('x-api-key');
    });

    it('should throw UnauthorizedException if the x-api-key header is missing', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(false);
      const mockRequest = mockExecutionContext.switchToHttp().getRequest();
      mockRequest.header.mockReturnValue(undefined);
      mockRequest.path = '/not-public-endpoint';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new UnauthorizedException('Invalid API key'),
      );
      expect(mockRequest.header).toHaveBeenCalledWith('x-api-key');
    });
  });
});
