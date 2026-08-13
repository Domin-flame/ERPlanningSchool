const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'CampusWorkflow API Gateway',
    version: '1.0.0',
    description: 'Swagger / OpenAPI documentation for the CampusWorkflow API Gateway.',
  },
  servers: [
    {
      url: process.env.SWAGGER_SERVER_URL || 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          detail: {
            type: 'string',
          },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
          },
          service: {
            type: 'string',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          services: {
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          },
        },
      },
      ServiceHealthItem: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          healthy: {
            type: 'boolean',
          },
          responseTime: {
            type: 'number',
          },
          error: {
            type: 'string',
          },
        },
        required: ['name', 'healthy', 'responseTime'],
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
          },
          password: {
            type: 'string',
          },
        },
        required: ['email', 'password'],
      },
      TokenResponse: {
        type: 'object',
        properties: {
          access_token: {
            type: 'string',
          },
          token_type: {
            type: 'string',
            example: 'Bearer',
          },
          expires_in: {
            type: 'integer',
            example: 3600,
          },
        },
      },
      responseHeaders: {
        XHandledBy: {
          description: 'Service that actually handled the request (gateway or backend service name)',
          schema: { type: 'string' }
        }
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Gateway'],
        summary: 'Gateway health check',
        description: 'Returns gateway status and configured backend service URLs.',
        responses: {
          '200': {
            description: 'Gateway is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/services/health': {
      get: {
        tags: ['Gateway'],
        summary: 'Aggregated services health',
        description: 'Checks the health of all configured backend services.',
        responses: {
          '200': {
            description: 'Service health summary',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ServiceHealthItem',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/demo/ratelimit': {
      get: {
        tags: ['Demo'],
        summary: 'Demo rate-limit endpoint',
        description: 'Endpoint implemented on the gateway to demonstrate rate limiting. Repeated calls will trigger a 429 response when limit exceeded.',
        responses: {
          '200': {
            description: 'OK (handled by gateway)',
            headers: {
              'X-Handled-By': {
                description: 'Service that handled the request',
                schema: { type: 'string' }
              }
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    info: { type: 'string' }
                  }
                }
              }
            }
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        },
        security: []
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login',
        description: 'Forward login requests to the authentication service.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TokenResponse',
                },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '503': {
            description: 'Service unavailable',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
        security: [],
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register',
        description: 'Forward registration requests to the authentication service.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Registration successful',
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '503': {
            description: 'Service unavailable',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
        security: [],
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh token',
        description: 'Forward token refresh requests to the authentication service.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TokenResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '503': {
            description: 'Service unavailable',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
        security: [],
      },
    },
  },
};

module.exports = swaggerSpec;
