import { create } from 'zustand';

export interface TrackerPoint {
  x: number;
  y: number;
}

export interface TrackingData {
  frame: number;
  point: TrackerPoint;
  confidence: number;
}

export interface Tracker {
  id: string;
  name: string;
  type: 'point' | 'planar' | 'face';
  assetId: string;
  data: TrackingData[]; // The cached tracked points over time
  isActive: boolean;
}

interface TrackerState {
  trackers: Tracker[];
  activeTrackerId: string | null;
  isTracking: boolean;
  
  // Actions
  addTracker: (type: Tracker['type'], assetId: string, name?: string) => string;
  removeTracker: (id: string) => void;
  setActiveTracker: (id: string | null) => void;
  updateTrackerData: (id: string, data: TrackingData) => void;
  setTrackingStatus: (status: boolean) => void;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  trackers: [],
  activeTrackerId: null,
  isTracking: false,

  addTracker: (type, assetId, name) => {
    const id = `tracker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTracker: Tracker = {
      id,
      name: name || `Tracker ${get().trackers.length + 1}`,
      type,
      assetId,
      data: [],
      isActive: true
    };
    
    set(state => ({
      trackers: [...state.trackers, newTracker],
      activeTrackerId: id
    }));
    return id;
  },

  removeTracker: (id) => {
    set(state => ({
      trackers: state.trackers.filter(t => t.id !== id),
      activeTrackerId: state.activeTrackerId === id ? null : state.activeTrackerId
    }));
  },

  setActiveTracker: (id) => set({ activeTrackerId: id }),

  updateTrackerData: (id, data) => {
    set(state => ({
      trackers: state.trackers.map(t => {
        if (t.id === id) {
          // Replace if exists for frame, otherwise append and sort
          const existing = t.data.findIndex(d => d.frame === data.frame);
          const newData = [...t.data];
          if (existing >= 0) {
            newData[existing] = data;
          } else {
            newData.push(data);
            newData.sort((a, b) => a.frame - b.frame);
          }
          return { ...t, data: newData };
        }
        return t;
      })
    }));
  },

  setTrackingStatus: (status) => set({ isTracking: status })
}));
