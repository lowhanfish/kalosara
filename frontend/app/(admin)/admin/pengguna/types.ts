export type UserItem = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  updatedAt: string;
  createdAt?: string;
  profile?: { displayName: string | null } | null;
};

export type AuditItem = {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  requestId: string | null;
  ipHash: string | null;
  createdAt: string;
};

export type UploadItem = {
  id: string;
  originalName: string;
  size: number;
  visibility: string;
  archived: boolean;
  createdAt?: string;
};

export type QueryItem = UserItem | AuditItem | UploadItem;

export interface CreateInterface {
  email: string;
  displayName?: string;
  role: string;
  password: string;
  currentPassword: string;
}

export interface UpdateAccessInterface {
  action: string;
  identityVerified: boolean;
  currentPassword: string;
  expectedUpdatedAt: string;
  newPassword?: string;
  role?: string;
}

export type ResponseInterface = QueryItem;

export type ResponseListInterface = {
  items: QueryItem[];
  total: number;
  page: number;
  limit: number;
  counts?: {
    total: number;
    admin: number;
    lurah: number;
    masyarakat: number;
  };
  quota?: {
    perFileBytes: number;
    physicalBytes: number;
    concurrentUploads: number;
    totalLimitBytes: null;
  };
};

export function isUser(item: QueryItem): item is UserItem {
  return "email" in item;
}

export function isAudit(item: QueryItem): item is AuditItem {
  return "action" in item;
}

export function isUpload(item: QueryItem): item is UploadItem {
  return "originalName" in item;
}
