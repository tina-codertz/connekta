import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { BACKGROUND_LOCATION_TASK } from '@/lib/background-location-constants';
import { uploadLocationToSupabase } from '@/lib/location-upload';
import { shouldUploadLocation } from '@/lib/location-throttle';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('Background location task error:', error.message);
    return;
  }

  const locations = (data as { locations?: Location.LocationObject[] } | undefined)
    ?.locations;

  const latest = locations?.[locations.length - 1];
  if (!latest || !shouldUploadLocation(latest)) {
    return;
  }

  await uploadLocationToSupabase(latest);
});
