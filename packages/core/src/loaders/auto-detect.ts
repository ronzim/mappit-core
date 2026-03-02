/**
 * Auto-detection of Google Location History format.
 *
 * Given a parsed JSON value the function inspects its shape and delegates
 * to the appropriate loader, returning a `MappitDataset`.
 */

import type { MappitDataset } from '../types';
import { parseRecords } from './records';
import { parseTimelineStandard } from './timeline-standard';
import { parseTimelineSemantic } from './timeline-semantic';
import { parseTimelineIos } from './timeline-ios';

/** Format identifier returned by {@link detectFormat}. */
export type DetectedFormat =
  | 'records'
  | 'timeline-standard'
  | 'timeline-semantic'
  | 'timeline-ios'
  | 'unknown';

/**
 * Inspect a parsed JSON value and return the detected format name.
 */
export function detectFormat(data: unknown): DetectedFormat {
  if (data == null || typeof data !== 'object') return 'unknown';

  // iOS format: top-level array of objects with visit/activity
  if (Array.isArray(data)) {
    if (
      data.length > 0 &&
      typeof data[0] === 'object' &&
      data[0] !== null &&
      ('visit' in data[0] || 'activity' in data[0])
    ) {
      return 'timeline-ios';
    }
    return 'unknown';
  }

  const obj = data as Record<string, unknown>;

  // Records.json
  if ('locations' in obj && Array.isArray(obj.locations)) {
    return 'records';
  }

  // Semantic format (newer)
  if ('semanticSegments' in obj && Array.isArray(obj.semanticSegments)) {
    return 'timeline-semantic';
  }

  // Standard format (legacy Timeline)
  if ('timelineObjects' in obj && Array.isArray(obj.timelineObjects)) {
    return 'timeline-standard';
  }

  return 'unknown';
}

/**
 * Auto-detect format and parse.
 *
 * @throws if the format cannot be determined.
 */
export function parseAuto(data: unknown): MappitDataset {
  const fmt = detectFormat(data);
  switch (fmt) {
    case 'records':
      return parseRecords(data);
    case 'timeline-standard':
      return parseTimelineStandard(data);
    case 'timeline-semantic':
      return parseTimelineSemantic(data);
    case 'timeline-ios':
      return parseTimelineIos(data);
    default:
      throw new Error(
        'Unable to auto-detect format. Provide the data in one of the supported formats: ' +
        'Records.json, Timeline Standard, Timeline Semantic, Timeline iOS.',
      );
  }
}
