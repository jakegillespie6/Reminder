import json
import queue
import threading
from dataclasses import dataclass
from typing import Set


@dataclass(frozen=True)
class Subscriber:
    q: queue.Queue
    topics: frozenset[str]  # empty => all topics


class EventBroker:
    def __init__(self):
        self._subs: Set[Subscriber] = set()
        self._lock = threading.Lock()

    def subscribe(self, topics: set[str] | None = None) -> Subscriber:
        sub = Subscriber(q=queue.Queue(), topics=frozenset(topics or set()))
        with self._lock:
            self._subs.add(sub)
        return sub

    def unsubscribe(self, sub: Subscriber):
        with self._lock:
            self._subs.discard(sub)

    def publish(self, topic: str, event_name: str, payload: dict):
        msg = (
            f"event: {event_name}\n"
            f"data: {json.dumps({'topic': topic, 'payload': payload})}\n\n"
        )
        with self._lock:
            subs = list(self._subs)

        for sub in subs:
            if not sub.topics or topic in sub.topics:
                sub.q.put(msg)


broker = EventBroker()