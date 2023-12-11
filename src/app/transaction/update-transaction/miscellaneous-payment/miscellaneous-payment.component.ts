import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { API, Confirm, Icon } from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { GlobalToastService } from 'src/app/Toast/global-toast.service';
import { PaymentFormComponent } from '../../modal/payment-form/payment-form.component';

import Docxtemplater from 'docxtemplater';
import * as PizZip from 'pizzip';
import PizZipUtils from 'pizzip/utils/index.js';
import { saveAs } from 'file-saver';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
const date = require('date-and-time');

function loadFile(url: string, callback: (error: any, content: any) => void) {
  PizZipUtils.getBinaryContent(url, callback);
}
@Component({
  selector: 'app-miscellaneous-payment',
  templateUrl: './miscellaneous-payment.component.html',
  styleUrls: ['./miscellaneous-payment.component.scss'],
})
export class MiscellaneousPaymentComponent implements OnInit {
  memparkList: [];
  memmodels: number[] = [];
  currentindex = 0;
  miscList = [];
  constructor(
    private service: MainService,
    private modalService: NgbModal,
    private toastService: GlobalToastService
  ) {}

  ngOnInit(): void {
    let id = sessionStorage.getItem('id');
    this.getMemParkData(id);
  }
  async getMemParkData(id) {
    await this.service
      .API(API.PARKDATA)
      .getById(id)
      .toPromise()
      .then((data) => {
        this.memparkList = data;
        this.memparkList.forEach((d, i) => {
          this.memmodels.push(i);
        });
        this.getIndex(0);
      });
  }
  getIndex(i: number) {
    this.currentindex = i;

    this.getMiscellaneous();
  }
  newMiscFee() {
    const modal = this.modalService.open(PaymentFormComponent, { size: 'md' });
    modal.componentInstance.title = 'Miscellaneous fee';
    modal.componentInstance.type = 1;
    modal.result.then(async (res) => {
      if (res) {
        let ordata = await this.service.getOR(1);
        this.service
          .API(API.MISCEL)
          .create({
            payment: res.payment,
            description: res.remarks,
            process_by: localStorage.getItem('email'),
            payer: res.paid_by,
            or_number: ordata.value,
            deals_id: this.memparkList[this.currentindex]['deals_id'],
          })
          .toPromise()
          .then((res) => {
            this.updateOR(ordata);
            this.toastService.showSuccess(res.msg, 3000);
          });
      }
    });
  }

  updateOR(OR) {
    let id = OR.id;
    this.service
      .API(API.OR)
      .update(id, { customer_id: sessionStorage.getItem('id') })
      .toPromise()
      .then((a) => {
        this.getMiscellaneous();
      });
  }

  getMiscellaneous() {
    let deals_id = this.memparkList[this.currentindex]['deals_id'];
    this.service
      .API(API.MISCEL)
      .searchByQuery(`deals_id=${deals_id}`)
      .toPromise()
      .then((item) => {
        this.miscList = item;
      });
  }

  deleteMiscFee(data) {
    const confmdal = this.modalService.open(ConfirmationComponent, {
      size: 'md',
    });
    confmdal.componentInstance.ConfirmationType = Confirm.DELETE;
    confmdal.componentInstance.TargetItem = ` ${data.payer}`;
    confmdal.componentInstance.IconType = Icon.DELETE;
    confmdal.result.then((res) => {
      this.service
        .API(API.MISCEL)
        .delete(data.id)
        .toPromise()
        .then((item) => {
          this.getMiscellaneous();
        })
        .catch((err) => console.log(err));
    });
  }
  async getDataAndGenerate(deals_id, ornumber) {
    await this.service
      .API(API.TEMPLATE)
      .searchByQuery("`name` = 'micellaneous_receipt_template.docx'")
      .toPromise()
      .then(async (data) => {
        let template = data[0];
        console.log(`id=${deals_id}-or_number_mc=${ornumber}`);
        await this.service
          .API(API.TEMPDATA)
          .searchByQuery(`id=${deals_id}-or_number_mc=${ornumber}`)
          .toPromise()
          .then((data) => {
            console.log('Template data', data);
            const now = new Date();

            const pattern = date.compile('dddd, MMMM DD YYYY');
            data[0]['currentTextDate'] = date.format(now, pattern);
            const pattern2 = date.compile('YYYY/MM/DD HH:mm:ss');
            data[0]['currentNumberDate'] = date.format(now, pattern2);

            data[0]['currentTextMonth'] = date.format(now, 'MMMM');
            data[0]['currentNumberMonth'] = date.format(now, 'MM');

            data[0]['currentNumberYear'] = date.format(now, 'YYYY');

            data[0]['currentTextDay'] = date.format(now, 'dddd');
            data[0]['currentNumberDay'] = date.format(now, 'DD');

            data[0]['currentTime'] = date.format(now, 'hh:mm:ss A');
            data[0]['currentHour'] = date.format(now, 'hh A');
            data[0]['currentMinute'] = date.format(now, 'mm');
            data[0]['currentSecond'] = date.format(now, 'ss');

            this.generateTemplate(
              `${data[0]['cusFullname']}${template.title}${ornumber}.docx`,
              data[0],
              template.id
            );
          })
          .catch((er) => console.log(er));
      });
  }

  async generateTemplate(fileName, data, temp_id) {
    let path = '';
    await this.service
      .API(API.TEMPLATE)
      .getById(temp_id)
      .toPromise()
      .then((response) => {
        path = response[0]['path'];
      });
    loadFile(path.replace('\\', '/'), (error: any, content: any) => {
      if (error) {
        throw error;
      }
      let zip = new PizZip(content);
      let doc = new Docxtemplater().loadZip(zip);
      doc.setData(data);
      try {
        doc.render();
      } catch (error) {
        function replaceErrors(key: any, value: { [x: string]: any }) {
          if (value instanceof Error) {
            return Object.getOwnPropertyNames(value).reduce(function (
              error,
              key
            ) {
              error[key] = value[key];
              return error;
            });
          }
          return value;
        }
        if (error.properties && error.properties.errors instanceof Array) {
          const errorMessages = error.properties.errors
            .map(function (error: { properties: { explanation: any } }) {
              return error.properties.explanation;
            })
            .join('\n');
          console.log('errorMessages', errorMessages);
        }
        throw error;
      }
      var out = doc.getZip().generate({
        type: 'blob',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      saveAs(out, fileName);
    });
  }
}
