export const Ok = <T>(value: T) => Response(200, value)

export const Created = <T>(value: T) => Response(201, value)

export const NoContent = () => Response(204, undefined)

export const Conflict = (message: string) => ErrorResponse(409, message)

export const NotFound = (message: string) => ErrorResponse(404, message)

export const Response = <N extends number, T>(status: NumberLiteral<N>, value: T): { status: NumberLiteral<N>, body: T } => {
  return {
    status,
    body: value
  }
}

export const ErrorResponse = <N extends number>(status: NumberLiteral<N>, value: string): { status: NumberLiteral<N>, body: { message: string } } => {
  return {
    status,
    body: {
      message: value
    }
  }
}

type NumberLiteral<T> = T extends number
  ? number extends T
    ? never
    : T
  : never;