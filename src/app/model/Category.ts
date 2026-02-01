import { AuditFields } from './AuditFields';

export interface Category extends AuditFields {
    id: string;
    userId: string;
    name: string;
    alias: string;
    typeId: string
}