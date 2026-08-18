// common/sse/types.ts

export interface SSEMessage<T = unknown> {
    topic: string;
    payload: T;
}