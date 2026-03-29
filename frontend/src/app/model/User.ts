import { AuditFields } from './AuditFields';

export interface User extends AuditFields {
  id: string;
  firebaseUid: string;
}