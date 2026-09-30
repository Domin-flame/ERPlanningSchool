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
      CreateConversationResponse: {
        type: 'object',
        properties: {
          conversation_id: { type: 'string' },
          messages: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
        required: ['conversation_id', 'messages'],
      },
      SendMessageRequest: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          language: { type: 'string', example: 'fr' },
        },
        required: ['message'],
      },
      SendMessageResponse: {
        type: 'object',
        properties: {
          conversation_id: { type: 'string' },
          message: { type: 'string' },
          messages: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          sources: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
          },
          grounded: { type: 'boolean' },
        },
        required: ['conversation_id', 'message', 'messages'],
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
    '/api/ai/chats': {
      post: {
        tags: ['Assistant IA'],
        summary: 'Create AI conversation',
        description: 'Creates a new chatbot conversation and returns its identifier.',
        responses: {
          '200': {
            description: 'Conversation created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateConversationResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '503': {
            description: 'Service unavailable',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/ai/chats/{conversation_id}/messages': {
      post: {
        tags: ['Assistant IA'],
        summary: 'Send message to AI',
        description: 'Sends a prompt to the AI assistant and returns its answer.',
        parameters: [
          {
            in: 'path',
            name: 'conversation_id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SendMessageRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Assistant response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SendMessageResponse',
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '503': {
            description: 'Service unavailable',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
