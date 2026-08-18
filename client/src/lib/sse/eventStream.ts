// common/sse/eventStream.ts

type Subscriber<T = unknown> = (data: T) => void;
type EventHandler = (event: MessageEvent) => void;

export class EventStream {
    private eventSource: EventSource | null = null;
    private subscribers = new Map<string, Set<Subscriber>>();
    private handlers = new Map<string, EventHandler>();

    connect(url: string) {
        if (this.eventSource) return;

        this.eventSource = new EventSource(url, {
            withCredentials: true,
        });

        this.eventSource.onopen = () => {
            console.log("SSE connected:", url);
        };

        this.eventSource.onerror = (error) => {
            console.error("SSE error:", error);
        };

        for (const [eventName, handler] of this.handlers) {
            this.eventSource.addEventListener(eventName, handler as EventListener);
        }
    }

    subscribe<T>(eventName: string, callback: (data: T) => void) {
        if (!this.subscribers.has(eventName)) {
            this.subscribers.set(eventName, new Set());
        }

        const eventSubscribers = this.subscribers.get(eventName)!;
        eventSubscribers.add(callback as Subscriber);

        if (!this.handlers.has(eventName)) {
            const handler: EventHandler = (event: MessageEvent) => {
                try {
                    const parsed = JSON.parse(event.data) as { payload: T };
                    const payload = parsed?.payload;
                    const subs = this.subscribers.get(eventName);
                    if (!subs) return;

                    for (const sub of subs) sub(payload);
                } catch (err) {
                    console.error(`SSE parse error for ${eventName}:`, err);
                }
            };

            this.handlers.set(eventName, handler);

            if (this.eventSource) {
                this.eventSource.addEventListener(eventName, handler as EventListener);
            }
        }

        return () => {
            const subs = this.subscribers.get(eventName);
            if (!subs) return;

            subs.delete(callback as Subscriber);

            if (subs.size === 0) {
                this.subscribers.delete(eventName);

                const handler = this.handlers.get(eventName);
                if (handler && this.eventSource) {
                    this.eventSource.removeEventListener(eventName, handler as EventListener);
                }
                this.handlers.delete(eventName);
            }
        };
    }

    disconnect() {
        if (this.eventSource) {
            for (const [eventName, handler] of this.handlers) {
                this.eventSource.removeEventListener(eventName, handler as EventListener);
            }
            this.eventSource.close();
        }

        this.eventSource = null;
    }
}

export const eventStream = new EventStream();