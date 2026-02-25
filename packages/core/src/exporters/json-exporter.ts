/**
 * Export a MappitDataset to a simplified JSON string.
 *
 * The output is a human-readable JSON document with the same structure as
 * `MappitDataset` but with only the essential fields (via `simplifyDataset`).
 */

import type { MappitDataset } from '../types';
import { simplifyDataset } from '../transforms';

export interface JsonExportOptions {
    /** Pretty-print with indentation (default `2`). Set `0` for compact. */
    indent?: number;
    /** Apply `simplifyDataset` before serialising (default `true`). */
    simplify?: boolean;
}

/**
 * Serialise a `MappitDataset` as a JSON string.
 */
export function exportToJson(
    dataset: MappitDataset,
    options: JsonExportOptions = {},
): string {
    const { indent = 2, simplify = true } = options;
    const data = simplify ? simplifyDataset(dataset) : dataset;
    return JSON.stringify(data, null, indent);
}
