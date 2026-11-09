export interface DashboardActivity {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: string;
}

export interface ResponseInterface {
  published: number;
  draft: number;
  announcements: number;
  events: number;
  media: number;
  users: number;
  activity: DashboardActivity[];
}
