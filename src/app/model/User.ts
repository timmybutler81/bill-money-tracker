import { AuditFields } from './AuditFields.js'

export interface User extends AuditFields {
    id: string;
    email: string;
    authUser: string;

}