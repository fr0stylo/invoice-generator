import fetch from 'node-fetch';

type ReportEntry = {
  user_id: number;
  project_id: number;
  tracked_seconds: number;
};

type ReportEntries = Array<ReportEntry>;

const headerPatch = {
  'Content-Type': 'application/json',
  Authorization: `Basic ${Buffer.from(
    '69dd9c24528694081163f95f1f1124cf:api_token'
  ).toString('base64')}`,
};

const getReport = async (
  startDate: string,
  endDate: string
): Promise<Array<ReportEntry>> => {
  try {
    const response = await fetch(
      'https://api.track.toggl.com/reports/api/v3/workspace/6538625/projects/summary',
      {
        method: 'POST',
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
        }),
        headers: headerPatch,
      }
    );
    const payload = (await response.json()) as ReportEntries;

    return payload;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error; // Re-throw the error for further handling
  }
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

const getProjectReport = async (
  projectId: number,
  startDate: string,
  endDate: string
): Promise<ProjectGroupsData> => {
  try {
    const response = await fetch(
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
    );

    if (!response.ok) {
      throw new Error(`Error fetching project report: ${response.statusText}`);
    }
    const payload = (await response.json()) as ProjectGroupsData;

    return payload;
  } catch (error) {
    console.error('Error fetching project report:', error);
    throw error; // Re-throw the error for further handling
  }
};

const getEntries = async (startDate: string, endDate: string) => {
  try {
    const response = await fetch(
      `https://api.track.toggl.com/api/v9/me/time_entries?meta=true&start_date=${startDate}&end_date=${endDate}`,
      { method: 'GET', headers: headerPatch }
    );

    const data = (await response.json()) as Array<{
      client_name: string;
      duration: number;
      project_name: number;
      start: string;
      stop: string;
      description: string;
    }>;

    return data;
  } catch (e: unknown) {
    console.error('Failed to get entries');
    throw e;
  }
};

export { getReport, getProjectReport, getEntries };
