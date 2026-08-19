import asyncio
import queue

from django.http import StreamingHttpResponse
from .services import broker


def events(request):
    topics_param = request.GET.get("topics", "").strip()
    topics = {t.strip() for t in topics_param.split(",") if t.strip()} or None

    async def stream():
        sub = broker.subscribe(topics=topics)

        try:
            yield "event: connected\ndata: {}\n\n"

            while True:
                try:
                    message = await asyncio.to_thread(
                        sub.q.get,
                        True,
                        20,
                    )

                    yield message

                except queue.Empty:
                    yield ": ping\n\n"

        finally:
            broker.unsubscribe(sub)

    resp = StreamingHttpResponse(
        stream(),
        content_type="text/event-stream",
    )
    resp["Cache-Control"] = "no-cache"
    resp["X-Accel-Buffering"] = "no"

    return resp