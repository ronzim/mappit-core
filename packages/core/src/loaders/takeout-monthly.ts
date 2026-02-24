/**
 * Loader for the **Takeout monthly** format.
 *
 * Each file is a `YYYY_MONTH.json` with `{ timelineObjects: […] }` —
 * i.e. the same structure as the Standard format.  This loader reads
 * multiple such files and merges them into a single dataset.
 */

import { parseTimelineStandard } from './timeline-standard';
import type { MappitDataset, TimelineEntry } from '../types';

/**
 * Merge multiple Standard-format objects (one per month) into a single
 * dataset with `source: 'takeout-monthly'`.
 *
 * @param files  Map of filename → parsed JSON content. Keys are typically
 *               `"2024_JANUARY"`, `"2024_FEBRUARY"`, etc., but any key is
 *               accepted.  The values must be objects with a
 *               `timelineObjects` array.
 */
export function parseTakeoutMonthly(
  files: ReadonlyMap<string, unknown>,
): MappitDataset {
  if (files.size === 0) {
    throw new Error('Takeout monthly: no files provided');
  }

  const allTimeline: TimelineEntry[] = [];
  let min = '';
  let max = '';

  for (const [, content] of files) {
    const ds = parseTimelineStandard(content);
    allTimeline.push(...ds.timeline);

    if (ds.dateRange.min && (!min || ds.dateRange.min < min))
      min = ds.dateRange.min;
    if (ds.dateRange.max && (!max || ds.dateRange.max > max))
      max = ds.dateRange.max;
  }

  return {
    source: 'takeout-monthly',
    dateRange: { min, max },
    points: [],
    timeline: allTimeline,
  };
}
