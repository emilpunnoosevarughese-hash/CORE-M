import { PointTracker } from '../tracking/PointTracker';

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  if (type === 'TRACK_POINTS') {
    try {
      const result = await PointTracker.track(payload);
      self.postMessage({ id, type: 'TRACK_SUCCESS', payload: result });
    } catch (err: any) {
      self.postMessage({ id, type: 'TRACK_ERROR', error: err.message });
    }
  }
};
