import { Injectable } from '@angular/core';

export enum ModalStatus {
  NEW,
  VIEW,
  UPDATE,
}
export enum API {
  DEALS = 'deals',
  CUSTOMER = 'customer',
  USER = 'users',
  GROUP = 'groups',
  MEMORIALLOT = 'memoriallot',
  ROLES = 'roles',
  PHASE = 'phase',
  INSTALLMENT = 'installment',
  LOGS = 'logs',
  PAYMENT = 'payment',
  BONECRYPT = 'bonecrypt',
  LAWN = 'lawn',
  APARTMENT = 'apartment',
  TEMPLATE = 'template',
  TEMPDATA = 'view/t',
  PARKDATA = 'view/p',
  OR = 'or',
  CONSTRUCTION = 'construction',
  MISCEL = 'miscellaneous',
  DECEASED = 'deceased',
}
export enum LogType {
  UPDATE = 'update',
  DELETE = 'delete',
  CREATE = 'create',
  REPLACE = 'replace',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PAYMENT = 'payment',
  APPROVED = 'approved',
}
export enum PaymentType {
  RECIEVED = 'recieved',
  DELETED = 'deleted',
  ADVANCED = 'advanced',
  PENALTY = 'penalty',
}

export enum Confirm {
  DELETE = 'Delete',
  UPDATE = 'UPDATE',
  APPROVED = 'APPROVED',
  LOGOUT = 'LOGOUT',
  REMOVE = 'Remove',
}
export enum Icon {
  DELETE = 'trash',
  LOGOUT = 'box-arrow-right',
}

export interface Iinstallment {
  id?: number;
  name: string;
  months: number;
  interest: number;
  fromvalue: number;
  tovalue: number;
  dsvalue: number;
  hasDiscount: boolean;
  created_at?: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

export interface IPayment {
  id?: number;
  isInstallment: boolean;
  isFullyPaid: boolean;
  customer_id: string;
  mem_id?: number;
  payment: number;
  balance: number;
  price: number;
  penalty: number;
  discount: number;
  interest: number;
  payment_terms: number;
  process_by?: any;
  process_at?: any;
  updated_by?: any;
  updated_at?: any;
  remarks?: string;
  isFirstDp: boolean;
  deals_id: any;
  computed_balance: any;
  monthly: number;
  paid_at?: any;
  paid_by: any;
  or_number?: any;
  is_addtional_month: any;
}

export interface IMemorialLot {
  id?: number;
  lot: any;
  block: any;
  area: any;
  description: any;
  remarks: any;
  img: any;
  phase_id: any;
  price: any;
  is_deleted: any;
  lotimage?: string | any;
  is_available: any;
  lat?: any;
  long?: any;
  locationURL?: any;
}

export interface Ilawn {
  id?: number;
  lot: any;
  block: any;
  area: any;
  description: any;
  remarks: any;
  img: any;
  phase_id: any;
  price: any;
  is_deleted: any;
  lotimage?: string | any;
  is_available: any;
  lat?: any;
  long?: any;
  locationURL?: any;
}

export interface IMemorialLotView {
  id?: number;
  customer_id: number;
  currentOwner: string;
  phase: string;
  lot: number;
  block: number;
  area: number;
  price: number;
  lotimage: any;
  lat: string;
  long: string;
  locationURL: string;
  is_available: any;
  isActive: any;
}
export interface IlawnView {
  id?: number;
  customer_id: number;
  currentOwner: string;
  phase: string;
  lot: number;
  block: number;
  area: number;
  price: number;
  lotimage: any;
  lat: string;
  long: string;
  locationURL: string;
  is_available: any;
  isActive: any;
}
export interface IBasicTable {
  id?: number;
  name?: string;
}
export interface IPhase {
  name: string;
  description: string;
  id?: number;
  updated_at?: any;
  updated_by?: any;
  created_at?: any;
  created_by?: any;
  is_deleted?: any;
}

export interface IDealsView {
  firstName: string;
  middleName: string;
  lastName: string;
  customerId: 0;
}
export interface IBoneCrypt {
  id: any;
  customer_id: any;
  currentOwner: any;
  phase: any;
  lot: any;
  block: any;
  area: any;
  price: number;
  voltimg: any;
  lat: any;
  long: any;
  locationURL: any;
  phase_id: any;
  is_available: number;
  isActive: any;
}

export interface ICustomer {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  faceimg?: any;
  phoneNumber: string;
  address: string;
  email: string;
  billingType: any;
  createdAt: Date;
  createdby: any;
  fullyPaid: any;
  frontID?: any;
  backID?: any;
  suffixName?: string;
  gender?: any;
  updated_by: any;
  updated_at: any;
  protected: any;
}
export enum CLIENTDATA {
  firstName = 'FIRST NAME',
  lastName = 'LAST NAME',
  email = 'EMAIL',
  address = 'ADDRESS',
  phoneNumber = 'PHONE NUMBER',
}

export interface IPaymentTerms {
  id?: any | number;
  date: any;
  payment: number;
  penalty: number;
  balance: number;
  remarks: string;
}
export interface IUser {
  id: any;
  firstName: any;
  middleName: any;
  lastName: any;
  img: any;
  email: any;
  phonenumber: any;
  address: any;
  username: any;
  password: any;
  groupId: any;
  groupName: any;
  created_by: any;
  code: any;
  have_supervision: any;
}

@Injectable({
  providedIn: 'root',
})
export class Helper {
  constructor() {}
  padZero(val: any, length: number) {
    let count = val.length;
    let zeros = length - count;
    let ret = '';
    for (let i = 0; i <= zeros; i++) {
      ret += '0';
    }
    ret += val;
    return ret;
  }
}
