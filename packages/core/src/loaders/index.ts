/**
 * Barrel export for all loaders.
 */
export { parseRecords } from './records';
export { parseTimelineStandard } from './timeline-standard';
export { parseTimelineSemantic } from './timeline-semantic';
export { parseTimelineIos } from './timeline-ios';
export { parseTakeoutMonthly } from './takeout-monthly';
export { detectFormat, parseAuto } from './auto-detect';
export type { DetectedFormat } from './auto-detect';
