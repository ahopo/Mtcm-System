import { Confirm, Icon, LogType, PaymentType } from './../../../helper';
import { PaymentFormComponent } from './../../modal/payment-form/payment-form.component';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { API } from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { GlobalToastService } from 'src/app/Toast/global-toast.service';
import Docxtemplater from 'docxtemplater';
import * as PizZip from 'pizzip';
import PizZipUtils from 'pizzip/utils/index.js';
import { saveAs } from 'file-saver';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
const date = require('date-and-time');
var converter = require('number-to-words-en');
function loadFile(url: string, callback: (error: any, content: any) => void) {
  PizZipUtils.getBinaryContent(url, callback);
}
@Component({
  selector: 'app-constraction-payment',
  templateUrl: './constraction-payment.component.html',
  styleUrls: ['./constraction-payment.component.scss'],
})
export class ConstractionPaymentComponent implements OnInit {
  memparkList: [];
  memmodels: number[] = [];
  currentindex = 0;
  constList = [];
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
        this.memparkList = data.filter(
          (item) => item.table_id == 'mem_id' || item.table_id == 'lawn_id'
        );
        this.memparkList.forEach((d, i) => {
          this.memmodels.push(i);
        });
        this.getIndex(0);
      });
  }
  getIndex(i: number) {
    this.currentindex = i;

    this.getConstruction();
  }
  newConstFee() {
    const modal = this.modalService.open(PaymentFormComponent, { size: 'md' });
    modal.componentInstance.title = 'Construction fee';
    modal.result.then(async (res) => {
      if (res) {
        let ordata = await this.service.getOR(0);
        let payment = res.payment;
        let payer = res.paid_by;
        console.log(res);
        this.service
          .API(API.CONSTRUCTION)
          .create({
            payment: payment,
            description: res.remarks,
            process_by: localStorage.getItem('email'),
            payer: res.paid_by,
            or_number: ordata.value,
            deals_id: this.memparkList[this.currentindex]['deals_id'],
          })
          .toPromise()
          .then(async (res) => {
            await this.service.updateOR(ordata);
            this.service.savePaymentLogs(
              PaymentType.RECIEVED,
              PaymentType.RECIEVED,
              API.CONSTRUCTION,
              `${this.memparkList[this.currentindex]['phase']} BLK ${
                this.memparkList[this.currentindex]['block']
              } LT ${this.memparkList[this.currentindex]['lot']}`,
              '0',
              payment,
              payer
            );
            this.toastService.showSuccess(res.msg, 3000);
            this.getConstruction();
          });
      }
    });
  }

  getConstruction() {
    let deals_id = this.memparkList[this.currentindex]['deals_id'];
    this.service
      .API(API.CONSTRUCTION)
      .searchByQuery(`deals_id=${deals_id}`)
      .toPromise()
      .then((item) => {
        this.constList = item;
      });
  }

  deleteConstFee(data) {
    const confmdal = this.modalService.open(ConfirmationComponent, {
      size: 'md',
    });
    confmdal.componentInstance.ConfirmationType = Confirm.DELETE;
    confmdal.componentInstance.TargetItem = ` ${data.payer}`;
    confmdal.componentInstance.IconType = Icon.DELETE;
    confmdal.result.then((yes) => {
      if (yes) {
        this.service
          .API(API.CONSTRUCTION)
          .delete(data.id)
          .toPromise()
          .then((item) => {
            this.service.savePaymentLogs(
              LogType.DELETE,
              PaymentType.DELETED,
              API.CONSTRUCTION,
              `${this.memparkList[this.currentindex]['phase']} BLK ${
                this.memparkList[this.currentindex]['block']
              } LT ${this.memparkList[this.currentindex]['lot']}`,
              '0',
              data.payment,
              data.payer
            );
            this.getConstruction();
            this.toastService.showSuccess(item.msg, 300);
          });
      }
    });
  }

  async getDataAndGenerate(deals_id, ornumber) {
    // construction_template.docx
    await this.service
      .API(API.TEMPLATE)
      .searchByQuery("`name` = 'construction_receipt_template.docx'")
      .toPromise()
      .then(async (data) => {
        let template = data[0];
        await this.service
          .API(API.TEMPDATA)
          .searchByQuery(`id=${deals_id}-or_number_ct=${ornumber}`)
          .toPromise()
          .then((data) => {
            this.generateTemplate(
              `${data[0]['cusFullname']}${template.title}${ornumber}.docx`,
              data[0],
              template.id
            );
          });
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
        // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render();
      } catch (error) {
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a properties object containing all suberrors).
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
          // errorMessages is a humanly readable message looking like this :
          // 'The tag beginning with "foobar" is unopened'
        }
        throw error;
      }
      var out = doc.getZip().generate({
        type: 'blob',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }); //Output the document using Data-URI
      saveAs(out, fileName);
    });
  }
}
