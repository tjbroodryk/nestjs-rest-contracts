import { Test } from '@nestjs/testing';
import { ContractController, ArgsShape, ResponseShape } from './';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { Conflict, Ok } from './responses';
import * as request from 'supertest';
import { CanActivate, ExecutionContext, INestApplication, Injectable, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';

export const c = initContract();

export const stackContract = c.router({
  update: {
    method: 'POST',
    path: '/stacks/:name/update',
    responses: {
      200: c.response<{ value: string }>(),
      409: c.response<{ message: string }>(),
    },
    body: z.object({
      foo: z.string(),
      bar: z.string().optional().default("yoo")
    }),
    pathParams: z.object({
      name: z.string()
    }),
    summary: 'Run update for stack',
  },
  getById: {
    method: 'GET',
    path: '/stacks/:name',
    responses: {
      200: c.response<{some: { property: string }}>()
    },
    query: z.object({
      page: z.number().optional().default(0),
      take: z.number().optional().default(20),
    }),
    pathParams: z.object({
      name: z.string().uuid()
    }),
    summary: 'Get stack by ID',
  },
  guarded: {
    method: 'GET',
    path: '/stacks/guarded',
    responses: {
      204: c.response<void>()
    },
  }
});
type Contract = typeof stackContract
type Args<T extends keyof Contract> = ArgsShape<Contract[T]>
type Response<T extends keyof Contract> = ResponseShape<Contract[T]>

@Injectable()
export class TestGuard implements CanActivate {
  canActivate(
    _: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return false;
  }
}

@ContractController(stackContract)
export class StackController {
  async update(args: Args<'update'>): Response<'update'> {
    if(args.params.name === "foo") {
      return Ok({
        value: args.body.bar
      })
    }
    return Conflict("some conflict occured")
  }

  async getById(args: Args<'getById'>): Response<'getById'> {
    return Ok({
      some: {
        property: args.params.name
      }
    })
  }

  @UseGuards(TestGuard)
  async guarded(): Response<'guarded'> {
    throw new Error('Should reach this')
  }
}

describe('contracts', () => {
  describe('given query params', () => {
    let app: INestApplication

    beforeAll(async () => {
      const { app: a } = await createApp()

      app = a
    })

    describe('when query params are valid', () => {
      it('should parse params', async () => {
        await request(app.getHttpServer())
          .get('/stacks/0403c0e6-6a79-43f5-aa72-c3a6275872a1?take=10')
          .expect(400)
      })
    })

    describe('when query params are invalid', () => {
      it('should parse params', async () => {
        await request(app.getHttpServer())
          .get('/stacks/0403c0e6-6a79-43f5-aa72-c3a6275872a1?page=foo')
          .expect(400)
      })
    })
  })

  describe('given path params', () => {
    let app: INestApplication

    beforeAll(async () => {
      const { app: a } = await createApp()

      app = a
    })

    describe('when params are invalid', () => {
      it('should validate params', async () => {
        await request(app.getHttpServer())
          .get('/stacks/1')
          .expect(400)
      })
    })
    
    describe('when params are valid', () => {
      it('should parse params', async () => {
        const result = await request(app.getHttpServer())
          .get('/stacks/0403c0e6-6a79-43f5-aa72-c3a6275872a1')
          .expect(200)
  
        expect(result).toMatchObject({
          body: {
            some: {
              property: "0403c0e6-6a79-43f5-aa72-c3a6275872a1"
            }
          }
        })
      })
    })
  })

  describe('given optional body params', () => {
    let app: INestApplication

    beforeAll(async () => {
      const { app: a } = await createApp()

      app = a
    })
    
    describe('when request body is valid', () => {
      it('should parse params', async () => {
        const result = await request(app.getHttpServer())
          .post('/stacks/foo/update')
          .send({
            foo: "test"
          })
          .expect(200)

        expect(result).toMatchObject({
          body: {
            value: "yoo"
          }
        })

        await request(app.getHttpServer())
          .post('/stacks/bla/update')
          .send({
            foo: "test",
          })
          .expect(409)
      })
    })

    describe('when request body is invalid', () => {
      it('should respond with bad request', () => {
        return request(app.getHttpServer())
          .post('/stacks/some_name/update')
          .expect(400)
      })
    })
  })

  describe('given multiple method annotations', () => {
    let app: INestApplication

    beforeAll(async () => {
      const { app: a } = await createApp()

      app = a
    })

    it('should run all decorators', () => {
      return request(app.getHttpServer())
        .get('/stacks/guarded')
        .expect(400)
    })
  })
})

async function createApp() {
  const module = await Test.createTestingModule({
    controllers: [StackController]
  }).compile()

  const app = module.createNestApplication()

  await app.init();

  return {
    app, 
    module
  }
}