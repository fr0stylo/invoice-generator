import { Effect } from 'effect';
import fetch from 'node-fetch';
import { ProjectEntry } from '../types.js';

type ReportEntry = {
  user_id: number;
  project_id: number;
  tracked_seconds: number;
};

type ProjectSubGroup = {
  id: number | null;
  title: string;
  seconds: number;
  local_start: string;
  project_color: string;
  project_hex_color: string;
  ForExport: boolean;
  DistinguishRates: boolean;
  Grouping: string;
  SubGrouping: string;
};

type ProjectGroup = {
  id: number;
  sub_groups: ProjectSubGroup[];
  project_color: string;
  project_hex_color: string;
};

type ProjectGroupsData = {
  groups: ProjectGroup[];
};

const headerPatch = {
  'Content-Type': 'application/json',
  Authorization: `Basic ${Buffer.from(
    '69dd9c24528694081163f95f1f1124cf:api_token'
  ).toString('base64')}`,
};

export const getReport = (startDate: string, endDate: string) =>
  Effect.gen(function* () {
    const response = yield* Effect.promise(() =>
      fetch(
        'https://api.track.toggl.com/reports/api/v3/workspace/6538625/projects/summary',
        {
          method: 'POST',
          body: JSON.stringify({
            start_date: startDate,
            end_date: endDate,
          }),
          headers: headerPatch,
        }
      )
    );

    if (!response.ok) {
      yield* Effect.fail(
        new Error(`Error fetching report: ${response.statusText}`)
      );
    }

    const payload = yield* Effect.promise(() =>
      response.json() as Promise<Array<ReportEntry>>
    );

    return payload;
  }).pipe(
    Effect.catchAll((error) =>
      Effect.fail(new Error(`Failed to get report: ${error}`))
    )
  );

export const getProjectReport = (
  projectId: number,
  startDate: string,
  endDate: string
) =>
  Effect.gen(function* () {
    const response = yield* Effect.promise(() =>
      fetch(
        'https://api.track.toggl.com/reports/api/v3/workspace/6538625/summary/time_entries',
        {
          method: 'POST',
          body: JSON.stringify({
            project_ids: [projectId],
            start_date: startDate,
            end_date: endDate,
          }),
          headers: headerPatch,
        }
      )
    );

    if (!response.ok) {
      yield* Effect.fail(
        new Error(`Error fetching project report: ${response.statusText}`)
      );
    }

    const payload = yield* Effect.promise(() =>
      response.json() as Promise<ProjectGroupsData>
    );

    return payload;
  }).pipe(
    Effect.catchAll((error) =>
      Effect.fail(new Error(`Failed to get project report: ${error}`))
    )
  );

export const getEntries = (startDate: string, endDate: string) =>
  Effect.gen(function* () {
    const response = yield* Effect.promise(() =>
      fetch(
        `https://api.track.toggl.com/api/v9/me/time_entries?meta=true&start_date=${startDate}&end_date=${endDate}`,
        { method: 'GET', headers: headerPatch }
      )
    );

    if (!response.ok) {
      yield* Effect.fail(
        new Error(`Error fetching entries: ${response.statusText}`)
      );
    }

    const data = yield* Effect.promise(() =>
      response.json() as Promise<Array<ProjectEntry>>
    );

    return data;
  }).pipe(
    Effect.catchAll((error) =>
      Effect.fail(new Error(`Failed to get entries: ${error}`))
    )
  );