import { WarningComponent } from 'src/app/modal/warning/warning.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { API } from './helper';
import { NavigationEnd, Router } from '@angular/router';
import * as date from 'date-and-time';
@Injectable({
  providedIn: 'root',
})
export class MainService {
  private baseURL: string;
  private previousUrl: string;
  private currentUrl: string;
  private cancel: boolean = false;
  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private ngbmodal: NgbModal
  ) {
    this.currentUrl = this.router.url;
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.url;
      }
    });
  }
  get PreviousUrl(): string {
    return this.previousUrl;
  }

  getAll(): Observable<any> {
    return this.httpClient.get(this.baseURL);
  }

  getId(data: any): Observable<any> {
    return this.httpClient.get(
      this.baseURL + `/id?username=${data.username}&password=${data.password}`
    );
  }
  getById(id): Observable<any> {
    return this.httpClient.get(this.baseURL + `/${id}`);
  }

  create(data: any): Observable<any> {
    if (this.cancel) {
      const modal = this.ngbmodal.open(WarningComponent);
      modal.componentInstance.Message = `Cannot create duplicate data.`;
      this.cancel = false;

      return null;
    }
    return this.httpClient.post(this.baseURL, data);
  }

  update(id: any, data: any): Observable<any> {
    return this.httpClient.patch(this.baseURL + `/${id}`, data);
  }

  delete(id: any): Observable<any> {
    return this.httpClient.delete(this.baseURL + `/${id}`);
  }

  deleteAll(): Observable<any> {
    return this.httpClient.delete(this.baseURL);
  }

  searchByQuery(query: any): Observable<any> {
    return this.httpClient.get(this.baseURL + `/q/${query}`);
  }

  private api(table: string) {
    this.baseURL = `http://server:5204/` + table;
  }
  get CurrentDate(): any {
    return date.format(new Date(), `YYYY-MM-DD HH:mm:ss`);
  }
  get CurrentMonth(): string {
    return date.format(new Date(), 'MM');
  }
  get CurrentYear(): string {
    return date.format(new Date(), 'YYYY');
  }
  get CurrentDay(): string {
    return date.format(new Date(), 'DD');
  }
  validYear(D: string) {
    console.log(
      Number.parseInt(this.CurrentYear) >= Number.parseInt(D),
      Number.parseInt(D),
      Number.parseInt(this.CurrentYear)
    );
    return Number.parseInt(this.CurrentYear) <= Number.parseInt(D);
  }

  Image(files: string | any[]) {
    if (files.length == 0 || files == undefined) return;
    return new Promise<string | ArrayBuffer>((resolve) => {
      setTimeout(() => {
        try {
          let reader = new FileReader();
          reader.readAsDataURL(files[0]);
          reader.onload = (_event) => {
            resolve(reader.result);
          };
        } catch (error) {
          return;
        }
      }, 500);
    });
  }
  CheckIfExistThenCancel(data: {}, table: any[]) {
    console.log(data, table);
    let existingData = table.filter((d) => {
      return JSON.stringify(d) == JSON.stringify(data);
    });

    this.cancel = existingData.length > 0;

    return this;
  }
  getTouchedItem(object: any, original: any) {
    let data: any = {};
    for (const item in object) {
      if (object[item] !== original[item]) {
        if (typeof object[item] == 'boolean') {
          data[item] = object[item] ? 1 : 0;
        } else {
          data[item] = object[item];
        }
      }
    }
    return data;
  }
  saveLogs(
    type: string,
    section: string,
    targetname?: string,
    from?: string,
    to?: string,
    field?: string
  ) {
    let fullname =
      localStorage.getItem('fullname')[0].toUpperCase() +
      localStorage.getItem('fullname').toLocaleLowerCase().substring(1);
    let message = `The user ${fullname} ${type} ${
      type == 'login' || type == 'logout' ? '' : targetname
    } in the ${section.toUpperCase()}`;
    this.API(API.LOGS)
      .create({
        user: localStorage.getItem('currentuser'),
        type: type,
        message: message,
        section: section,
        _from: from,
        _to: to,
        field: field,
      })
      .toPromise();
  }
  savePaymentLogs(
    type: string,
    paymentType: string,
    section: string,
    paymentFor: string,
    discount: string = '',
    amount: any = 0,
    paid_by: string
  ) {
    let currentUser = localStorage.getItem('fullname');
    let discountText = `and a discount of ${discount}`;
    let message = `The user ${currentUser} ${paymentType} the amount of ₱${amount} in ${section} paid by ${paid_by}`;
    if (paymentType == 'recieved') {
      message = ` The user ${currentUser} ${paymentType} payment for ${paymentFor} from ${paid_by} with the amount of ₱${this.numberWithCommas(
        amount
      )} ${discountText != '' ? '' : discountText}`;
    }

    this.API(API.LOGS)
      .create({
        user: localStorage.getItem('currentuser'),
        type: type,
        message: message,
        section: section,
        paymentFor: paymentFor,
        discount: discount,
        amount: amount,
        paid_by: paid_by,
      })
      .toPromise();
  }
  API(api) {
    this.api(api);
    return this;
  }
  saveApprovedLogs(
    type: string,
    section: string,
    action: string,
    targetname?: string
  ) {
    let message = `The user ${this.CurrentUserFullname} approved by ${targetname} to ${action} in ${section}`;
    this.API(API.LOGS)
      .create({
        user: localStorage.getItem('currentuser'),
        type: type,
        message: message,
        section: section,
      })
      .toPromise();
  }
  get CurrentUserFullname(): string {
    return (
      localStorage.getItem('fullname')[0].toUpperCase() +
      localStorage.getItem('fullname').toLocaleLowerCase().substring(1)
    );
  }
  b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  };
  getOR(type: number) {
    return new Promise<{ id: any; value: any }>((res) => {
      setTimeout(async () => {
        await this.API(API.OR)
          .searchByQuery(`status=1-type=${type} limit 1`)
          .toPromise()
          .then((data) => {
            if (data) {
              let OR = { id: data[0].id, value: data[0].value };
              res(OR);
            }
          })
          .catch((err) => {
            const modal = this.ngbmodal.open(WarningComponent);
            modal.componentInstance.Message =
              'No O.R Available. Please insert O.R to continue with your transaction.';
          });
      }, 1000);
    });
  }
  updateOR(OR) {
    return new Promise<boolean>((res) => {
      setTimeout(() => {
        let id = OR.id;

        this.API(API.OR)
          .update(id, { customer_id: sessionStorage.getItem('id') })
          .toPromise()
          .then((a) => {
            res(true);
            console.log(a);
          })
          .catch(() => {
            res(false);
          });
      }, 200);
    });
  }
  play(tune) {
    const audio = document.createElement('audio');
    audio.src = `./assets/audio/${tune}`;
    audio.hidden = true;
    audio.play();
  }
  numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  lastIndex(list_object: any[], index) {
    if (list_object) {
      return list_object.length - 1 == index;
    }
    return false;
  }
}
