import { AuditFields } from './AuditFields';

export interface CategoryType extends AuditFields {
    id: string;
    name: string;
    alias: string;

}