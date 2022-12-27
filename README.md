<h1 align="center"></h1>

<div align="center">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo_text.svg" width="150" alt="Nest Logo" />
  </a>
</div>

<h3 align="center">NestJS Type Safe Event Emitter Module</h3>

<div align="center">
  <a href="https://nestjs.com" target="_blank">
    <img src="https://img.shields.io/badge/built%20with-NestJs-red.svg" alt="Built with NestJS">
  </a>
</div>

Type Safe, contract-driven REST Controllers for NestJS applications.

Uses [zod](https://github.com/colinhacks/zod) object defintions and [ts-rest](https://github.com/ts-rest/ts-rest) to create typesafe REST endpoint contracts.

**Note**
This library is simply to force NestJS controllers to implement a ts-rest contract. The contracts and client lib themselves are still standard ts-rest.

## Features

- Type-Safe Controllers - Controllers are forced to implement the interface defined by the contract
- Automatic request body, path param, and query parsing using the `zod` definitions defined in the contract.
- Automatic parameter unmarshelling - no need for additional param decorators like `Body` or `ApiDecorator`. Its already handled.
- Automatic binding of methods to endpoints - no need for additional decorators like `Post` or `Api`. Its already handled.
- Utilities for creating response objects like `NoContent`, `Ok` etc that provide the correct status codes.
- Combine contracts as per `ts-rest`.

## Installation

```bash
npm i @ts-rest/core nestjs-rest-contracts
```

## Example

1. Create contract

```typescript
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

export const c = initContract();

export const stackContract = c.router({
  update: {
    method: 'POST',
    path: '/stacks/:name/update',
    responses: {
      204: c.response<void>(),
      409: c.response<{ message: string }>(),
    },
    body: z.object({
      foo: z.string(),
    }),
    pathParams: {
      name: z.string(),
    },
    summary: 'Run update for stack',
  },
});
```

2. Create your Controller

```typescript
import { stackContract } from './contract';
import {
  ContractController,
  ArgsShape,
  ResponseShape,
  NoContent,
  Conflict,
} from 'nestjs-rest-contracts';

type Contract = typeof stackContract;
type Args<T extends keyof Contract> = ArgsShape<Contract[T]>;
type Response<T extends keyof Contract> = ResponseShape<Contract[T]>;

@ContractController(stackContract)
export class StackController {
  async update(args: Args<'update'>): Response<'update'> {
    if (args.params.name === 'foo') {
      return NoContent();
    }
    return Conflict('some message');
  }
}
```

3. Register your Controller

```typescript
import { Module } from '@nestjs/common';
import { StackController } from './stack.controller';

@Module({
  controllers: [StackController],
})
export class AppModule {}
```

4. Profit
