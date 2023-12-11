import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { API, LogType } from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { GlobalToastService } from 'src/app/Toast/global-toast.service';

@Component({
  selector: 'app-update-transaction',
  templateUrl: './update-transaction.component.html',
  styleUrls: ['./update-transaction.component.scss'],
})
export class UpdateTransactionComponent implements OnInit {
  cusemail: string;
  cusname: string;
  showsubmit: any;
  cusorigData = {};
  memparkList = [];
  showConstruction = false;
  showPaments = false;
  previousUrl = '';
  constructor(
    private router: Router,
    private service: MainService,
    private toastService: GlobalToastService
  ) {}

  ngOnInit(): void {
    this.showsubmit = true;
    let id = sessionStorage.getItem('id');
    this.getMemParkData(id);
    this.getCustomer(id);
    this.previousUrl = this.service.PreviousUrl;
  }
  async getMemParkData(id) {
    await this.service
      .API(API.PARKDATA)
      .getById(id)
      .toPromise()
      .then((data) => {
        this.memparkList = data;
        this.showPaments = data.length > 0;
        this.showConstruction = data.some(
          (item: { table_id: string }) =>
            item.table_id == 'mem_id' || item.table_id == 'lawm_id'
        );
      });
  }
  getCustomer(id) {
    this.service
      .API(API.CUSTOMER)
      .getById(id)
      .toPromise()
      .then((res) => {
        Object.assign(this.cusorigData, res[0]);
        this.cusemail = res[0].email;
        this.cusname = `${res[0].firstName} ${res[0].middleName} ${res[0].lastName}`;
      });
  }
  submit(form) {
    let cusdata = {};
    cusdata['backID'] =
      form.backID.src == 'http://localhost:4200/' ? '' : form.backID.src;
    cusdata['frontID'] =
      form.frontID.src == 'http://localhost:4200/' ? '' : form.frontID.src;
    cusdata['faceimg'] =
      form.faceimg.src == 'http://localhost:4200/' ? '' : form.faceimg.src;
    cusdata['updated_at'] = this.service.CurrentDate;
    cusdata['updated_by'] = this.service.CurrentUserFullname;
    for (const data of form) {
      if (data.name != '') {
        cusdata[data.name] = data.value;
      }
    }
    delete cusdata['to'];
    delete cusdata['from'];
    delete cusdata['type'];
    let touchedData = this.service.getTouchedItem(cusdata, this.cusorigData);

    this.service
      .API(API.CUSTOMER)
      .update(this.cusorigData['id'], touchedData)
      .toPromise()
      .then((res) => {
        this.toastService.showSuccess(res.msg, 3000);
        for (let d in touchedData) {
          if (
            d != 'updated_by' &&
            d != 'updated_at' &&
            d != 'FrontID' &&
            d != 'Faceimg' &&
            d != 'BackID'
          ) {
            this.service.saveLogs(
              LogType.UPDATE,
              API.CUSTOMER,
              `${cusdata['firstName']} ${cusdata['middleName']} ${cusdata['lastName']}`,
              this.cusorigData[d],
              touchedData[d],
              d
            );
          }
        }
      })
      .catch((err) => console.log(err));
  }
}
